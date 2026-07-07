const { getUser, saveUser, createUser, userExists } = require('../util/user');

module.exports = {
    name: 'coinflip',
    description: 'Tira un carisellazo 50/50',
    usage: '.sumi coinflip',
    aliases: ['cf', 'carisellazo', 'carasello', 'cs'],

    async execute({ message, args, contact }) {

        const emotes = ['3:', ':O', ':d', ':p', ':l', ':s'];

        message.reply(`Moneda al aire y...\n*${Math.random() < 0.5 ? 'Cara!' : 'Sello!'} ${emotes.at(Math.floor(Math.random() * emotes.length))}*`);
    }
        
};