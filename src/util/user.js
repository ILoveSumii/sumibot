const fs = require('fs');
const path = require('path');

const USERDATA_DIR = path.join(__dirname, '..', 'userdata');

function ensureDir() {
    if (!fs.existsSync(USERDATA_DIR)) {
        fs.mkdirSync(USERDATA_DIR, { recursive: true });
    }
}

function getUserPath(contactIdUser) {
    filename = `${contactIdUser}.json`;
    return path.join(USERDATA_DIR, filename);
}

function userExists(contactIdUser) {
    return fs.existsSync(getUserPath(contactIdUser));
}

function getUser(contactIdUser) {
    if (!userExists(contactIdUser)) return null;
    const raw = fs.readFileSync(getUserPath(contactIdUser), 'utf-8');
    return JSON.parse(raw);
}

function saveUser(contactIdUser, data) {
    ensureDir();
    fs.writeFileSync(getUserPath(contactIdUser), JSON.stringify(data, null, 2));
}

function createUser(contactIdUser) {
    if (userExists(contactIdUser)) return null;

    const data = {
        user: contactIdUser,
        sumicoins: 100
    };

    saveUser(contactIdUser, data);
    return data;
}

module.exports = { userExists, getUser, saveUser, createUser };