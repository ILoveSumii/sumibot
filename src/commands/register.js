import { createUser, userExists, userNameExists } from '../util/user.js';

export default {
    name: 'register',
    description: 'Registra un nuevo usuario en el sistemita del bot | .sumi register [nombre]',
    longDescription: 'Registrarse en el sistemita del bot para usar varios comandos adicionales.\nSe registrará el número de teléfono como identificador.',
    usage: '.sumi register [nombre]',
    aliases: ['reg'],

    async execute({ sock, msg, args, jid, senderNumber }) {
        const contactUsername = args.length > 0 ? args.join(' ') : msg.pushName || senderNumber;

        if (userExists(senderNumber)) {
            await sock.sendMessage(jid, { text: 'Ya estás registrado.' }, { quoted: msg });
            return;
        }

        if (contactUsername.length > 15) {
            await sock.sendMessage(jid, { text: 'Nombre menos largo por fa :c (max. 15 letras)' }, { quoted: msg });
            return;
        }

        if (userNameExists(contactUsername)) {
            await sock.sendMessage(jid, { text: 'Alguien más ya tiene ese nombre :P' }, { quoted: msg });
            return;
        }

        createUser(senderNumber, contactUsername);
        await sock.sendMessage(jid, { text: `Listo, ${contactUsername} ;3 | 100 Sumicoins pa ti.` }, { quoted: msg });
    }
};  