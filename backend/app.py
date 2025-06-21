from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
import base64
import io
import re
import edge_tts
import asyncio
import google.generativeai as genai
from dotenv import load_dotenv
import logging
from datetime import datetime
import sys
import codecs

# Create logs directory if it doesn't exist
logs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
os.makedirs(logs_dir, exist_ok=True)

# Set up logging with UTF-8 encoding
log_filename = os.path.join(logs_dir, f'friday_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')

# Configure file handler with UTF-8 encoding
file_handler = logging.FileHandler(log_filename, encoding='utf-8')
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))

# Configure console handler with UTF-8 encoding
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))

# For Windows console, ensure UTF-8 output
if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Set up root logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# Log startup
logger.info("=" * 50)
logger.info("F.R.I.D.A.Y Backend Starting...")
logger.info("=" * 50)

# Load environment variables
load_dotenv()

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
    gemini_model = genai.GenerativeModel('gemini-2.5-flash')
    logger.info("Gemini model initialized")
except Exception as e:
    logger.error(f"Failed to initialize Gemini model: {e}")
    gemini_model = None

# Voice configuration for Edge-TTS
# Using Aria - a friendly female voice with emotion support
VOICE = "en-US-AriaNeural"
# Alternative voices with different personalities:
# "en-US-JennyNeural" - More casual and warm
# "en-US-SaraNeural" - Professional
# "en-GB-SoniaNeural" - British accent

class ConversationManager:
    def __init__(self):
        self.chat = None
        self.messages = []
        self.system_prompt = """You are FRIDAY, a helpful AI assistant. Keep your responses concise and conversational. 
        Respond in a friendly, natural way. Feel free to express appropriate emotions in your responses - 
        be enthusiastic when sharing good news, empathetic when someone seems troubled, and cheerful in general conversation."""
    
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

def detect_emotion(text):
    """Detect emotion from text to apply appropriate voice style"""
    text_lower = text.lower()
    
    # Check for different emotional indicators
    if any(word in text_lower for word in ['excited', 'amazing', 'wonderful', 'fantastic', 'great news', '!']):
        return 'cheerful'
    elif any(word in text_lower for word in ['sorry', 'unfortunately', 'sad', 'difficult']):
        return 'empathetic'
    elif any(word in text_lower for word in ['?', 'how', 'what', 'why', 'when', 'where']):
        return 'friendly'
    elif any(word in text_lower for word in ['urgent', 'important', 'warning', 'alert']):
        return 'serious'
    else:
        return 'chat'  # Default conversational style


async def generate_speech(text, emotion='chat'):
    """Generate speech with emotion using Edge-TTS"""
    # Map emotions to voice variations
    voice_map = {
        'cheerful': "en-US-AriaNeural",  # Default Aria is already cheerful
        'empathetic': "en-US-JennyNeural",  # Jenny has a warmer, more empathetic tone
        'friendly': "en-US-AriaNeural",
        'serious': "en-US-SaraNeural",  # Sara is more professional/serious
        'chat': "en-US-AriaNeural"
    }
    
    selected_voice = voice_map.get(emotion, VOICE)
    
    # Create communicate instance with plain text (not SSML)
    communicate = edge_tts.Communicate(text, selected_voice)
    
    # Generate audio to bytes
    audio_data = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data += chunk["data"]
    
    return audio_data

@app.route('/')
def index():
    return jsonify({"status": "FRIDAY Backend is running"})

@app.route('/api/health', methods=['GET'])
def health_check():
    health_status = {
        "status": "healthy",
        "gemini": "configured" if os.getenv('GEMINI_API_KEY') else "not configured",
        "mode": "client-side speech recognition",
        "voice": "emotional TTS enabled"
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

@socketio.on('text_message')
def handle_text_message(data):
    """Handle text messages from client-side speech recognition"""
    try:
        text = data.get('text', '').strip()
        
        if not text:
            emit('error', {'message': 'No text received'})
            return
        
        logger.info(f"Received text message: {text}")
        
        # Get Gemini response
        response_text = conversation_manager.get_response(text)
        
        # Clean up text for speech (remove markdown formatting and emojis)
        speech_text = response_text
        # Remove bold markdown
        speech_text = speech_text.replace('**', '')
        # Remove italic markdown
        speech_text = speech_text.replace('*', '')
        # Remove other common markdown
        speech_text = speech_text.replace('##', '')
        speech_text = speech_text.replace('###', '')
        
        # Remove emojis and other unicode characters that shouldn't be spoken
        # Remove emoji patterns
        emoji_pattern = re.compile("["
                                   u"\U0001F600-\U0001F64F"  # emoticons
                                   u"\U0001F300-\U0001F5FF"  # symbols & pictographs
                                   u"\U0001F680-\U0001F6FF"  # transport & map symbols
                                   u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
                                   u"\U00002702-\U000027B0"
                                   u"\U000024C2-\U0001F251"
                                   u"\U0001F900-\U0001F9FF"  # Supplemental Symbols and Pictographs
                                   u"\U00002600-\U000026FF"  # Miscellaneous Symbols
                                   u"\U00002700-\U000027BF"  # Dingbats
                                   "]+", flags=re.UNICODE)
        speech_text = emoji_pattern.sub('', speech_text)
        
        # Clean up any double spaces
        speech_text = ' '.join(speech_text.split())
        
        # Detect emotion from the response
        emotion = detect_emotion(response_text)
        logger.info(f"Detected emotion: {emotion}")
        
        # Convert response to speech with emotion
        try:
            # Run async function in sync context
            audio_data = asyncio.run(generate_speech(speech_text, emotion))
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            logger.info(f"Text-to-speech conversion successful with {emotion} style")
        except Exception as e:
            logger.error(f"Text-to-speech failed: {e}")
            audio_base64 = None
        
        # Send response back to client with original formatted text for display
        emit('response', {
            'text': response_text,  # Original with markdown and emojis for display
            'audio': audio_base64,
            'emotion': emotion  # Send emotion info to frontend
        })
        
        logger.info("Response sent successfully")
        
    except Exception as e:
        logger.error(f"Error processing text message: {e}", exc_info=True)
        emit('error', {'message': f'Error: {str(e)}'})

@app.route('/api/chat', methods=['POST'])
def chat():
    """REST API endpoint for text chat"""
    try:
        data = request.json
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        logger.info(f"Chat API request: {text}")
        
        # Get Gemini response
        response_text = conversation_manager.get_response(text)
        
        return jsonify({
            'success': True,
            'response': response_text
        })
        
    except Exception as e:
        logger.error(f"Chat API error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

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
    logger.info("Mode: Client-side speech recognition with emotional TTS")
    logger.info(f"Voice: {VOICE}")
    
    # Check critical components
    if not os.getenv('GEMINI_API_KEY'):
        logger.warning("WARNING: No Gemini API key found! Please add it to .env file")
    
    socketio.run(app, debug=True, port=5000)