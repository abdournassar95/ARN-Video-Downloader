# Binary Files Location

This directory should contain the following executable files:

## Windows
- `yt-dlp.exe` - Download from: https://github.com/yt-dlp/yt-dlp/releases
- `ffmpeg.exe` - Download from: https://ffmpeg.org/download.html

## macOS / Linux
- `yt-dlp` - Download from: https://github.com/yt-dlp/yt-dlp/releases
- `ffmpeg` - Download from: https://ffmpeg.org/download.html

## Quick Setup

### Option 1: Download binaries manually
1. Download yt-dlp from the releases page
2. Download ffmpeg from the official website
3. Place the executables in this directory

### Option 2: Use system-installed versions
If you have yt-dlp and ffmpeg installed on your system and available in PATH,
the application will automatically use them as fallback.

### Installation commands:

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install yt-dlp ffmpeg
```

**macOS:**
```bash
brew install yt-dlp ffmpeg
```

**Windows:**
Download the executables and add them to PATH, or place them in this directory.

## Note
Make sure the files have execute permissions on macOS/Linux:
```bash
chmod +x yt-dlp ffmpeg
```
