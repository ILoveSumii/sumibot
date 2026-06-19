module.exports = {
    name: "help",
    description: "Muestra la lista de comandos o detalles de uno",
    longDescription: `Muestra la lista de comandos disponibles y una descripción de ellos.
    
    Argumentos: [comando] (opcional) : Si se especifica un comando, muestra una descripción detallada del comando y el uso del mismo, así como también sus alias.`,
    usage: ".sumi help [comando]",
    aliases: ["h"],

    async execute({ message, args, commands }) {

        if (args.length > 0) {
            const query = args[0].toLowerCase();
            const cmd = commands.get(query);

            if (!cmd) {
                return message.reply("No existe tal comando: " + query);
            }

            return message.reply(
                `*Comando:* .sumi ${cmd.name}

*Descripción:*
${cmd.longDescription || cmd.description}

*Uso:*
${cmd.usage || ".sumi " + cmd.name}

${cmd.aliases ? "*Aliases:* " + cmd.aliases.join(", ") : ""}`
            );
        }

        const uniqueCommands = new Map();

        for (const [, cmd] of commands) {
            if (!uniqueCommands.has(cmd.name)) {
                uniqueCommands.set(cmd.name, cmd);
            }
        }

        let response = "*Lista de comandos:*\n\n";

        uniqueCommands.forEach(cmd => {
            response += `• *.sumi ${cmd.name}* → ${cmd.description}\n`;
        });

        response += "\nUsa *.sumi help [comando]* para más detalles";

        message.reply(response);
    }
};