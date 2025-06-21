# F.R.I.D.A.Y - Voice-Powered AI Assistant

A real-time voice conversation web application with client-side speech recognition and AI-powered responses.

## Features

- **Client-Side Speech Recognition**: Real-time speech-to-text in the browser
- **Live Transcription**: See your words as you speak
- **AI Responses**: Powered by Google's Gemini Pro (free tier)
- **Text-to-Speech**: Natural voice responses
- **Real-time Communication**: WebSocket-based instant messaging
- **Modern UI**: Glassmorphism design with smooth animations
- **Conversation Management**: Reset and maintain context

## Technology Stack

- **Frontend**: 
  - Vanilla JavaScript with Web Speech API
  - Socket.IO client for real-time communication
  - Modern CSS with glassmorphism effects
- **Backend**: 
  - Flask + Socket.IO
  - Google Gemini Pro for AI responses
  - gTTS for text-to-speech conversion
- **Speech Recognition**: Browser's Web Speech API (no server processing needed!)

## Prerequisites

- Python 3.8 or higher
- Google Gemini API key (free)
- Modern web browser (Chrome, Edge, or Safari recommended)

## Setup Instructions

### 1. Get Gemini API Key (Free)

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### 2. Configure the Application

1. Open the `.env` file in the project root
2. Replace `your_gemini_api_key_here` with your actual Gemini API key

### 3. Install Dependencies

```bash
# Navigate to project directory
cd C:\Users\navee\Projects\Hackathon\F.R.I.D.A.Y

# Activate virtual environment
friday_env\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Run the Backend Server

```bash
# Navigate to backend directory
cd backend

# Run the Flask application
python app.py
```

You should see:
```
Starting Flask application...
Gemini API configured successfully
Mode: Client-side speech recognition
 * Running on http://127.0.0.1:5000
```

### 5. Serve the Frontend

Open a new terminal/command prompt:

```bash
# Navigate to frontend directory
cd C:\Users\navee\Projects\Hackathon\F.R.I.D.A.Y\frontend

# Start a simple HTTP server
python -m http.server 8000
```

### 6. Access the Application

Open your web browser and go to: http://localhost:8000

## Usage

1. **Allow microphone access** when prompted by your browser
2. **Press and hold** the microphone button
3. **Speak clearly** - you'll see your words appear in real-time
4. **Release the button** to send your message
5. **Listen** to FRIDAY's response
6. **Test button** - Click to send a test message
7. **Reset button** - Clear conversation history

## Browser Compatibility

The Web Speech API is supported in:
- ✅ Google Chrome (recommended)
- ✅ Microsoft Edge
- ✅ Safari
- ❌ Firefox (limited support)

## Project Structure

```
F.R.I.D.A.Y/
├── backend/
│   └── app.py              # Simplified Flask backend
├── frontend/
│   ├── index.html          # Main UI
│   ├── styles.css          # Glassmorphism styling
│   └── script.js           # Client-side speech recognition
├── friday_env/             # Python virtual environment
├── logs/                   # Application logs
├── requirements.txt        # Minimal Python dependencies
├── .env                    # API key configuration
├── .gitignore             # Git ignore file
└── README.md              # This file
```

## What Changed?

### Previous Architecture:
- Audio recorded in browser → Sent to server → FFmpeg conversion → Speech recognition → AI response

### New Architecture:
- Speech recognition in browser → Text sent to server → AI response → Much faster!

### Benefits:
- **5x faster** response time
- **No audio dependencies** (removed FFmpeg, PyDub, SpeechRecognition)
- **Smaller payload** (text vs audio files)
- **Real-time transcription** feedback
- **Simpler deployment** (fewer dependencies)

## API Endpoints

### WebSocket Events
- `text_message`: Send text to get AI response
- `response`: Receive AI response with audio

### REST Endpoints
- `GET /`: Health check
- `GET /api/health`: Detailed status
- `POST /api/chat`: Text-based chat
- `POST /api/text-to-speech`: Convert text to audio
- `POST /api/reset-conversation`: Clear conversation history

## Troubleshooting

### "Speech recognition not supported"
- Use Chrome, Edge, or Safari
- Ensure you're using HTTPS or localhost

### "Microphone access denied"
- Check browser permissions
- Allow microphone access for localhost

### No response from AI
- Verify Gemini API key in `.env`
- Check backend console for errors

### Can't hear audio response
- Check system volume
- Verify browser autoplay settings

## Security Notes

- Never commit `.env` file with API keys
- API keys are kept server-side only
- All communication over WebSockets

## Future Enhancements

- Multi-language support
- Voice selection for responses
- Conversation export
- Custom wake words
- Mobile app version