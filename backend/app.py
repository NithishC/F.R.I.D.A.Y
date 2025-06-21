from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
import tempfile
import base64
import io
from gtts import gTTS
import google.generativeai as genai
from dotenv import load_dotenv
from pydub import AudioSegment
from pydub.utils import which
import json
import logging
from datetime import datetime
import sys

# Create logs directory if it doesn't exist
logs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
os.makedirs(logs_dir, exist_ok=True)

# Set up logging
log_filename = os.path.join(logs_dir, f'friday_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_filename),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Log startup
logger.info("=" * 50)
logger.info("F.R.I.D.A.Y Backend Starting...")
logger.info("=" * 50)

# Load environment variables
load_dotenv()

# Check for FFmpeg
AudioSegment.converter = which("ffmpeg")
if not AudioSegment.converter:
    # Try common FFmpeg locations on Windows
    common_paths = [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files (x86)\ffmpeg\bin\ffmpeg.exe",
        os.path.join(os.path.dirname(__file__), "ffmpeg", "bin", "ffmpeg.exe")
    ]
    
    for path in common_paths:
        if os.path.exists(path):
            AudioSegment.converter = path
            logger.info(f"FFmpeg found at: {path}")
            break
    else:
        logger.warning("FFmpeg not found! Audio processing may fail.")
        logger.warning("Please install FFmpeg and add it to PATH or place it in the backend/ffmpeg/bin/ directory")

# Also set ffprobe
AudioSegment.ffprobe = which("ffprobe")
if not AudioSegment.ffprobe:
    if AudioSegment.converter:
        ffprobe_path = AudioSegment.converter.replace("ffmpeg.exe", "ffprobe.exe")
        if os.path.exists(ffprobe_path):
            AudioSegment.ffprobe = ffprobe_path

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Configure Gemini
api_key = os.getenv('GEMINI_API_KEY')
if api_key:
    genai.configure(api_key=api_key)
    logger.info("Gemini API key configured successfully")
else:
    logger.error("No Gemini API key found in .env file!")

# Initialize Gemini model
try:
    gemini_model = genai.GenerativeModel('gemini-pro')
    logger.info("Gemini model initialized")
except Exception as e:
    logger.error(f"Failed to initialize Gemini model: {e}")
    gemini_model = None

# For now, we'll use a simple transcription placeholder
# You can install and use SpeechRecognition as a temporary alternative
try:
    import speech_recognition as sr
    recognizer = sr.Recognizer()
    use_speech_recognition = True
    logger.info("Speech recognition module loaded")
except Exception as e:
    use_speech_recognition = False
    logger.error(f"Speech recognition not available: {e}")

class ConversationManager:
    def __init__(self):
        self.chat = None
        self.messages = []
        self.system_prompt = "You are FRIDAY, a helpful AI assistant. Keep your responses concise and conversational. Respond in a friendly, natural way."
    
    def start_chat(self):
        try:
            # Initialize a new chat session
            self.chat = gemini_model.start_chat(history=[])
            # Send the system prompt as the first message
            self.chat.send_message(self.system_prompt)
            logger.info("New chat session started")
        except Exception as e:
            logger.error(f"Failed to start chat: {e}")
        
    def add_message(self, role, content):
        self.messages.append({"role": role, "content": content})
        # Keep only last 10 messages to maintain context
        if len(self.messages) > 10:
            self.messages = self.messages[-10:]
    
    def get_response(self, user_input):
        try:
            if not self.chat:
                self.start_chat()
            
            self.add_message("user", user_input)
            logger.info(f"User: {user_input}")
            
            # Send message to Gemini
            response = self.chat.send_message(user_input)
            assistant_response = response.text
            
            self.add_message("assistant", assistant_response)
            logger.info(f"Assistant: {assistant_response}")
            return assistant_response
            
        except Exception as e:
            logger.error(f"Error getting Gemini response: {e}")
            # If error, try to reinitialize chat
            self.start_chat()
            try:
                response = self.chat.send_message(user_input)
                return response.text
            except Exception as e2:
                logger.error(f"Failed to get response after retry: {e2}")
                return "I'm sorry, I encountered an error processing your request. Please try again."

conversation_manager = ConversationManager()

@app.route('/')
def index():
    return jsonify({"status": "FRIDAY Backend is running"})

@app.route('/api/health', methods=['GET'])
def health_check():
    health_status = {
        "status": "healthy",
        "speech_recognition": "available" if use_speech_recognition else "not available",
        "gemini": "configured" if os.getenv('GEMINI_API_KEY') else "not configured",
        "ffmpeg": "available" if AudioSegment.converter else "not available"
    }
    logger.info(f"Health check: {health_status}")
    return jsonify(health_status)

@socketio.on('connect')
def handle_connect():
    logger.info('Client connected')
    emit('connected', {'data': 'Connected to FRIDAY'})

@socketio.on('disconnect')
def handle_disconnect():
    logger.info('Client disconnected')

@socketio.on('audio_data')
def handle_audio_data(data):
    try:
        logger.info("Received audio data from client")
        
        # Decode base64 audio data
        audio_data = base64.b64decode(data['audio'])
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp_file:
            tmp_file.write(audio_data)
            tmp_file_path = tmp_file.name
        
        logger.info(f"Audio saved to temporary file: {tmp_file_path}")
        
        # Convert webm to wav
        try:
            audio = AudioSegment.from_file(tmp_file_path, format="webm")
            wav_path = tmp_file_path.replace('.webm', '.wav')
            audio.export(wav_path, format="wav")
            logger.info("Audio converted to WAV format")
        except Exception as e:
            logger.error(f"Audio conversion failed: {e}")
            emit('error', {'message': 'Audio conversion failed. Please ensure FFmpeg is installed.'})
            os.unlink(tmp_file_path)
            return
        
        # Perform speech recognition
        text = ""
        if use_speech_recognition:
            try:
                with sr.AudioFile(wav_path) as source:
                    audio_data = recognizer.record(source)
                    text = recognizer.recognize_google(audio_data)
                    logger.info(f"Speech recognized: {text}")
            except sr.UnknownValueError:
                logger.warning("Speech recognition could not understand the audio")
                text = ""
            except sr.RequestError as e:
                logger.error(f"Speech recognition error: {e}")
                text = ""
            except Exception as e:
                logger.error(f"Unexpected error in speech recognition: {e}")
                text = ""
        
        if not text:
            logger.warning("No text recognized, using fallback")
            emit('error', {'message': 'Could not understand the audio. Please speak clearly and try again.'})
            os.unlink(tmp_file_path)
            os.unlink(wav_path)
            return
        
        # Get Gemini response
        response_text = conversation_manager.get_response(text)
        
        # Convert response to speech
        try:
            tts = gTTS(text=response_text, lang='en', slow=False)
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            logger.info("Text-to-speech conversion successful")
        except Exception as e:
            logger.error(f"Text-to-speech failed: {e}")
            emit('error', {'message': 'Failed to generate speech response.'})
            os.unlink(tmp_file_path)
            os.unlink(wav_path)
            return
        
        # Send back the results
        emit('transcription', {'text': text})
        emit('response', {
            'text': response_text,
            'audio': base64.b64encode(audio_buffer.read()).decode('utf-8')
        })
        
        # Clean up temporary files
        os.unlink(tmp_file_path)
        os.unlink(wav_path)
        logger.info("Audio processing completed successfully")
        
    except Exception as e:
        logger.error(f"Error processing audio: {e}", exc_info=True)
        emit('error', {'message': str(e)})

@app.route('/api/text-to-speech', methods=['POST'])
def text_to_speech():
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        logger.info(f"Text-to-speech request: {text[:50]}...")
        
        # Generate speech
        tts = gTTS(text=text, lang='en', slow=False)
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        return send_file(
            audio_buffer,
            mimetype='audio/mp3',
            as_attachment=True,
            download_name='response.mp3'
        )
    except Exception as e:
        logger.error(f"Text-to-speech error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reset-conversation', methods=['POST'])
def reset_conversation():
    """Reset the conversation history"""
    conversation_manager.messages = []
    conversation_manager.chat = None
    logger.info("Conversation reset by user")
    return jsonify({'status': 'Conversation reset'})

if __name__ == '__main__':
    logger.info("Starting Flask application...")
    logger.info(f"Log file: {log_filename}")
    
    # Check critical components
    if not os.getenv('GEMINI_API_KEY'):
        logger.warning("WARNING: No Gemini API key found! Please add it to .env file")
    
    if not AudioSegment.converter:
        logger.warning("WARNING: FFmpeg not found! Audio processing will fail")
        logger.warning("Download FFmpeg from: https://ffmpeg.org/download.html")
    
    socketio.run(app, debug=True, port=5000)