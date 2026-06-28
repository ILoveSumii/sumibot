const { getUser, userNameExists, editUser, userExists } = require('../util/user');

module.exports = {
    name: "edit",
    description: "Edita la información de tu usuario de sumibot",
    usage: ".sumi edit [algo]",

    async execute({ client, message, args, MessageTypes }) {
        const sub = args[0]?.toLowerCase();

        if (!sub) {
            await subcommands.get('help')({ message });
            return;
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
    let response = `*Cositas q puedes editar:*\n\n`;

    subcommandsList.forEach(cmd => {
        if(cmd !== 'help'){
            response += `.sumi edit ${cmd}\n`;
        }
    });

    message.reply(response);

});

subcommands.set('nombre', async ({ message, contact }) => {
    const userId = contact.id.user;
    const user = await getUser(userId);

    if (!user) {
        return message.reply('No estás registrado. Usa *.sumi register* para registrarte.');
    }

    const newName = message.body.split(' ').slice(3).join(' ');

    if (userNameExists(newName)) {
        return message.reply('Ya alguien tiene ese nombre u.u');
    }

    if (!newName) {
        return message.reply('No pusiste nada. *.sumi edit nombre [nuevo_nombre]*');
    }

    if (newName.length > 15) {
        return message.reply('Muy largo :d max. 15 caracteres.');
    }

    await editUser(userId, { username: newName });

    message.reply(`Ya quedo tu nuevo nombre, ${newName}`);
});