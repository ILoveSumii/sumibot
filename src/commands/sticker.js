module.exports = {
    name: "sticker",
    description: "Convierte una imagen o video en sticker",
    aliases: ["st", "s"],

    async execute({ client, message, MessageTypes }) {

        const media = await message.downloadMedia();

        await client.sendMessage(message.from, media, {
            sendMediaAsSticker: true
        });
    }
};