import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const USERDATA_DIR = join(__dirname, '..', 'datafiles', 'userdata');

ensureDir();

function ensureDir() {
    if (!existsSync(USERDATA_DIR)) {
        mkdirSync(USERDATA_DIR, { recursive: true });
    }
}

function getUserPath(contactIdUser) {
    return join(USERDATA_DIR, `${contactIdUser}.json`);
}

function userExists(contactIdUser) {
    return existsSync(getUserPath(contactIdUser));
}

function userNameExists(contactUsername) {
    return readdirSync(USERDATA_DIR).some(file => {
        return JSON.parse(readFileSync(join(USERDATA_DIR, file), 'utf-8')).username === contactUsername;
    });
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

export { userExists, getUser, saveUser, createUser, userNameExists, editUser };