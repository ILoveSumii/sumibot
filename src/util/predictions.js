const predis = new Map();
let _onClose = null;
let _onVote = null;

function onClose(fn){
    _onClose = fn;
}

function onVote(fn){
    _onVote = fn;
}

function createPrediction(prize, timelimitMinutes, predictionMessage){

    let predictionTimeLimitInMs = timelimitMinutes * 60 * 1000;

    const prediccion = {
        predictionMessage: predictionMessage,
        sumicoinsPrize: prize,
        createdAt: Date.now(),
        expiration: Date.now() + predictionTimeLimitInMs,
        positiveVotes: [],
        negativeVotes: [],
        closed: false,
        resolved: false
    }

    predis.set(predictionMessage.id.id, prediccion);

    setTimeout(() => closePrediction(predictionMessage.id.id), predictionTimeLimitInMs);

    return prediccion;

}

function closePrediction(predictionId){
    const pred = predis.get(predictionId);

    if(pred.closed){
        return;
    }

    pred.closed = true;

    if(_onClose) {
        _onClose(pred);
    }
}

function vote(pred, userNumber, optionVotedFor){
    if(!pred || pred.closed){
        return;
    }

    if(optionVotedFor == '😢'){
        pred.negativeVotes.push(userNumber);
    } else if (optionVotedFor == '👍'){
        pred.positiveVotes.push(userNumber);
    } else {
        return;
    }
}

function getPredi(id){
    return predis.get(id);
}

module.exports = { predis, createPrediction, closePrediction, onClose, getPredi, vote }