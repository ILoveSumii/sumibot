const { getUser, saveUser, createUser, userExists, userNameExists } = require('../util/user');

module.exports = {
    name: "register",
    description: "Registra un nuevo usuario en el sistemita del bot | .sumi register [nombre]",
    longDescription: "Registrarse en el sistemita del bot para usar varios comandos adicionales.\nSe registrará el número de teléfono como identificador.",
    usage: ".sumi register [nombre]",
    aliases: ["reg"],

    async execute({ client, message, args, MessageTypes }) {
        const contact = await message.getContact();
        const contactIdUser = contact.id.user;
        const contactuserName = args.length > 0 ? args.join(" ") : contact.pushname || contact.number;

        if (userExists(contactIdUser)) {
            return message.reply("Ya estás registrado.");
        }

        if(contactuserName.length > 15){
            return message.reply("Nombre menos largo por fa :c (max. 15 letras)");
        }

        if(userNameExists(contactuserName)) {
            return message.reply("Alguien más ya tiene ese nombre :P");
        }

        await createUser(contactIdUser, contactuserName);
        message.reply(`Listo, ${contactuserName} ;3 | 100 Sumicoins pa ti.`);
    }
};