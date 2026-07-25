const predis = new Map();
let _onClose = null;
let _onVote = null;

const THUMBS_UP = new Set(['👍', '👍🏻', '👍🏼', '👍🏽', '👍🏾', '👍🏿']);

function onClose(fn) {
    _onClose = fn;
}

function onVote(fn) {
    _onVote = fn;
}

function createPrediction(prize, timelimitMinutes, predictionMessage) {
    const predictionTimeLimitInMs = timelimitMinutes * 60 * 1000;
    const instantNow = Date.now();

    const prediccion = {
        predictionMessage,
        sumicoinsPrize: prize,
        createdAt: instantNow,
        expiration: instantNow + predictionTimeLimitInMs,
        positiveVotes: new Set(),
        negativeVotes: new Set(),
        closed: false,
        resolved: false
    };

    predis.set(predictionMessage.key.id, prediccion);
    setTimeout(() => closePrediction(predictionMessage.key.id), predictionTimeLimitInMs);

    return prediccion;
}

function closePrediction(predictionId) {
    const pred = predis.get(predictionId);
    if (!pred || pred.closed) return;

    pred.closed = true;
    if (_onClose) _onClose(pred);
}

function reopenPrediction(predictionId, extraMinutes) {
    const pred = predis.get(predictionId);
    if (!pred) return;

    const extraMs = extraMinutes * 60 * 1000;
    pred.closed = false;
    pred.resolved = false;
    pred.expiration = Date.now() + extraMs;

    setTimeout(() => closePrediction(predictionId), extraMs);
}

function vote(pred, userNumber, optionVotedFor) {
    if (!pred || pred.closed) return;

    if (THUMBS_UP.has(optionVotedFor)) {
        pred.negativeVotes.delete(userNumber);
        pred.positiveVotes.add(userNumber);
    } else if (optionVotedFor === '😢') {
        pred.positiveVotes.delete(userNumber);
        pred.negativeVotes.add(userNumber);
    }
}

function getPredi(id) {
    return predis.get(id);
}

export { predis, createPrediction, closePrediction, reopenPrediction, onClose, getPredi, vote };