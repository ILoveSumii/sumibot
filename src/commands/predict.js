import { getUser, editUser } from '../util/user.js';
import { createPrediction, getPredi, closePrediction, reopenPrediction } from '../util/predictions.js';

const THUMBS_UP = new Set(['👍', '👍🏻', '👍🏼', '👍🏽', '👍🏾', '👍🏿']);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function resolvePrediction({ sock, msg, jid, args, predictToResolve }) {
    if (!predictToResolve.closed) {
        closePrediction(predictToResolve.predictionMessage.key.id);
        await sleep(3000);
    }

    const emoji = args[0];
    const isThumbsUp = THUMBS_UP.has(emoji);
    const isThumbsDown = emoji === '😢';
    const isCancel = emoji === 'cancel';
    const isReopen = emoji === 'reopen';

    if (isReopen) {
        const extraMinutes = parseInt(args[1]);
        if (!extraMinutes || extraMinutes <= 0 || isNaN(extraMinutes)) {
            await sock.sendMessage(jid, { text: '¿Cuántos minutos la extiendo? Usa: reopen [minutos] 3:' }, { quoted: msg });
            return;
        }
        reopenPrediction(predictToResolve.predictionMessage.key.id, extraMinutes);
        await sock.sendMessage(jid, { text: `¡Predicción reabierta por ${extraMinutes} minuto${extraMinutes == 1 ? '' : 's'} más! ⏳` }, { quoted: predictToResolve.predictionMessage });
        return;
    }

    if (predictToResolve.resolved) {
        await sock.sendMessage(jid, { text: 'Esta predicción ya fue resuelta antes 3:' }, { quoted: msg });
        return;
    }

    if (isCancel) {
        predictToResolve.resolved = true;
        await sock.sendMessage(jid, { text: '¡Predicción cancelada! No hay ganadores esta vez 3:' }, { quoted: predictToResolve.predictionMessage });
        return;
    }

    if (!isThumbsUp && !isThumbsDown) {
        await sock.sendMessage(jid, { text: 'Opción inválida. Usa 👍, 😢, reopen [minutos] o cancel 3:' }, { quoted: msg });
        return;
    }

    const winners = isThumbsUp ? predictToResolve.positiveVotes : predictToResolve.negativeVotes;
    const sideEmoji = isThumbsUp ? '👍' : '😢';
    const sideLabel = isThumbsUp ? 'sí' : 'no';
    const winnersNames = [];

    for (const winner of winners) {
        const userWinner = getUser(winner);
        winnersNames.push(userWinner.username);
        userWinner.sumicoins += predictToResolve.sumicoinsPrize;
        editUser(userWinner.id, userWinner);
    }

    predictToResolve.resolved = true;

    let replyMsg = `Ganó el ${sideLabel} (${sideEmoji}) | *+${predictToResolve.sumicoinsPrize}🌸 para:*\n`;
    if (winnersNames.length <= 0) {
        replyMsg += `¡Nadie acertó! u.u`;
    } else {
        winnersNames.forEach(name => replyMsg += `${name}\n`);
        replyMsg += `\n¡Felicidades a todos los que acertaron! n.n 🌸`;
    }

    await sock.sendMessage(jid, { text: replyMsg }, { quoted: predictToResolve.predictionMessage });
}

export default {
    name: 'predict',
    description: 'Predicciones para obtener Sumicoins :P',
    usage: '.sumi predict [Premio] [Limite (minutos)] [Prediccion]',
    aliases: ['pred', 'p'],

    async execute({ sock, msg, args, jid, senderNumber }) {
        const predAuthor = getUser(senderNumber);
        if (!predAuthor || predAuthor.role !== 'ADMIN') return;

        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo;

        if (quotedMsg?.quotedMessage) {
            const quotedId = quotedMsg.stanzaId;
            const predictToResolve = getPredi(quotedId);

            if (!predictToResolve) {
                await sock.sendMessage(jid, { text: 'Ese mensaje no es una predicción 3:' }, { quoted: msg });
                return;
            }

            await resolvePrediction({ sock, msg, jid, args, predictToResolve });
            return;
        }

        const [prizeArg, timeArg, ...predictionWords] = args;
        const prediction = predictionWords.join(' ');

        if (args.length < 3) {
            await sock.sendMessage(jid, { text: 'Faltan argumentos. Uso: .sumi predict [premio] [minutos] [predicción] 3:' }, { quoted: msg });
            return;
        }
        if (!prizeArg || prizeArg <= 0 || isNaN(prizeArg)) {
            await sock.sendMessage(jid, { text: 'El premio tiene que ser un número mayor a 0 3:' }, { quoted: msg });
            return;
        }
        if (!timeArg || timeArg <= 0 || isNaN(timeArg)) {
            await sock.sendMessage(jid, { text: 'El tiempo tiene que ser un número mayor a 0 3:' }, { quoted: msg });
            return;
        }
        if (!prediction) {
            await sock.sendMessage(jid, { text: 'No pusiste la predicción 3:' }, { quoted: msg });
            return;
        }

        const prizeInSumicoins = parseInt(prizeArg);
        const timeLimitInMinutes = parseInt(timeArg);

        const predictionMessageBody = `*Por ${prizeInSumicoins}🌸 Sumicoins | Expira en ${timeLimitInMinutes == 1 ? '1 minuto' : `${timeLimitInMinutes} minutos`}*\n${prediction}\n\nReaccionar 👍(Sí) / 😢(No)`;

        const predictionMessage = await sock.sendMessage(jid, { text: predictionMessageBody });
        createPrediction(prizeInSumicoins, timeLimitInMinutes, predictionMessage);
    }
};