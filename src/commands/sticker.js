import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
    name: 'sticker',
    description: 'Convierte una imagen o video en sticker',
    aliases: ['st', 's'],

    async execute({ sock, msg, jid }) {
        const buffer = await downloadMediaMessage(msg, 'buffer', {});
        if (!buffer) return;
        await new Promise(resolve => setTimeout(resolve, 2000));
        await sock.sendMessage(jid, { sticker: buffer });
    }
};