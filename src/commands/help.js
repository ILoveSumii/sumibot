export default {
    name: 'help',
    description: 'Muestra la lista de comandos o detalles de uno',
    longDescription: `Muestra la lista de comandos disponibles y una descripción de ellos.
    
    Argumentos: [comando] (opcional) : Si se especifica un comando, muestra una descripción detallada.`,
    usage: '.sumi help [comando]',
    aliases: ['h'],

    async execute({ sock, msg, args, jid, commands }) {
        if (args.length > 0) {
            const query = args[0].toLowerCase();
            const cmd = commands.get(query);

            if (!cmd) {
                await sock.sendMessage(jid, { text: `No existe tal comando: ${query}` }, { quoted: msg });
                return;
            }

            await sock.sendMessage(jid, { text: 
`*Comando:* .sumi ${cmd.name}

*Descripción:*
${cmd.longDescription || cmd.description}

*Uso:*
${cmd.usage || '.sumi ' + cmd.name}

${cmd.aliases ? '*Aliases:* ' + cmd.aliases.join(', ') : ''}`
            }, { quoted: msg });
            return;
        }

        const uniqueCommands = new Map();
        for (const [, cmd] of commands) {
            if (!uniqueCommands.has(cmd.name)) {
                uniqueCommands.set(cmd.name, cmd);
            }
        }

        let response = '*Lista de comandos:*\n\n';
        uniqueCommands.forEach(cmd => {
            response += `*.sumi ${cmd.name}* → ${cmd.description}\n`;
        });
        response += '\nUsa *.sumi help [comando]* para más detalles';
        response += '\n\nDejá la estrellita y colaborá en GitHub: https://github.com/ILoveSumii/sumibot';

        await sock.sendMessage(jid, { text: response }, { quoted: msg });
    }
};