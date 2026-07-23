import { getUser } from '../util/user.js';

export default {
    name: 'balance',
    description: 'Muestra el saldo de Sumicoins del usuario',
    usage: '.sumi balance',
    aliases: ['money', 'bal'],

    async execute({ sock, msg, jid, senderNumber }) {
        const user = getUser(senderNumber);

        if (!user) {
            await sock.sendMessage(jid, { text: 'No estás registrado. Usa *.sumi register* para registrarte.' }, { quoted: msg });
            return;
        }

        await sock.sendMessage(jid, { text: `Tienes ${user.sumicoins}🌸 Sumicoins 3:` }, { quoted: msg });
    }
};