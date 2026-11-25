import yt_dlp
import json
import sys
import os

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


def save_video(url, outputname):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_template = os.path.join(script_dir, '..', 'datafiles', 'temp', 'videos', f'{outputname}.%(ext)s')
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'noprogress': True,
        'noplaylist': True,
        'outtmpl': output_template,
        'format': 'bestvideo+bestaudio/best',
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
