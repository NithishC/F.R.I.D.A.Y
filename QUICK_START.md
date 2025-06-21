# FRIDAY Voice Assistant - Quick Start Guide

## ✅ Installation Complete!

All required packages have been successfully installed:
- Flask (Web framework)
- Google Generative AI (Gemini LLM)
- SpeechRecognition (Voice-to-text)
- gTTS (Text-to-speech)
- All supporting libraries

## 🚀 How to Run the Application

### Step 1: Configure Gemini API Key
1. Get your free API key from: https://makersuite.google.com/app/apikey
2. Open the `.env` file in the project root
3. Replace `your_gemini_api_key_here` with your actual API key

### Step 2: Start the Backend Server
Double-click `run_backend.bat` or run:
```
cd backend
..\friday_env\Scripts\python.exe app_simple.py
```

You should see:
```
Starting FRIDAY backend...
Gemini API configured: Yes
 * Running on http://127.0.0.1:5000
```

### Step 3: Start the Frontend Server
In a new terminal, double-click `run_frontend.bat` or run:
```
cd frontend
python -m http.server 8000
```

### Step 4: Open the Application
Open your web browser and go to: http://localhost:8000

## 📱 Using the Application

1. **Allow Microphone Access** when prompted
2. **Press and Hold** the microphone button
3. **Speak Clearly** 
4. **Release** to process your message
5. **Listen** to FRIDAY's response

## 🔧 Troubleshooting

### If the backend doesn't start:
- Check that your Gemini API key is correctly set in `.env`
- Make sure port 5000 is not in use

### If microphone doesn't work:
- Check browser permissions
- Try a different browser (Chrome/Edge recommended)
- Ensure no other app is using the microphone

### If you hear no response:
- Check your system volume
- Verify the backend console shows activity
- Check for error messages in browser console (F12)

## 📁 Project Structure
```
F.R.I.D.A.Y/
├── backend/
│   ├── app.py          # Full Whisper implementation
│   └── app_simple.py   # Simplified version (currently using)
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── friday_env/         # Virtual environment
├── .env               # API key configuration
├── run_backend.bat    # Backend launcher
├── run_frontend.bat   # Frontend launcher
└── README.md          # Full documentation
```

## 🎯 Next Steps

To upgrade to Whisper (better accuracy, offline):
1. Install Whisper: `pip install openai-whisper`
2. Use `app.py` instead of `app_simple.py`

Enjoy your conversation with FRIDAY!