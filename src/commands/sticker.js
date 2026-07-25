import { downloadMediaMessage, getContentType } from '@whiskeysockets/baileys';
import { imageToWebp, videoToWebp } from '../util/media.js';

export default {
    name: 'sticker',
    description: 'Convierte una imagen o video en sticker',
    aliases: ['st', 's'],

    async execute({ sock, msg, jid }) {
        const msgType = getContentType(msg.message);
        const buffer = await downloadMediaMessage(msg, 'buffer', {});
        if (!buffer) return;

        if (msgType === 'imageMessage') {
            const webp = await imageToWebp(buffer);
            await sock.sendMessage(jid, { sticker: webp }, { quoted: msg });
        } else if (msgType === 'videoMessage') {
            const webp = await videoToWebp(buffer);
            await sock.sendMessage(jid, { sticker: webp }, { quoted: msg });
        }
    }
};