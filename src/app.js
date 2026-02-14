const { Client, LocalAuth } = require('whatsapp-web.js');

// Create a new client instance
const client = new Client({
    authStrategy: new LocalAuth()
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log('Client is ready!');
});

// When the client received QR-Code
client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
});

client.on('message', async message => {
    await sleep(1000);
    client.sendMessage(message.from, message.body);
})

async function sleep(timeInMilliseconds){
    return new Promise(resolve => setTimeout(resolve, timeInMilliseconds));
}

// Start your client
client.initialize();