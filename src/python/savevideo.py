import yt_dlp
import json
import datetime
import sys

def save_video(url):
    ydl_opts = {
        'outtmpl': f'../datafiles/temp/videos/%(title)s-{datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")}.%(ext)s',
        'format': 'bestvideo+bestaudio/best',
        'merge_output_format': 'mp4',
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
        print(f"Video: {ydl_opts['outtmpl']} downloaded successfully.")
        sys.exit(0)
    
if(len(sys.argv) < 2):
    print("Uso: python savevideo.py <url> (--info)")
    sys.exit(1)

if(len(sys.argv) == 3 and sys.argv[2] == "--info"):
    url = sys.argv[1]

    if(url.endswith("/")):
        url = url[:-1]

    ydl_opts = {
        'quiet': True,
        'skip_download': True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        
        video_info = {
            'url': url,
            'title': ydl.extract_info(url, download=False).get('title', None),
            'description': ydl.extract_info(url, download=False).get('description', None),
            'duration': ydl.extract_info(url, download=False).get('duration', None),
            'view_count': ydl.extract_info(url, download=False).get('view_count', None),
            'like_count': ydl.extract_info(url, download=False).get('like_count', None),
            'upload_date': ydl.extract_info(url, download=False).get('upload_date', None),
        }

        print(json.dumps(video_info, indent=4))
        sys.exit(0)

save_video(sys.argv[1])

