import yt_dlp
import json
import datetime
import sys

def save_video(url, outputdirectory):
    ydl_opts = {
        'outtmpl': f'../datafiles/temp/videos/{outputdirectory}.%(ext)s',
        'format': 'bestvideo+bestaudio/best',
        'quiet': True,
        'merge_output_format': 'mp4',
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        real_path = ydl.prepare_filename(info).replace('.webm', '.mp4').replace('.mkv', '.mp4')
        print(json.dumps({ 'path': real_path }))
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

