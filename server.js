
require('dotenv').config({ path: '.env.local' });
const express = require('express');

// DEBUG: Print Env Vars
console.log("--- Backend Startup ---");
console.log("Loading .env.local...");
console.log("DEMO_MODE:", process.env.DEMO_MODE);
console.log("IMAP_USER:", process.env.IMAP_USER);
console.log("-----------------------");

const cors = require('cors');
const { pool } = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const axios = require('axios');
const path = require('path');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'spedition_askari_secret_key';

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use('/downloaded_invoices', express.static(path.join(__dirname, 'public', 'downloaded_invoices')));

// --- SMTP Configuration ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ionos.de",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // use TLS
    auth: {
        user: process.env.SMTP_USER || "invoice@askari-transport.de",
        pass: process.env.SMTP_PASS || "Askari786768"
    },
    tls: {
        rejectUnauthorized: false
    }
});

// --- IMAP Configuration (ImapFlow) ---
const imapConfig = {
    host: process.env.IMAP_HOST || 'imap.ionos.de',
    port: parseInt(process.env.IMAP_PORT || '993'),
    secure: true,
    auth: {
        user: process.env.IMAP_USER || 'invoice@askari-transport.de',
        pass: process.env.IMAP_PASS || 'A7k9M2xP'
    },
    logger: true,
    socketTimeout: 60000, // 60 seconds timeout
    tls: {
        rejectUnauthorized: false
    }
};

// --- Global IMAP Client & Helpers (Optimization) ---
let globalImapClient = null;

const getImapClient = async () => {
    if (globalImapClient) {
        if (globalImapClient.usable) return globalImapClient;
        try { await globalImapClient.logout(); } catch (e) {}
        globalImapClient = null;
    }
    
    const client = new ImapFlow(imapConfig);
    client.on('error', err => {
        console.error('[IMAP Global Error]:', err.message);
    });
    
    await client.connect();
    globalImapClient = client;
    return client;
};

const hasPdfAttachment = (structure) => {
    if (!structure) return false;
    if (structure.type === 'application' && structure.subtype === 'pdf') return true;
    if (structure.parameters && structure.parameters.name && structure.parameters.name.toLowerCase().endsWith('.pdf')) return true;
    if (structure.childNodes) return structure.childNodes.some(hasPdfAttachment);
    return false;
};

