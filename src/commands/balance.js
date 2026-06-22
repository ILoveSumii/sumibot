const { getUser, saveUser, createUser, userExists } = require('../util/user');

module.exports = {
    name: 'balance',
    description: 'Muestra el saldo de Sumicoins del usuario',
    usage: '.sumi balance',
    aliases: ['money', 'bal'],

    async execute({ message, args, contact }) {
        const userId = contact.id.user;
        const user = await getUser(userId);

        if (!user) {
            return message.reply('No estás registrado. Usa *.sumi register* para registrarte.');
        }

        message.reply(`Tienes ${user.sumicoins}🌸 Sumicoins 3:`);
    }
        
};