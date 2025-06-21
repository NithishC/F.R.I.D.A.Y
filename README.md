# F.R.I.D.A.Y - Voice-Powered AI Assistant

A real-time voice conversation web application that allows users to have natural conversations with an AI assistant, powered by Google's Gemini AI.

## Features

- **Voice Input**: Press and hold to record your voice
- **Speech-to-Text**: Converts your speech to text using Google Speech Recognition
- **AI Responses**: Powered by Google's Gemini Pro (free tier)
- **Text-to-Speech**: Converts AI responses back to speech
- **Real-time Communication**: Uses WebSockets for instant communication
- **Audio Visualization**: See your voice input visualized in real-time
- **Conversation Reset**: Clear conversation history with one click
- **Modern UI**: Glassmorphism design with smooth animations

## Technology Stack

- **Backend**: Flask + Socket.IO
- **Frontend**: Vanilla JavaScript with Socket.IO client
- **Speech Recognition**: Google Speech Recognition API
- **Language Model**: Google Gemini Pro (free API)
- **Text-to-Speech**: gTTS (Google Text-to-Speech)

## Prerequisites

- Python 3.8 or higher
- Google Gemini API key (free)

## Setup Instructions

### 1. Get Gemini API Key (Free)

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### 2. Configure the Application

1. Open the `.env` file in the project root
2. Replace `your_gemini_api_key_here` with your actual Gemini API key

### 3. Activate Virtual Environment

```bash
# Navigate to project directory
cd C:\Users\navee\Projects\Hackathon\F.R.I.D.A.Y

# Activate virtual environment
friday_env\Scripts\activate
```

### 4. Install Dependencies (if needed)

```bash
pip install -r requirements.txt
```

### 5. Run the Backend Server

```bash
# Navigate to backend directory
cd backend

# Run the Flask application
python app.py
```

You should see:
```
Starting FRIDAY backend...
Gemini API configured: Yes
 * Running on http://127.0.0.1:5000
```

### 6. Serve the Frontend

Open a new terminal/command prompt:

```bash
# Navigate to frontend directory
cd C:\Users\navee\Projects\Hackathon\F.R.I.D.A.Y\frontend

# Start a simple HTTP server
python -m http.server 8000
```

### 7. Access the Application

Open your web browser and go to: http://localhost:8000

## Usage

1. **Allow microphone access** when prompted by your browser
2. **Press and hold** the microphone button to start recording
3. **Speak your message** clearly
4. **Release the button** to send your message
5. **Wait for the AI response** - it will be displayed as text and played as audio
6. **Reset conversation** using the reset button if needed

## Project Structure

```
F.R.I.D.A.Y/
├── backend/
│   └── app.py              # Flask backend with Socket.IO
├── frontend/
│   ├── index.html          # Main UI
│   ├── styles.css          # Glassmorphism styling
│   └── script.js           # Client-side logic
├── friday_env/             # Python virtual environment
├── requirements.txt        # Python dependencies
├── .env                   # API key configuration
├── .gitignore             # Git ignore file
└── README.md              # This file
```

## Troubleshooting

### Common Issues

1. **"Microphone access denied"**:
   - Check your browser settings and allow microphone access for localhost
   - Make sure no other application is using the microphone

2. **"Could not understand the audio"**:
   - Speak clearly and ensure there's minimal background noise
   - Try speaking closer to the microphone

3. **No AI response**:
   - Verify your Gemini API key is correctly set in the `.env` file
   - Check the backend console for any error messages
   - Ensure you have internet connectivity

4. **Connection issues**:
   - Ensure both backend (port 5000) and frontend (port 8000) servers are running
   - Check that no other applications are using these ports

## API Information

### Gemini API (Free Tier)
- **Rate Limits**: 60 requests per minute
- **Token Limits**: Generous limits for conversational use
- **Cost**: Free
- **Documentation**: https://ai.google.dev/

## Security Notes

- Never commit your `.env` file with API keys to version control
- The `.gitignore` file is already configured to exclude sensitive files
- Keep your API keys secure and rotate them periodically

## Future Enhancements

- Add support for multiple languages
- Implement streaming responses
- Add conversation history storage
- Support for voice customization
- Implement wake word detection ("Hey FRIDAY")
- Add user authentication and profiles