// --- IMAP Sync Route ---
app.post('/api/mail/sync-imap', async (req, res) => {
    const fs = require('fs');
    const path = require('path');
    
    // public/downloaded_invoices/ folder logic
    const publicDir = path.join(__dirname, 'public');
    const downloadDir = path.join(publicDir, 'downloaded_invoices');
    
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

    try {
        console.log(`[IMAP] Sync requested.`);

        if (process.env.DEMO_MODE === 'true') {
            return res.json({ success: true, imported: 0, message: 'Demo Mode: Sync simulated' });
        }

        const client = await getImapClient();
        console.log("[IMAP] Using active connection.");

        let lock = await client.getMailboxLock('INBOX');
        let importedCount = 0;

        try {
            // 1. Search Optimization: UNSEEN first
            let messagesList = await client.search({ unseen: true }, { uid: true });
            console.log(`[Info] UNSEEN messages found: ${messagesList.length}`);
            
            // If no unseen, fallback to 7 days
            if (messagesList.length === 0) {
                 console.log("No UNSEEN messages, checking last 7 days...");
                 const searchCriteria = { since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
                 messagesList = await client.search(searchCriteria, { uid: true });
                 console.log(`[Info] 7-day fallback found: ${messagesList.length} messages`);
            }

            // 2. Parallel Processing (Batch of 3)
            const BATCH_SIZE = 3;
            for (let i = 0; i < messagesList.length; i += BATCH_SIZE) {
                const chunk = messagesList.slice(i, i + BATCH_SIZE);
                console.log(`[Batch] Processing ${i+1}-${Math.min(i+BATCH_SIZE, messagesList.length)} of ${messagesList.length}`);
                
                await Promise.all(chunk.map(async (uid) => {
                    const uidStr = String(uid);
                    try {
                        // Check DB first (Optimization)
                        const existing = await pool.query('SELECT 1 FROM documents WHERE source = $1', [`Email-UID-${uidStr}`]);
                        if (existing.rows.length > 0) {
                             console.log(`[Skip] UID: ${uidStr} | Already in database.`);
                             return;
                        }

                        // 3. Selective Fetching: Metadata first
                        const message = await client.fetchOne(uidStr, { envelope: true, internalDate: true, bodyStructure: true }, { uid: true });
                        if (!message) return;

                        if (hasPdfAttachment(message.bodyStructure)) {
                            console.log(`[Processing] UID: ${uidStr} | PDF detected. Downloading...`);
                            
                            // Download Full Content
                            const downloadResult = await client.download(uidStr, null, { uid: true });
                            const parsed = await simpleParser(downloadResult.content);
                            
                            let hasPdf = false;
                            if (parsed.attachments && parsed.attachments.length > 0) {
                                for (const attachment of parsed.attachments) {
                                    const isPdf = attachment.contentType === 'application/pdf' || 
                                                 (attachment.filename && attachment.filename.toLowerCase().endsWith('.pdf'));
                                    
                                    if (isPdf) {
                                        hasPdf = true;
                                        const originalName = attachment.filename || `invoice_${uidStr}.pdf`;
                                        const uniqueName = `${Date.now()}_${originalName}`;
                                        const filePath = path.join(downloadDir, uniqueName);
                                        
                                        fs.writeFileSync(filePath, attachment.content);
                                        
                                        const sender = parsed.from?.text || "Unknown Sender";
                                        const emailSubject = parsed.subject || "No Subject";
                                        const receivedAt = parsed.date || new Date();
                                        const date = receivedAt.toISOString().split('T')[0];
                                        
                                        await pool.query(
                                            `INSERT INTO documents (
                                                reference, type, contact, amount, currency, status, date, 
                                                source, uploaded_by, contact_initials, file_path, 
                                                filename, subject, sender, received_at
                                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                                            [
                                                uniqueName, 'Bill', sender.split('<')[0].trim(), 0, 'EUR', 'Pending', date, 
                                                `Email-UID-${uidStr}`, 'IONOS IMAP Sync', 
                                                sender.substring(0, 2).toUpperCase(), downloadDir, 
                                                uniqueName, emailSubject, sender, receivedAt
                                            ]
                                        );
                                        importedCount++;
                                    }
                                }
                            }
                        } else {
                            console.log(`[Skip] UID: ${uidStr} | No PDF in structure.`);
                        }

                        // Mark as Seen
                        await client.messageFlagsAdd(uidStr, ['\\Seen']);

                    } catch (err) {
                        console.error(`[Error] UID ${uid}:`, err.message);
                    }
                }));
            }
        } finally {
            lock.release();
        }

        // 4. Connection Pooling: Enter IDLE instead of logout
        client.idle().catch(e => console.error("IDLE error:", e.message));
        
        console.log(`[IMAP] Sync completed. Imported: ${importedCount}`);
        res.json({ success: true, imported: importedCount });

    } catch (error) {
        console.error("[IMAP Sync Fatal Error]:", error.message);
        res.json({ success: true, imported: 0, message: 'Sync failed (Check server logs)' });
    }
});

// --- Email Routes ---
app.post('/api/mail/send-invoice', async (req, res) => {
  const { to, invoiceNo, clientName, fileName, fileContent } = req.body;
  const fs = require('fs');
  const path = require('path');
  
  console.log(`Attempting to send email to: ${to} for Invoice: ${invoiceNo}`);
  
  if (!to) {
    console.error("Email send failed: Recipient email is missing");
    return res.status(400).json({ error: 'Recipient email is required' });
  }

  // Save PDF to disk for later download
  let savedFilePath = null;
  let savedFileName = fileName || `Invoice_${invoiceNo}.pdf`;
  
  try {
    const publicDir = path.join(__dirname, 'public');
    const downloadDir = path.join(publicDir, 'downloaded_invoices');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);
    
    const filePath = path.join(downloadDir, savedFileName);
    fs.writeFileSync(filePath, Buffer.from(fileContent, 'base64'));
    savedFilePath = downloadDir;
    console.log(`[File System] Invoice saved to disk: ${savedFileName}`);
  } catch (err) {
    console.error("[File System] Failed to save invoice to disk:", err.message);
  }

  const mailOptions = {
    from: `"Spedition Askari GmbH" <${process.env.SMTP_USER || "invoice@askari-transport.de"}>`,
    to: to,
    subject: `Rechnung / Invoice: ${invoiceNo} - Spedition Askari GmbH`,
    text: `Sehr geehrte/r ${clientName},\n\nanbei erhalten Sie die Rechnung Nr. ${invoiceNo}.\n\nMit freundlichen Grüßen,\nIhr Team von Spedition Askari GmbH`,
    attachments: fileContent ? [{ filename: savedFileName, content: fileContent, encoding: 'base64' }] : []
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully! Message ID: ${info.messageId}`);
    res.json({ 
      success: true, 
      messageId: info.messageId,
      filename: savedFileName,
      filePath: savedFilePath
    });
  } catch (error) {
    console.error("SMTP Error details:", error);
    res.status(500).json({ error: 'Email Dispatch Failed', details: error.message });
  }
});

app.post('/api/upload', async (req, res) => {
  const { fileName, fileContent } = req.body;
  const fs = require('fs');
  const path = require('path');

  if (!fileName || !fileContent) {
    return res.status(400).json({ error: 'File name and content are required' });
  }

  try {
    const publicDir = path.join(__dirname, 'public');
    const downloadDir = path.join(publicDir, 'downloaded_invoices');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

    const filePath = path.join(downloadDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(fileContent, 'base64'));
    
    console.log(`[File System] File uploaded and saved: ${fileName}`);
    res.json({ success: true, filename: fileName, filePath: downloadDir });
  } catch (err) {
    console.error("[File System] Upload failed:", err.message);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// --- User Auth & Docs Routes ---
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) return res.status(400).json({ error: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email', [name, email, hashedPassword]);
    const token = jwt.sign({ id: newUser.rows[0].id }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ user: newUser.rows[0], token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) return res.status(401).json({ error: 'User not found' });
    const isValid = await bcrypt.compare(password, user.rows[0].password);
    if (!isValid) return res.status(401).json({ error: 'Invalid password' });
    const token = jwt.sign({ id: user.rows[0].id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ user: { name: user.rows[0].name, email: user.rows[0].email }, token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      // Don't reveal if user exists for security, but we'll return success anyway
      return res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await pool.query('UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3', [token, expiry, email]);

    // Send Email
    const transporter = nodemailer.createTransport({
      host: 'smtp.ionos.de',
      port: 465,
      secure: true,
      auth: {
        user: 'invoice@askari-transport.de',
        pass: 'Askari786768'
      }
    });

    const resetLink = `http://localhost:3001/reset-password?token=${token}`;

    await transporter.sendMail({
      from: '"Spedition Askari" <invoice@askari-transport.de>',
      to: email,
      subject: 'Password Reset Request - Spedition Askari',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>A password reset was requested for your Spedition Askari account.</p>
          <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #666; font-size: 12px;">Spedition Askari Dashboard</p>
        </div>
      `
    });

    res.json({ message: 'Reset link sent successfully' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  try {
    const user = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [hashedPassword, user.rows[0].id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

app.get('/api/documents', async (req, res) => {
  try {
    const docs = await pool.query('SELECT * FROM documents ORDER BY date DESC, created_at DESC');
    res.json(docs.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/documents', async (req, res) => {
  const { reference, type, contact, amount, currency, status, date, contactInitials, dueDate, uploadedBy, filename, file_path } = req.body;
  try {
    const newDoc = await pool.query(
      `INSERT INTO documents (
        reference, type, contact, amount, currency, status, date, contact_initials, due_date, uploaded_by, filename, file_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`, 
      [reference, type, contact, amount, currency, status, date, contactInitials, dueDate, uploadedBy, filename, file_path]
    );
    res.status(201).json(newDoc.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/documents/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = Object.keys(updates);
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = Object.values(updates);
  try {
    const result = await pool.query(`UPDATE documents SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`, [...values, id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/documents/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    res.json({ message: 'Document deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await pool.query('SELECT * FROM contacts ORDER BY name ASC');
    res.json(contacts.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/contacts', async (req, res) => {
  const { name, email, type, address, tax_id, balance, initials } = req.body;
  try {
    const newContact = await pool.query('INSERT INTO contacts (name, email, type, address, tax_id, balance, initials) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [name, email, type, address, tax_id, balance, initials]);
    res.status(201).json(newContact.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/contacts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM contacts WHERE id = $1', [req.params.id]);
    res.json({ message: 'Contact deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`Backend active on port ${PORT}`));
