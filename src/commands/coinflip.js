
export default {
    name: 'coinflip',
    description: 'Tira un carisellazo 50/50',
    usage: '.sumi coinflip',
    aliases: ['cf', 'carisellazo', 'carasello', 'cs'],

    async execute({ sock, msg, jid }) {

        const emotes = ['3:', ':O', ':d', ':p', ':l', ':s'];

        await sock.sendMessage(jid, { text: `Moneda al aire y...\n*${Math.random() < 0.5 ? 'Cara!' : 'Sello!'} ${emotes.at(Math.floor(Math.random() * emotes.length))}*` }, { quoted: msg })
    }
        
};