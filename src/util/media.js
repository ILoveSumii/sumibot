import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { mkdirSync, existsSync, writeFileSync, unlinkSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMP_DIR = join(__dirname, '../datafiles/temp/sticker');

if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR, { recursive: true });
}

export async function imageToWebp(buffer) {
    return await sharp(buffer)
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp()
        .toBuffer();
}

export function videoToWebp(buffer) {
    return new Promise((resolve, reject) => {
        const inputPath = join(TEMP_DIR, `${Date.now()}_in.mp4`);
        const outputPath = join(TEMP_DIR, `${Date.now()}_out.webp`);

        writeFileSync(inputPath, buffer);

        ffmpeg(inputPath)
            .outputOptions([
                '-vcodec', 'libwebp_anim',
                '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,fps=10',
                '-loop', '0',
                '-preset', 'default',
                '-pix_fmt', 'yuva420p',
                '-an',
                '-vsync', '0',
                '-t', '00:00:05',
                '-quality', '80'
            ])
            .format('webp')
            .output(outputPath)
            .on('end', () => {
                const webp = readFileSync(outputPath);
                unlinkSync(inputPath);
                unlinkSync(outputPath);
                resolve(webp);
            })
            .on('error', (err) => {
                unlinkSync(inputPath);
                reject(err);
            })
            .run();
    });
}