import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { collection } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Old JSON user files, imported into MongoDB on startup
const USERDATA_DIR = join(__dirname, '..', 'datafiles', 'userdata');
const IMPORTED_DIR = join(__dirname, '..', 'datafiles', 'userdata_imported');

// Hide Mongo's _id so users look the same as they did in the JSON files
const NO_MONGO_ID = { projection: { _id: 0 } };

const users = () => collection('users');

async function getUser(contactIdUser) {
    return users().findOne({ id: contactIdUser }, NO_MONGO_ID);
}

async function userExists(contactIdUser) {
    return (await users().countDocuments({ id: contactIdUser }, { limit: 1 })) > 0;
}

async function userNameExists(contactUsername) {
    return (await users().countDocuments({ username: contactUsername }, { limit: 1 })) > 0;
}

async function editUser(contactIdUser, newData) {
    const { _id, id, ...data } = newData; // the user's id and Mongo's _id never change here
    return users().findOneAndUpdate(
        { id: contactIdUser },
        { $set: data },
        { returnDocument: 'after', ...NO_MONGO_ID }
    );
}

/** Adds (or with a negative amount, removes) Sumicoins in one atomic step */
async function addSumicoins(contactIdUser, amount) {
    return users().findOneAndUpdate(
        { id: contactIdUser },
        { $inc: { sumicoins: amount } },
        { returnDocument: 'after', ...NO_MONGO_ID }
    );
}

async function createUser(contactIdUser, contactUsername) {
    const data = {
        id: contactIdUser,
        username: contactUsername,
        sumicoins: 100,
        role: 'USER'
    };

    try {
        await users().insertOne({ ...data });
    } catch (err) {
        if (err.code === 11000) return null; // already registered
        throw err;
    }
    return data;
}

/**
 * Moves a user stored under an old ID (their phone number) to their LID.
 * If they already have a LID account too (registered twice), the LID account wins
 * for the username, and they keep the higher balance and the higher role.
 * A copy of the old account is kept in the users_migrated collection.
 */
async function migrateUser(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return;

    const oldUser = await getUser(fromId);
    if (!oldUser) return;

    const lidUser = await getUser(toId);

    if (lidUser) {
        await users().updateOne({ id: toId }, {
            $set: {
                sumicoins: Math.max(oldUser.sumicoins ?? 0, lidUser.sumicoins ?? 0),
                role: oldUser.role === 'ADMIN' || lidUser.role === 'ADMIN' ? 'ADMIN' : lidUser.role
            }
        });
        await users().deleteOne({ id: fromId });
    } else {
        await users().updateOne({ id: fromId }, { $set: { id: toId } });
    }

    await collection('users_migrated').insertOne({ ...oldUser, migratedTo: toId, migratedAt: new Date() });

    console.log(`User ${fromId} migrated to LID ${toId}${lidUser ? ' (merged with existing account)' : ''}`);
}

/**
 * Runs once the bot connects: any user stored by phone number whose LID
 * the bot already knows (from auth_info) is moved to that LID.
 * Users it can't resolve yet are migrated later, the next time they write.
 */
async function migrateStoredUsers(sock) {
    const keys = sock.authState.keys;
    const ids = (await users().find({}, { projection: { _id: 0, id: 1 } }).toArray()).map(u => u.id);

    for (const id of ids) {
        // Already a LID the bot has seen
        const reverse = await keys.get('lid-mapping', [`${id}_reverse`]);
        if (reverse?.[`${id}_reverse`]) continue;

        // A phone number with a known LID
        const forward = await keys.get('lid-mapping', [id]);
        const lid = forward?.[id];
        if (typeof lid === 'string' && lid) await migrateUser(id, lid);
    }
}

/**
 * One-time import of the old datafiles/userdata/*.json files.
 * Each imported file is moved to datafiles/userdata_imported as a backup.
 * If a user is already in the database, the database copy is kept.
 */
async function importJsonUsers() {
    if (!existsSync(USERDATA_DIR)) return;

    const files = readdirSync(USERDATA_DIR).filter(file => file.endsWith('.json'));
    if (files.length === 0) return;

    if (!existsSync(IMPORTED_DIR)) mkdirSync(IMPORTED_DIR, { recursive: true });

    let imported = 0;
    for (const file of files) {
        const path = join(USERDATA_DIR, file);
        const data = JSON.parse(readFileSync(path, 'utf-8'));
        data.id = String(data.id ?? file.slice(0, -'.json'.length));

        const { _id, ...user } = data;
        const result = await users().updateOne({ id: user.id }, { $setOnInsert: user }, { upsert: true });

        if (result.upsertedCount) imported++;
        else console.warn(`User ${user.id} was already in the database, kept the database copy`);

        renameSync(path, join(IMPORTED_DIR, file));
    }

    console.log(`Imported ${imported} of ${files.length} JSON users into MongoDB`);
}

export {
    userExists, getUser, createUser, userNameExists, editUser, addSumicoins,
    migrateUser, migrateStoredUsers, importJsonUsers
};
