module.exports = {
    name: "sticker",
    description: "Convierte una imagen o video en sticker",
    aliases: ["st", "s"],

    async execute({ client, message, MessageTypes }) {

        const media = await message.downloadMedia();
        await new Promise(resolve => setTimeout(resolve, 2000));
        if(!media) return;
        await client.sendMessage(message.from, media, {
            sendMediaAsSticker: true
        });
    }
};