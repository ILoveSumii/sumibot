import yt_dlp
import json
import sys
import os

def save_video(url, outputdirectory):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_template = os.path.join(script_dir, '..', 'datafiles', 'temp', 'videos', f'{outputdirectory}.%(ext)s')
    ydl_opts = {
        'outtmpl': output_template,
        'format': 'bestvideo+bestaudio/best',
        'merge_output_format': 'mp4',
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        real_path = ydl.prepare_filename(info).replace('.webm', '.mp4').replace('.mkv', '.mp4')
        sys.stdout.write(json.dumps({ 'path': real_path }) + '\n')
        sys.stdout.flush()
        sys.exit(0)
    
if(len(sys.argv) < 3):
    print("Uso: python savevideo.py <url> <outputdir> [--info]")
    sys.exit(1)

if(len(sys.argv) == 4 and sys.argv[3] == "--info"):
    url = sys.argv[1]

    if(url.endswith("/")):
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

