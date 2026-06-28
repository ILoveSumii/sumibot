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

function userNameExists(contactUsername) {
    return fs.readdirSync(USERDATA_DIR).some(file => {
        return JSON.parse(fs.readFileSync(path.join(USERDATA_DIR, file), 'utf-8')).username === contactUsername;
    });
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

function editUser(contactIdUser, newData) {
    if (!userExists(contactIdUser)) return null;
    const userData = getUser(contactIdUser);
    const updatedData = { ...userData, ...newData };
    saveUser(contactIdUser, updatedData);
    return updatedData;
}

function createUser(contactIdUser, contactUsername) {
    if (userExists(contactIdUser)) return null;

    const data = {
        id: contactIdUser,
        username: contactUsername,
        sumicoins: 100
    };

    saveUser(contactIdUser, data);
    return data;
}

module.exports = { userExists, getUser, saveUser, createUser, userNameExists, editUser };