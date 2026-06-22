const { getUser, saveUser, createUser, userExists } = require('../util/user');

module.exports = {
    name: "register",
    description: "Registra un nuevo usuario en el sistemita del bot",
    longDescription: "Registrarse en el sistemita del bot para usar varios comandos adicionales.\nSe registrará el número de teléfono como identificador.",
    aliases: ["reg"],

    async execute({ client, message, MessageTypes }) {
        const contact = await message.getContact();
        const contactIdUser = contact.id.user;

        if (userExists(contactIdUser)) {
            return message.reply("Ya estás registrado.");
        }

        await createUser(contactIdUser);
        message.reply("Te has registrado a sumibot :3 . Ahí van 100 sumicoins de regalo :D");
    }
};