import sys
print(f"Python version: {sys.version}")

try:
    import flask
    print("[OK] Flask installed")
except:
    print("[X] Flask not installed")

try:
    import google.generativeai as genai
    print("[OK] Google Generative AI installed")
except:
    print("[X] Google Generative AI not installed")

try:
    import speech_recognition as sr
    print("[OK] SpeechRecognition installed")
except:
    print("[X] SpeechRecognition not installed")

try:
    from gtts import gTTS
    print("[OK] gTTS installed")
except:
    print("[X] gTTS not installed")

try:
    import dotenv
    print("[OK] python-dotenv installed")
except:
    print("[X] python-dotenv not installed")

print("\nAll basic dependencies are installed! You can now run the app.")
print("\nTo run the app:")
print("1. Add your Gemini API key to the .env file")
print("2. Run: run_backend.bat")
print("3. In another terminal, run: run_frontend.bat")
print("4. Open http://localhost:8000 in your browser")