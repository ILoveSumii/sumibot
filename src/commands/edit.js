import { getUser, userNameExists, editUser } from '../util/user.js';

const subcommands = new Map();

subcommands.set('help', async ({ sock, msg, jid }) => {
    let response = `*Cositas q puedes editar:*\n\n`;
    subcommands.forEach((_, cmd) => {
        if (cmd !== 'help') response += `.sumi edit ${cmd}\n`;
    });
    await sock.sendMessage(jid, { text: response }, { quoted: msg });
});

subcommands.set('nombre', async ({ sock, msg, jid, senderNumber, args }) => {
    const user = getUser(senderNumber);

    if (!user) {
        await sock.sendMessage(jid, { text: 'No estás registrado. Usa *.sumi register* para registrarte.' }, { quoted: msg });
        return;
    }

    const newName = args.slice(1).join(' ');

    if (!newName) {
        await sock.sendMessage(jid, { text: 'No pusiste nada. *.sumi edit nombre [nuevo_nombre]*' }, { quoted: msg });
        return;
    }

    if (userNameExists(newName)) {
        await sock.sendMessage(jid, { text: 'Ya alguien tiene ese nombre u.u' }, { quoted: msg });
        return;
    }

    if (newName.length > 15) {
        await sock.sendMessage(jid, { text: 'Muy largo :d max. 15 caracteres.' }, { quoted: msg });
        return;
    }

    editUser(senderNumber, { username: newName });
    await sock.sendMessage(jid, { text: `Ya quedó tu nuevo nombre, ${newName} n.n` }, { quoted: msg });
});

export default {
    name: 'edit',
    description: 'Edita la información de tu usuario de sumibot',
    usage: '.sumi edit [algo]',

    async execute({ sock, msg, args, jid, senderNumber }) {
        const sub = args[0]?.toLowerCase();

        if (!sub) {
            await subcommands.get('help')({ sock, msg, jid });
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