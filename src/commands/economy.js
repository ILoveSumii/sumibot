const { getUser, saveUser, createUser, userExists } = require('../util/user');

module.exports = {
    name: 'economy',
    description: 'Economía basada en Sumicoins :D',
    longDescription: 'Economía con Sumicoins. Solo puede usarse si se está registrado.',
    usage: '.sumi economy [help]',
    aliases: ['eco', 'e'],

    async execute({ message, args, contact }) {
        const sub = args[0]?.toLowerCase();

        if (!sub) {
            return message.reply('Usa *.sumi economy help*');
        }

        const subcommand = subcommands.get(sub);

        if (!subcommand) {
            return message.reply(`Subcomando desconocido: ${sub}`);
        }

        await subcommand({ message, contact });
    }
};

const subcommands = new Map();

subcommands.set('help', async ({ message }) => {

    subcommandsList = subcommands.keys();
    let response = `*Comandos de economía:*\n\n`;

    subcommandsList.forEach(cmd => {
        response += `.sumi economy ${cmd}\n`;
    });

    message.reply(response);

});

subcommands.set('balance', async ({ message, contact }) => {
    const userId = contact.id.user;
    const user = await getUser(userId);

    if (!user) {
        return message.reply('No estás registrado. Usa *.sumi economy register* para registrarte.');
    }

    message.reply(`Tienes ${user.sumicoins}🌸 Sumicoins 3:`);
});