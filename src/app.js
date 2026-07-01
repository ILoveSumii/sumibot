const { Client, LocalAuth, MessageTypes } = require('whatsapp-web.js');
const { predis, getPredi, vote, onClose } = require('./util/predictions');
const { getUser, editUser } = require('./util/user')
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const PREFIXES = [".sumi", ".Sumi", ".SUMI"];

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
    const parts = message.trim().split(/\s+/);

    if (!PREFIXES.includes(parts[0])) return null;

    return {
        command: parts[1]?.toLowerCase(),
        args: parts.slice(2)
    };
}

client.on('message', async message => {
    await sleep(1500);

    contact = await message.getContact();

    const chat = await message.getChat();
    if (chat.isGroup && !PREFIXES.includes(message.body.split(/\s+/)[0])) return;

    const parsed = parseMessage(message.body);

    if (parsed) {
        const { command, args } = parsed;
        const cmd = commands.get(command);

        if (!cmd) {
            message.reply("Comando desconocido. Usa .sumi help para ver los comandos disponibles.");
            return console.warn("Unknown command:", command);
        }

        try {
            await cmd.execute({
                client,
                message,
                args,
                MessageTypes,
                commands,
                contact
            });
        } catch (err) {
            console.error(err);
            message.reply("Error al ejecutar el comando D:");
        }

        return;
    }

    if (message.type === MessageTypes.IMAGE || message.type === MessageTypes.VIDEO) {
        await sleep(2000);
        const media = await message.downloadMedia();
        if(!media) return;
        await client.sendMessage(message.from, media, {
            sendMediaAsSticker: true
        });
    }

});

client.on('message_reaction', async reaction => {

    let predict = getPredi(reaction.msgId.id);

    if(!predict || predict.closed){
        return;
    }

    let reactionEmoji = reaction.reaction;
    let userThatReacted = (await client.getContactById(reaction.senderId)).id.user;

    if(!getUser(userThatReacted)){
        return;
    }

    vote(predict, userThatReacted, reactionEmoji);

});

onClose((predict) => {
    predict.predictionMessage.reply(`¡Predicción cerrada! | ${predict.positiveVotes.size} 👍 | ${predict.negativeVotes.size} 😢`);
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

client.initialize();