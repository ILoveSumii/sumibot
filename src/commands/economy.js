import { getUser } from '../util/user.js';

const subcommands = new Map();

subcommands.set('help', async ({ sock, msg, jid }) => {
    let response = `*Comandos de economía:*\n\n`;
    subcommands.forEach((_, cmd) => {
        if (cmd !== 'help') response += `.sumi economy ${cmd}\n`;
    });
    await sock.sendMessage(jid, { text: response }, { quoted: msg });
});

subcommands.set('balance', async ({ sock, msg, jid, senderNumber }) => {
    const user = getUser(senderNumber);
    if (!user) {
        await sock.sendMessage(jid, { text: 'No estás registrado. Usa *.sumi economy register* para registrarte.' }, { quoted: msg });
        return;
    }
    await sock.sendMessage(jid, { text: `Tienes ${user.sumicoins}🌸 Sumicoins 3:` }, { quoted: msg });
});

export default {
    name: 'economy',
    description: 'Economía basada en Sumicoins :D',
    longDescription: 'Economía con Sumicoins. Solo puede usarse si se está registrado.',
    usage: '.sumi economy [help]',
    aliases: ['eco', 'e'],

    async execute({ sock, msg, args, jid, senderNumber }) {
        const sub = args[0]?.toLowerCase();

        if (!sub) {
            await sock.sendMessage(jid, { text: 'Usa *.sumi economy help*' }, { quoted: msg });
            return;
        }

        const subcommand = subcommands.get(sub);

        if (!subcommand) {
            await sock.sendMessage(jid, { text: `Subcomando desconocido: ${sub}` }, { quoted: msg });
            return;
        }

        await subcommand({ sock, msg, args, jid, senderNumber });
    }
};