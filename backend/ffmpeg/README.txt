# FFmpeg Installation Required

The application needs FFmpeg to process audio files. Please follow these steps:

## Quick Installation (Recommended)

1. Download FFmpeg from: https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
2. Extract the ZIP file
3. Copy `ffmpeg.exe` and `ffprobe.exe` from the `bin` folder
4. Paste them into this directory: `backend/ffmpeg/bin/`

## Alternative: System-wide Installation

1. Download FFmpeg from: https://ffmpeg.org/download.html
2. Extract to a folder (e.g., C:\ffmpeg)
3. Add the bin folder to your system PATH:
   - Right-click "This PC" → Properties → Advanced system settings
   - Click "Environment Variables"
   - Under "System variables", find and select "Path", click "Edit"
   - Click "New" and add the path to FFmpeg's bin folder (e.g., C:\ffmpeg\bin)
   - Click "OK" to save

## Verify Installation

After installation, restart your command prompt and the application should work without errors.

The application will automatically detect FFmpeg in this folder or in your system PATH.