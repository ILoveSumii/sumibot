import { MongoClient } from 'mongodb';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, '..', '..', '.env');

// Loads MONGODB_URI / MONGODB_DB from the .env file in the project root
if (existsSync(ENV_PATH)) process.loadEnvFile(ENV_PATH);

let client = null;
let db = null;

export async function connectDB() {
    if (db) return db;

    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('Missing MONGODB_URI. Copy .env.example to .env and fill it in.');

    client = new MongoClient(uri);
    await client.connect();
    db = client.db(process.env.MONGODB_DB || 'sumibot');

    await db.collection('users').createIndex({ id: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 });

    console.log(`Connected to MongoDB (${db.databaseName})`);
    return db;
}

export function collection(name) {
    if (!db) throw new Error('Database not connected. Call connectDB() first.');
    return db.collection(name);
}

export async function closeDB() {
    await client?.close();
    client = null;
    db = null;
}
