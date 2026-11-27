
# 🌸Sumibot 🌸

![Sumibot banner for GitHub](https://github.com/ILoveSumii/sumibot/blob/main/src/assets/sumibot_banner_github.png?raw=true)

WhatsApp bot built with [Baileys](https://github.com/WhiskeySockets/Baileys) using Node.js. Just like any other made-for-fun Discord bot but for WhatsApp. It works for both personal use and groups. The bot is entirely in Spanish.

## Requirements

-   Node.js v20.12+ and pnpm (npm works too, but it only has the pnpm-lock right now).
-   Python 3.10+
-   ffmpeg
-   MongoDB (a local install or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

## Set up & Running

1.  Clone the repo:

```bash
git clone https://github.com/tuusuario/sumibot.git
cd sumibot

```

2.  Install pnpm dependencies:

```bash
pnpm install

```

3. Go to src, create venv and install python dependencies:

```bash
cd Sumibot/src
python -m venv venv
venv\Scripts\activate
pip install yt-dlp

```

4.  Install ffmpeg for CLI:

```bash
winget install ffmpeg

```

5.  Set up MongoDB: copy `.env.example` to `.env` and put your connection string in `MONGODB_URI`. For a local install on Windows:

```bash
winget install MongoDB.Server
copy .env.example .env

```

6.  Run app.js or pnpm start:

```bash
pnpm start

```

7.  If run for the first time, a QR code will appear. Scan the QR with a spare WhatsApp account as "Link device". Once is ready, it will display in console "Client ready!
From there on, it will use local authentication to start.

## Tips

Don't use a new number immediately to use the bot as it may cause a ban. Try to write some messages as you would normally do with WhatsApp for some minutes.
In the code, some time-sleeps are added on purpose to simulate human-behavior. Getting these removed may cause WhatsApp detect robotic behavior and getting the account banned.
If your account gets banned, try to appeal it. It works most of the times, but becomes a bit tiresome.

## Structure

```
sumibot/
├── src/
│   ├── app.js
│   ├── commands/
│   └── util/
├── python/
│   └── savevideo.py
├── datafiles/
│   ├── userdata/
│   └── temp/
└── venv/

```

## Notes

-   Users are identified by their WhatsApp LID (which functions as a unique identifier).
-   Users are stored in the `users` collection in MongoDB. Old JSON files in datafiles/userdata are imported on startup and moved to datafiles/userdata_imported.
-   Users saved under a phone number are moved to the user's LID automatically (when the bot connects, or the next time that user writes). A copy of the old account is kept in the `users_migrated` collection.
-   As for now, only users with `ADMIN` role may execute certain commands. You may assing a user `ADMIN` role by accesing their user file in datafiles/userdata (if they are registered).
-   As it name suggests, datafiles/temp is used to save files temporarily while being worked with.
-   If an image/video is sent to the bot directly by private chat, the bot converts it to sticker automatically

## Contributing

Do whatever you want with it. Fork it and make it yours, or just submit your PR and if it looks good, I'll approve it :D