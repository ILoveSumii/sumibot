const { getUser, editUser } = require('../util/user');
const { createPrediction, getPredi, closePrediction } = require ('../util/predictions')

module.exports = {
    name: 'predict',
    description: 'Predicciones para obtener Sumicoins :P',
    usage: '.sumi predict [Premio] [Limite (minutos)] [Prediccion]',
    aliases: ['pred', 'p'],

    async execute({ message, args, contact }) {

        let predAuthor = await getUser(contact.id.user);

        if(predAuthor.username !== 'ILoveSumi'){
            return;
        }

        if(message.hasQuotedMsg && getPredi((await message.getQuotedMessage()).id.id)){
            predictToResolve = getPredi((await message.getQuotedMessage()).id.id);

            if(predictToResolve.resolved){
                return;
            }

            if(!predictToResolve.closed){
                closePrediction(predictToResolve.predictionMessage.id.id)
                await sleep(3000);
            }
            
            let winners = []
            let winnersNames = [];

            let predictionResolvedMessage = ``;

            const thumbsUp = new Set([
              '👍',
              '👍🏻',
              '👍🏼',
              '👍🏽',
              '👍🏾',
              '👍🏿',
            ]);

            if(thumbsUp.has(args[0])){
                winners = predictToResolve.positiveVotes
                for(const winner of winners){
                    const userWinner = await getUser(winner);
                    winnersNames.push(userWinner.username);
                    userWinner.sumicoins += predictToResolve.sumicoinsPrize;
                    await editUser(userWinner.id, userWinner)
                }

                predictionResolvedMessage = `Ganó el sí (👍) | *+${predictToResolve.sumicoinsPrize}🌸 para:*\n`;
                if(winners.size <= 0){
                    predictionResolvedMessage += `¡Nadie! u.u`;
                } else {
                    winnersNames.forEach((name) => {
                        predictionResolvedMessage += `${name}\n`;
                    });
                    predictionResolvedMessage += `\nFelicidades n.n`;
                }

                predictToResolve.predictionMessage.reply(predictionResolvedMessage);
            } else if (args[0] == '😢') {
                winners = predictToResolve.negativeVotes
                for(const winner of winners){
                    const userWinner = await getUser(winner);
                    winnersNames.push(userWinner.username);
                    userWinner.sumicoins += predictToResolve.sumicoinsPrize;
                    await editUser(userWinner.id, userWinner)
                }

                predictionResolvedMessage = `Ganó el no (😢) | *+${predictToResolve.sumicoinsPrize}🌸 para:*\n`;
                if(winners.size <= 0){
                    predictionResolvedMessage += `¡Nadie! u.u`;
                } else {
                    winnersNames.forEach((name) => {
                        predictionResolvedMessage += `${name}\n`;
                    });
                    predictionResolvedMessage += `\nFelicidades n.n`;
                }

                predictToResolve.predictionMessage.reply(predictionResolvedMessage);
            } else if (args[0] == 'cancel'){
                predictToResolve.predictionMessage.reply(`¡Predicción cancelada 3:!`)
            }
            return;
        }

        let prizeInSumicoins = args[0];
        let timeLimitInMinutes = args[1];
        let prediction = args.slice(2).join(' ');

        if(args.length < 3){
            return;
        }

        if(!prizeInSumicoins || prizeInSumicoins <= 0 || isNaN(prizeInSumicoins)) {
            return;
        }

        if(!timeLimitInMinutes || timeLimitInMinutes <= 0 || isNaN(timeLimitInMinutes)) {
            return;
        }

        if(!prediction){
            return;
        }

        prizeInSumicoins = parseInt(prizeInSumicoins)
        let predictionMessageBody = `*Por ${prizeInSumicoins}🌸 Sumicoins | Expira en ${timeLimitInMinutes == 1 ? '1 minuto*' : `${timeLimitInMinutes} minutos*`}\n${prediction}\n\nReaccionar 👍(Sí) / 😢(No)`;

        let predictionMessage = await message.reply(predictionMessageBody);
        return await createPrediction(prizeInSumicoins, timeLimitInMinutes, predictionMessage);

    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}