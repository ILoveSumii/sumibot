import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const USERDATA_DIR = join(__dirname, '..', 'datafiles', 'userdata');
// Old user files are moved here (not deleted) after they're migrated to a LID
const MIGRATED_DIR = join(__dirname, '..', 'datafiles', 'userdata_migrated');

ensureDir();

function ensureDir() {
    if (!existsSync(USERDATA_DIR)) {
        mkdirSync(USERDATA_DIR, { recursive: true });
    }
}

function getUserPath(contactIdUser) {
    return join(USERDATA_DIR, `${contactIdUser}.json`);
}

function listUserIds() {
    return readdirSync(USERDATA_DIR)
        .filter(file => file.endsWith('.json'))
        .map(file => file.slice(0, -'.json'.length));
}

function userExists(contactIdUser) {
    return existsSync(getUserPath(contactIdUser));
}

function userNameExists(contactUsername) {
    return listUserIds().some(id => getUser(id)?.username === contactUsername);
}

function getUser(contactIdUser) {
    if (!userExists(contactIdUser)) return null;
    return JSON.parse(readFileSync(getUserPath(contactIdUser), 'utf-8'));
}

function saveUser(contactIdUser, data) {
    ensureDir();
    writeFileSync(getUserPath(contactIdUser), JSON.stringify(data, null, 2));
}

function editUser(contactIdUser, newData) {
    if (!userExists(contactIdUser)) return null;
    const updatedData = { ...getUser(contactIdUser), ...newData };
    saveUser(contactIdUser, updatedData);
    return updatedData;
}

function createUser(contactIdUser, contactUsername) {
    if (userExists(contactIdUser)) return null;

    const data = {
        id: contactIdUser,
        username: contactUsername,
        sumicoins: 100,
        role: 'USER'
    };

    saveUser(contactIdUser, data);
    return data;
}

/**
 * Moves a user stored under an old ID (their phone number) to their LID.
 * If they already have a LID file too (registered twice), the LID file wins
 * for the username, and they keep the higher balance and the higher role.
 * The old file is kept in datafiles/userdata_migrated as a backup.
 */
function migrateUser(fromId, toId) {
    if (!fromId || !toId || fromId === toId || !userExists(fromId)) return;

    const oldUser = getUser(fromId);
    const lidUser = getUser(toId);

    const merged = lidUser
        ? {
            ...oldUser,
            ...lidUser,
            sumicoins: Math.max(oldUser.sumicoins ?? 0, lidUser.sumicoins ?? 0),
            role: oldUser.role === 'ADMIN' || lidUser.role === 'ADMIN' ? 'ADMIN' : lidUser.role
        }
        : { ...oldUser };
    merged.id = toId;

    saveUser(toId, merged);

    if (!existsSync(MIGRATED_DIR)) mkdirSync(MIGRATED_DIR, { recursive: true });
    renameSync(getUserPath(fromId), join(MIGRATED_DIR, `${fromId}_${Date.now()}.json`));

    console.log(`User ${fromId} migrated to LID ${toId}${lidUser ? ' (merged with existing account)' : ''}`);
}

/**
 * Runs once the bot connects: any user file named by phone number whose LID
 * the bot already knows (from auth_info) is moved to that LID.
 * Files it can't resolve yet are migrated later, the next time that user writes.
 */
async function migrateStoredUsers(sock) {
    const keys = sock.authState.keys;

    for (const id of listUserIds()) {
        // Already a LID the bot has seen
        const reverse = await keys.get('lid-mapping', [`${id}_reverse`]);
        if (reverse?.[`${id}_reverse`]) continue;

        // A phone number with a known LID
        const forward = await keys.get('lid-mapping', [id]);
        const lid = forward?.[id];
        if (typeof lid === 'string' && lid) migrateUser(id, lid);
    }
}

export { userExists, getUser, saveUser, createUser, userNameExists, editUser, migrateUser, migrateStoredUsers };
