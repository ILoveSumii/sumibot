import yt_dlp
import json
import sys
import os
import subprocess
from yt_dlp.postprocessor.ffmpeg import FFmpegPostProcessor

MAX_BYTES = 20 * 1024 * 1024


def emit(data):
    sys.stdout.write(json.dumps(data) + '\n')
    sys.stdout.flush()


def estimated_size(info):
    """Best guess of the final file size in bytes, or None if yt-dlp doesn't know."""
    formats = info.get('requested_formats') or [info]
    total = 0
    for f in formats:
        size = f.get('filesize') or f.get('filesize_approx')
        if not size:
            return None
        total += size
    return total


def make_phone_compatible(ydl, path):
    """Phone WhatsApp only plays H.264 video + AAC audio in mp4 (web is more lenient).
    Re-encode whatever isn't compatible and move the moov atom to the front."""
    ff = FFmpegPostProcessor(ydl)
    probe = subprocess.run(
        [ff.probe_executable, '-v', 'error', '-show_entries', 'stream=codec_type,codec_name,pix_fmt', '-of', 'json', path],
        capture_output=True, text=True, check=True)
    streams = json.loads(probe.stdout).get('streams', [])
    video = next((s for s in streams if s.get('codec_type') == 'video'), None)
    audio = next((s for s in streams if s.get('codec_type') == 'audio'), None)

    args = ['-map', '0:v:0']
    if video and video.get('codec_name') == 'h264' and video.get('pix_fmt') == 'yuv420p':
        args += ['-c:v', 'copy']
    else:
        args += ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-pix_fmt', 'yuv420p',
                 '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2']
    if audio:
        args += ['-map', '0:a:0', '-c:a', 'copy' if audio.get('codec_name') == 'aac' else 'aac']
        if audio.get('codec_name') != 'aac':
            args += ['-b:a', '128k']

    fixed = os.path.splitext(path)[0] + '.wa.mp4'
    subprocess.run(
        [ff.executable, '-y', '-v', 'error', '-i', path, *args, '-movflags', '+faststart', fixed],
        capture_output=True, text=True, check=True)
    os.remove(path)
    return fixed


def save_video(url, outputname):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_template = os.path.join(script_dir, '..', 'datafiles', 'temp', 'videos', f'{outputname}.%(ext)s')
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'noprogress': True,
        'noplaylist': True,
        'outtmpl': output_template,
        'format': 'bv*[vcodec^=avc1]+ba[acodec^=mp4a]/b[vcodec^=avc1][acodec^=mp4a]/bestvideo+bestaudio/best',
        'format_sort': [f'filesize:{MAX_BYTES // (1024 * 1024)}M'],
        'merge_output_format': 'mp4',
        'max_filesize': MAX_BYTES,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:

        info = ydl.extract_info(url, download=False)

        size = estimated_size(info)
        if size is not None and size > MAX_BYTES:
            emit({'error': 'too_large', 'size': size})
            sys.exit(3)

        info = ydl.process_ie_result(info, download=True)

        downloads = info.get('requested_downloads') or []
        path = downloads[0].get('filepath') if downloads else None
        if not path or not os.path.exists(path):
            emit({'error': 'too_large', 'size': None})
            sys.exit(3)

        path = make_phone_compatible(ydl, path)

        emit({'path': path})
        sys.exit(0)


if len(sys.argv) < 3:
    print("Uso: python savevideo.py <url> <outputname> [--info]")
    sys.exit(1)

if len(sys.argv) == 4 and sys.argv[3] == "--info":
    url = sys.argv[1]

    if url.endswith("/"):
        url = url[:-1]

    ydl_opts = {
        'quiet': True,
        'skip_download': True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:

        info = ydl.extract_info(url, download=False)
        video_info = {
            'url': url,
            'title': info.get('title'),
            'description': info.get('description'),
            'duration': info.get('duration'),
            'view_count': info.get('view_count'),
            'like_count': info.get('like_count'),
            'upload_date': info.get('upload_date'),
        }

        print(json.dumps(video_info, indent=4))
        sys.exit(0)

save_video(sys.argv[1], sys.argv[2])
