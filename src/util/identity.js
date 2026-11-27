import { jidDecode, isLidUser, isHostedLidUser, isPnUser, isHostedPnUser } from '@whiskeysockets/baileys';
import { migrateUser } from './user.js';

const isLid = jid => isLidUser(jid) || isHostedLidUser(jid);
const isPn = jid => isPnUser(jid) || isHostedPnUser(jid);
const userPart = jid => jidDecode(jid)?.user || null;

/**
 * Turns a sender's JIDs (WhatsApp may send a phone JID, a LID, or both) into
 * the one ID users are stored by: their LID number.
 * Falls back to the phone number only when WhatsApp can't tell us the LID;
 * that user gets migrated to their LID later on.
 */
export async function resolveUserId(sock, ...jids) {
    const candidates = jids.filter(Boolean);

    const pnJid = candidates.find(isPn);
    let lidJid = candidates.find(isLid);

    if (!lidJid && pnJid) {
        try {
            lidJid = await sock.signalRepository.lidMapping.getLIDForPN(pnJid);
        } catch (err) {
            console.warn('Could not look up LID for', pnJid, err?.message);
        }
    }

    const lid = lidJid ? userPart(lidJid) : null;
    const pn = pnJid ? userPart(pnJid) : null;

    // Someone who registered under their phone number gets moved to their LID
    if (lid && pn) {
        try {
            await migrateUser(pn, lid);
        } catch (err) {
            console.error(`Could not migrate ${pn} to ${lid}:`, err);
        }
    }

    if (!lid && pn) console.warn(`No LID known for ${pn}, using phone number for now`);

    return lid || pn;
}
