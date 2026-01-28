const Imap = require('imap');
const { simpleParser } = require('mailparser');

const imap = new Imap({
  user: 'invoice@askari-transport.de',
  password: 'Askari786768',
  host: 'imap.ionos.de',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
});

function openInbox(cb) {
  imap.openBox('INBOX', true, cb);
}

imap.once('ready', function() {
  console.log('IMAP Ready!');
  openInbox(function(err, box) {
    if (err) throw err;
    console.log('Inbox opened');
    imap.end();
  });
});

imap.once('error', function(err) {
  console.log('IMAP Error:', err);
});

imap.once('end', function() {
  console.log('Connection ended');
});

imap.connect();
