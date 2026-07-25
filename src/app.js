import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, getContentType, downloadMediaMessage } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { getPredi, vote, onClose } from './util/predictions.js';
import { imageToWebp, videoToWebp } from './util/media.js';
import { getUser } from './util/user.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PREFIXES = [".sumi", ".Sumi", ".SUMI"];
const commands = new Map();

const commandsPath = join(__dirname, "commands");
const commandFiles = readdirSync(commandsPath);

for (const file of commandFiles) {
    const command = (await import(`./commands/${file}`)).default;

    if (!command.name || typeof command.execute !== "function") {
        console.warn(`Not valid command: ${file}`);
        continue;
    }

    commands.set(command.name, command);

    if (command.aliases) {
        command.aliases.forEach(alias => commands.set(alias, command));
    }
}

function parseMessage(body) {
    const parts = body.trim().split(/\s+/);
    if (!PREFIXES.includes(parts[0])) return null;
    return {
        command: parts[1]?.toLowerCase(),
        args: parts.slice(2)
    };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            console.log(await QRCode.toString(qr, { type: 'terminal', small: true, scale: 2 }));
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('Client is ready!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (msg.key.fromMe) continue;
            if (!msg.message) continue;

            await sleep(2500);

            const jid = msg.key.remoteJid;
            const isGroup = jid.endsWith('@g.us');
            const senderLid = isGroup ? msg.key.participant : jid;
            const senderNumber = senderLid.split('@')[0];

            console.log(jid, senderNumber, msg.pushName, msg.message.text || msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption);

            const msgType = getContentType(msg.message);
            const body = msg.message?.conversation
                || msg.message?.extendedTextMessage?.text
                || msg.message.imageMessage?.caption 
                || msg.message.videoMessage?.caption
                || '';

            const parsed = parseMessage(body);

            if (parsed) {
                const { command, args } = parsed;
                const cmd = commands.get(command);

                console.log(`Command: ${command}, Args: ${args.join(' ')}`);

                if (!cmd) {
                    await sock.sendMessage(jid, { text: 'Comando desconocido. Usa .sumi help para ver los comandos disponibles.' }, { quoted: msg });
                    console.warn('Unknown command:', command);
                    continue;
                }

                try {
                    await cmd.execute({ sock, msg, args, commands, senderNumber, jid });
                } catch (err) {
                    console.error(err);
                    await sock.sendMessage(jid, { text: 'Error al ejecutar el comando D:' }, { quoted: msg });
                }

                continue;
            }

            if ((msgType === 'imageMessage' || msgType === 'videoMessage') && !isGroup) {
                console.log('Received media message, converting to sticker...');
                await sleep(2000);
                const buffer = await downloadMediaMessage(msg, 'buffer', {});
                if (!buffer) continue;
                const webp = msgType === 'imageMessage' ? await imageToWebp(buffer) : await videoToWebp(buffer);
                await sock.sendMessage(jid, { sticker: webp });
            }
        }
    });

    sock.ev.on('messages.reaction', async (reactions) => {
        for (const { key, reaction } of reactions) {
            const msgId = key.id;
            const predict = getPredi(msgId);

            if (!predict || predict.closed) continue;

            const reactionEmoji = reaction.text;
            const senderNumber = reaction.key?.participant?.split('@')[0] || key.remoteJid.split('@')[0];

            const usuario = await getUser(senderNumber);
            if (!usuario) continue;

            vote(predict, senderNumber, reactionEmoji);
        }
    });

    onClose(async (predict) => {
        const jid = predict.predictionMessage.key.remoteJid;
        await sock.sendMessage(jid, {
            text: `¡Predicción cerrada! | ${predict.positiveVotes.size} 👍 | ${predict.negativeVotes.size} 😢`
        }, { quoted: predict.predictionMessage });
    });

    return sock;
}

connectToWhatsApp();