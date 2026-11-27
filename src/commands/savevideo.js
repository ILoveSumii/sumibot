import { readFileSync, unlinkSync, statSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { join, dirname, delimiter } from 'path';
import { userExists } from '../util/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MAX_MB = 20;

class VideoTooLargeError extends Error {
    constructor(sizeBytes) {
        super('Video too large');
        this.sizeMB = sizeBytes ? sizeBytes / (1024 * 1024) : null;
    }
}

function downloadVideo(url, outputName) {
    return new Promise((resolve, reject) => {
        const isWin = process.platform === 'win32';
        const rootDir = join(__dirname, '../');
        const venvDir = join(rootDir, 'venv');
        const binDir = join(venvDir, isWin ? 'Scripts' : 'bin');
        const python = join(binDir, isWin ? 'python.exe' : 'python');
        const script = join(__dirname, '../python/savevideo.py');

        const proc = spawn(python, [script, url, outputName], {
            cwd: rootDir,
            env: {
                ...process.env,
                VIRTUAL_ENV: venvDir,
                PATH: `${binDir}${delimiter}${process.env.PATH}`
            }
        });

        let output = '';
        let error = '';

        proc.on('error', reject); // por si no encuentra el ejecutable

        proc.stdout.on('data', (data) => output += data.toString());
        proc.stderr.on('data', (data) => error += data.toString());

        proc.on('close', (code) => {
            let result = null;
            try {
                result = JSON.parse(output.trim().split('\n').pop());
            } catch { }

            if (code === 0 && result?.path) {
                resolve(result.path);
            } else if (result?.error === 'too_large') {
                reject(new VideoTooLargeError(result.size));
            } else if (code === 0) {
                reject(new Error('No se pudo parsear la respuesta de Python'));
            } else {
                reject(new Error(error));
            }
        });
    });
}

export default {
    name: 'savevideo',
    description: 'Descarga el video de un link y te lo manda',
    usage: '.sumi savevideo [link]',
    aliases: ['descargar-video', 'descargarvideo', 'savevid'],

    async execute({ sock, msg, args, jid, userId }) {
        if (!args[0]) {
            await sock.sendMessage(jid, { text: 'No pusiste el link :p' }, { quoted: msg });
            return;
        }

        if (!userExists(userId)) {
            await sock.sendMessage(jid, { text: 'Tienes q registrarte para descargar videos 3: .sumi register [nombre]' }, { quoted: msg });
            return;
        }

        await sock.sendMessage(jid, { react: { text: '😸', key: msg.key } }, { quoted: msg });

        let realPath = null;

        try {
            realPath = await downloadVideo(args[0], `${userId}_${Date.now()}`);

            const sizeBytes = statSync(realPath).size;
            if (sizeBytes > MAX_MB * 1024 * 1024) throw new VideoTooLargeError(sizeBytes);

            const buffer = readFileSync(realPath);
            await sock.sendMessage(jid, { video: buffer, mimetype: 'video/mp4' }, { quoted: msg });

        } catch (err) {
            if (err instanceof VideoTooLargeError) {
                const sizeText = err.sizeMB ? ` (el q mandaste pesa ${err.sizeMB.toFixed(1)}MB)` : '';
                await sock.sendMessage(jid, { text: `El video no puede pasar de ${MAX_MB}MB unu${sizeText}` }, { quoted: msg });
                return;
            }
            console.error(err);
            await sock.sendMessage(jid, { text: 'Me tosté descargando el video xd (revisa bien el link)'}, { quoted: msg });
        } finally {
            if (realPath && existsSync(realPath)) unlinkSync(realPath);
        }
    }
};
