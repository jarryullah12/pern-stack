const { ImapFlow } = require('imapflow');
require('dotenv').config({ path: '.env.local' });

async function testHost(host) {
    const imapConfig = {
        host: host,
        port: 993,
        secure: true,
        auth: {
            user: 'invoice@askari-transport.de',
            pass: 'A7k9M2xP'
        },
        logger: false,
        tls: {
            rejectUnauthorized: false
        }
    };

    const client = new ImapFlow(imapConfig);
    try {
        console.log(`Testing ${host}...`);
        await client.connect();
        console.log(`Connected to ${host}!`);
        await client.logout();
        return true;
    } catch (err) {
        console.error(`Failed ${host}:`, err.message);
        return false;
    }
}

async function run() {
    await testHost('imap.ionos.de');
    await testHost('imap.ionos.com');
}

run();