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
import whisper
import numpy as np
from pydub import AudioSegment
import json
import torch

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Configure Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# Initialize Whisper model (using base model for balance between speed and accuracy)
print("Loading Whisper model...")
whisper_model = whisper.load_model("base")
print("Whisper model loaded successfully!")

# Initialize Gemini model
gemini_model = genai.GenerativeModel('gemini-pro')

class ConversationManager:
    def __init__(self):
        self.chat = None
        self.messages = []
        self.system_prompt = "You are FRIDAY, a helpful AI assistant. Keep your responses concise and conversational. Respond in a friendly, natural way."
    
    def start_chat(self):
        # Initialize a new chat session
        self.chat = gemini_model.start_chat(history=[])
        # Send the system prompt as the first message
        self.chat.send_message(self.system_prompt)
        
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
            
            # Send message to Gemini
            response = self.chat.send_message(user_input)
            assistant_response = response.text
            
            self.add_message("assistant", assistant_response)
            return assistant_response
            
        except Exception as e:
            print(f"Error getting Gemini response: {e}")
            # If error, try to reinitialize chat
            self.start_chat()
            try:
                response = self.chat.send_message(user_input)
                return response.text
            except:
                return "I'm sorry, I encountered an error processing your request. Please try again."

conversation_manager = ConversationManager()

@app.route('/')
def index():
    return jsonify({"status": "FRIDAY Backend is running with Whisper and Gemini"})

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "whisper": "loaded",
        "gemini": "configured"
    })

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('connected', {'data': 'Connected to FRIDAY'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('audio_data')
def handle_audio_data(data):
    try:
        # Decode base64 audio data
        audio_data = base64.b64decode(data['audio'])
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp_file:
            tmp_file.write(audio_data)
            tmp_file_path = tmp_file.name
        
        # Convert webm to wav for Whisper
        audio = AudioSegment.from_file(tmp_file_path, format="webm")
        wav_path = tmp_file_path.replace('.webm', '.wav')
        
        # Export as 16kHz mono WAV (Whisper's preferred format)
        audio = audio.set_frame_rate(16000).set_channels(1)
        audio.export(wav_path, format="wav")
        
        # Perform speech recognition with Whisper
        print("Transcribing audio with Whisper...")
        result = whisper_model.transcribe(wav_path, language="en")
        text = result["text"].strip()
        
        if text:
            print(f"Recognized text: {text}")
            
            # Get Gemini response
            response_text = conversation_manager.get_response(text)
            print(f"Gemini response: {response_text}")
            
            # Convert response to speech
            tts = gTTS(text=response_text, lang='en', slow=False)
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            
            # Send back the results
            emit('transcription', {'text': text})
            emit('response', {
                'text': response_text,
                'audio': base64.b64encode(audio_buffer.read()).decode('utf-8')
            })
        else:
            emit('error', {'message': 'No speech detected in the audio'})
        
        # Clean up temporary files
        os.unlink(tmp_file_path)
        os.unlink(wav_path)
        
    except Exception as e:
        print(f"Error processing audio: {e}")
        emit('error', {'message': str(e)})

@app.route('/api/text-to-speech', methods=['POST'])
def text_to_speech():
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
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
        return jsonify({'error': str(e)}), 500

@app.route('/api/reset-conversation', methods=['POST'])
def reset_conversation():
    """Reset the conversation history"""
    conversation_manager.messages = []
    conversation_manager.chat = None
    return jsonify({'status': 'Conversation reset'})

if __name__ == '__main__':
    # Check if CUDA is available for Whisper
    if torch.cuda.is_available():
        print(f"CUDA is available! Using GPU: {torch.cuda.get_device_name(0)}")
    else:
        print("CUDA not available, using CPU for Whisper")
    
    socketio.run(app, debug=True, port=5000)