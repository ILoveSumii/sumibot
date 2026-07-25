import { readFileSync, unlinkSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { userExists } from '../util/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function downloadVideo(url, outputDir) {
    return new Promise((resolve, reject) => {
        const python = 'python';
        const script = join(__dirname, '../python/savevideo.py');
        const rootDir = join(__dirname, '../');

        const proc = spawn(python, [script, url, outputDir], {
            cwd: rootDir,
            env: {
                ...process.env,
                VIRTUAL_ENV: join(rootDir, 'venv'),
                PATH: `${join(rootDir, 'venv/Scripts')};${process.env.PATH}`
            }
        });

        let output = '';
        let error = '';

        proc.stdout.on('data', (data) => output += data.toString());
        proc.stderr.on('data', (data) => error += data.toString());

        proc.on('close', (code) => {
            if (code === 0) {
                try {
                    const lastLine = output.trim().split('\n').pop();
                    const result = JSON.parse(lastLine);
                    resolve(result.path);
                } catch {
                    reject(new Error('No se pudo parsear la respuesta de Python'));
                }
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

    async execute({ sock, msg, args, jid, senderNumber }) {
        if (!args[0]) {
            await sock.sendMessage(jid, { text: 'No pusiste el link :p' }, { quoted: msg });
            return;
        }

        if (!userExists(senderNumber)) {
            await sock.sendMessage(jid, { text: 'Tienes q registrarte para descargar videos 3: .sumi register [nombre]' }, { quoted: msg });
            return;
        }

        await sock.sendMessage(jid, { react: { text: '😸', key: msg.key } }, { quoted: msg });

        try {
            const realPath = await downloadVideo(args[0], senderNumber);

            const sizeMB = statSync(realPath).size / (1024 * 1024);
            if (sizeMB > 20) {
                unlinkSync(realPath);
                await sock.sendMessage(jid, { text: `El video no puede pasar de 20MB unu (el q manaste pesa ${sizeMB.toFixed(1)}MB)` }, { quoted: msg });
                return;
            }

            const buffer = readFileSync(realPath);
            await sock.sendMessage(jid, { video: buffer }, { quoted: msg });
            unlinkSync(realPath);

        } catch (err) {
            console.error(err);
            await sock.sendMessage(jid, { text: 'Me tosté descargando el video xd (revisa bien el link)'}, { quoted: msg });
        }
    }
};