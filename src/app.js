const { Client, LocalAuth, MessageTypes } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const PREFIX = ".sumi";

const client = new Client({
    authStrategy: new LocalAuth()
});

const commands = new Map();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath);

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    if (!command.name || typeof command.execute !== "function") {
        console.warn(`Not valid command: ${file}`);
        continue;
    }

    commands.set(command.name, command);

    if (command.aliases) {
        command.aliases.forEach(alias => {
            commands.set(alias, command);
        });
    }
}

client.once('ready', () => {
    console.log('Client is ready!');
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

function parseMessage(message) {
    if (!message.startsWith(PREFIX)) return null;

    const parts = message.trim().split(/\s+/);

    return {
        command: parts[1]?.toLowerCase(),
        args: parts.slice(2)
    };
}

client.on('message', async message => {
    await sleep(1000);
    const parsed = parseMessage(message.body);

    if (parsed) {
        const { command, args } = parsed;
        const cmd = commands.get(command);

        if (!cmd) {
            return console.warn("Unknown command:", command);
        }

        try {
            await cmd.execute({
                client,
                message,
                args,
                MessageTypes
            });
        } catch (err) {
            console.error(err);
            message.reply("Uy, tuve un error al ejecutar eso.");
        }

        return;
    }

    if (!message.getChat().isGroup) {
        if (message.type === MessageTypes.IMAGE || message.type === MessageTypes.VIDEO) {
                await sleep(2000);
                const media = await message.downloadMedia();
                await client.sendMessage(message.from, media, {
                    sendMediaAsSticker: true
                });
        }
    }

});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

client.initialize();