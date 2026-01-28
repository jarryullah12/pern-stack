const { ImapFlow } = require('imapflow');
require('dotenv').config({ path: '.env.local' });

const imapConfig = {
    host: 'imap.ionos.de',
    port: 993,
    secure: true,
    auth: {
        user: 'invoice@askari-transport.de',
        pass: 'Askari786768'
    },
    disableCompression: true,
    logger: false,
    tls: {
        rejectUnauthorized: false
    }
};

async function test() {
    const client = new ImapFlow(imapConfig);
    try {
        console.log('Connecting...');
        await client.connect();
        console.log('Connected!');
        await client.logout();
        console.log('Logged out.');
    } catch (err) {
        console.error('Connection failed:', err);
    }
}

test();
