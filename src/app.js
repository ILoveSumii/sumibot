const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.once('ready', () => {
    console.log('Client is ready!');
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('message', async message => {
    await sleep(1000);
    client.sendMessage(message.from, message.body);
})

async function sleep(timeInMilliseconds){
    return new Promise(resolve => setTimeout(resolve, timeInMilliseconds));
}

client.initialize();