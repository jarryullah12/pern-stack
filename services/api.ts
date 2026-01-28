
/**
 * Spedition Askari API Service
 * With Smart Hybrid Mode: Automatically switches to LocalStorage if Backend is offline.
 */

const API_BASE_URL = 'http://localhost:5020/api';

// Helper to normalize data from Postgres (snake_case) to Frontend (camelCase)
const normalizeDoc = (doc: any) => ({
  ...doc,
  contactInitials: doc.contact_initials || doc.contactInitials,
  dueDate: doc.due_date || doc.dueDate,
  uploadedBy: doc.uploaded_by || doc.uploadedBy,
  filePath: doc.file_path || doc.filePath,
  fileName: doc.filename || doc.fileName
});

const isBackendAvailable = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const response = await fetch(`${API_BASE_URL}/documents`, { 
      method: 'GET', 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch (e) {
    return false;
  }
};

const handleRequest = async (url: string, options: RequestInit, localKey: string, fallbackData: any = []) => {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    if (!response.ok) throw new Error('Backend error');
    const data = await response.json();
    return Array.isArray(data) ? data.map(normalizeDoc) : normalizeDoc(data);
  } catch (err) {
    console.warn(`Backend unreachable at ${url}. Using Local Storage fallback.`);
    const localData = localStorage.getItem(localKey);
    return localData ? JSON.parse(localData) : fallbackData;
  }
};

export const api = {
  getMode: async () => {
    return await isBackendAvailable() ? 'PostgreSQL (Live)' : 'Local (Demo Mode)';
  },

  syncEmailInvoices: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/mail/sync-imap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        // Return silent failure instead of throwing
        return { success: true, imported: 0, silent_error: true };
      }
      return await response.json();
    } catch (err: any) {
      if (err.message.includes('fetch')) {
        return { success: false, demo: true, error: "Server offline" };
      }
      // Return silent failure
      return { success: true, imported: 0, silent_error: true };
    }
  },

  login: async (credentials: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }
      return await response.json();
    } catch (err: any) {
      if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
        return { user: { name: 'Demo Admin', email: credentials.email }, token: 'mock-token' };
      }
      throw err;
    }
  },

  signup: async (userData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Signup failed');
      }
      return await response.json();
    } catch (err: any) {
      if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
         return { user: { name: userData.name, email: userData.email }, token: 'mock-token' };
      }
      throw err;
    }
  },

  forgotPassword: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to send reset link');
    return data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to reset password');
    return data;
  },

  uploadFile: async (fileName: string, fileContent: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, fileContent }),
      });
      if (!response.ok) throw new Error('Upload failed');
      return await response.json();
    } catch (err: any) {
      console.warn("Upload failed, skipping file save:", err.message);
      return { success: false, error: err.message };
    }
  },

  sendInvoiceEmail: async (emailData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/mail/send-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }
      return await response.json();
    } catch (err: any) {
      if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
        return { success: true, message: 'Demo Mode: Email simulated', demo: true };
      }
      throw err;
    }
  },

  getDocuments: async () => {
    return await handleRequest('/documents', { method: 'GET' }, 'local_docs', []);
  },

  createDocument: async (doc: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      if (!response.ok) throw new Error('Create failed');
      const data = await response.json();
      return normalizeDoc(data);
    } catch (e) {
      // PERSIST TO LOCAL STORAGE FOR DEMO MODE
      const localDocs = JSON.parse(localStorage.getItem('local_docs') || '[]');
      const newDoc = { ...doc, id: Date.now().toString() };
      localDocs.unshift(newDoc);
      localStorage.setItem('local_docs', JSON.stringify(localDocs));
      return newDoc;
    }
  },

  updateDocument: async (id: string | number, updates: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      return normalizeDoc(data);
    } catch (e) {
      const localDocs = JSON.parse(localStorage.getItem('local_docs') || '[]');
      const index = localDocs.findIndex((d: any) => d.id === id);
      if (index !== -1) {
        localDocs[index] = { ...localDocs[index], ...updates };
        localStorage.setItem('local_docs', JSON.stringify(localDocs));
      }
      return { id, ...updates };
    }
  },

  deleteDocument: async (id: string | number) => {
    try {
      await fetch(`${API_BASE_URL}/documents/${id}`, { method: 'DELETE' });
    } catch(e) {
      const localDocs = JSON.parse(localStorage.getItem('local_docs') || '[]');
      const filtered = localDocs.filter((d: any) => d.id !== id);
      localStorage.setItem('local_docs', JSON.stringify(filtered));
    }
    return id;
  },

  getContacts: async () => {
    return await handleRequest('/contacts', { method: 'GET' }, 'local_contacts', []);
  },

  createContact: async (contact: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      });
      return await response.json();
    } catch (e) {
      const localContacts = JSON.parse(localStorage.getItem('local_contacts') || '[]');
      const newContact = { ...contact, id: Date.now().toString() };
      localContacts.unshift(newContact);
      localStorage.setItem('local_contacts', JSON.stringify(localContacts));
      return newContact;
    }
  },

  deleteContact: async (id: string | number) => {
    try {
      await fetch(`${API_BASE_URL}/contacts/${id}`, { method: 'DELETE' });
    } catch(e) {
      const localContacts = JSON.parse(localStorage.getItem('local_contacts') || '[]');
      const filtered = localContacts.filter((c: any) => c.id !== id);
      localStorage.setItem('local_contacts', JSON.stringify(filtered));
    }
    return id;
  },
};
