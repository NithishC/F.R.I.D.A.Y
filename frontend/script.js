// Initialize Socket.IO connection
const socket = io('http://localhost:5000');

// DOM elements
const micButton = document.getElementById('micButton');
const status = document.getElementById('status');
const conversation = document.getElementById('conversation');
const audioVisualizer = document.getElementById('audioVisualizer');
const visualizerCanvas = audioVisualizer.getContext('2d');
const resetButton = document.getElementById('resetButton');
const testButton = document.getElementById('testButton');

// Speech recognition setup
let recognition;
let isRecording = false;
let finalTranscript = '';
let interimTranscript = '';

// Initialize Web Speech API
function initSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        updateStatus('Speech recognition not supported', 'error');
        micButton.disabled = true;
        return false;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    // Recognition event handlers
    recognition.onstart = () => {
        console.log('Speech recognition started');
        updateStatus('Listening...', 'active');
        finalTranscript = '';
        interimTranscript = '';
    };
    
    recognition.onresult = (event) => {
        interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Show real-time transcription
        const currentText = finalTranscript + interimTranscript;
        if (currentText.trim()) {
            updateStatus(`"${currentText.trim()}"`, 'active');
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        let errorMessage = 'Speech recognition error';
        
        switch(event.error) {
            case 'network':
                errorMessage = 'Network error - please check your connection';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone access denied';
                break;
            case 'no-speech':
                errorMessage = 'No speech detected';
                break;
            case 'audio-capture':
                errorMessage = 'No microphone found';
                break;
        }
        
        updateStatus(errorMessage, 'error');
        setTimeout(() => updateStatus('Ready'), 3000);
        isRecording = false;
        micButton.classList.remove('recording');
        micButton.querySelector('.mic-text').textContent = 'Hold to Talk';
    };
    
    recognition.onend = () => {
        console.log('Speech recognition ended');
        if (isRecording) {
            // Restart if still holding button
            recognition.start();
        } else {
            // Process final transcript
            const fullTranscript = (finalTranscript + interimTranscript).trim();
            if (fullTranscript) {
                sendTextToServer(fullTranscript);
            } else {
                updateStatus('No speech detected', 'error');
                setTimeout(() => updateStatus('Ready'), 2000);
            }
        }
    };
    
    return true;
}

// Initialize speech recognition on load
const speechRecognitionAvailable = initSpeechRecognition();

// Socket.IO event listeners
socket.on('connect', () => {
    console.log('Connected to server');
    updateStatus('Connected', 'active');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateStatus('Disconnected', 'error');
});

socket.on('response', (data) => {
    addMessage('assistant', data.text);
    if (data.audio) {
        playAudioResponse(data.audio);
    }
    // Show emotion indicator if provided
    if (data.emotion) {
        console.log('Response emotion:', data.emotion);
    }
});

socket.on('error', (data) => {
    updateStatus(`Error: ${data.message}`, 'error');
    setTimeout(() => updateStatus('Ready'), 3000);
});

// Microphone button event listeners
micButton.addEventListener('mousedown', startRecording);
micButton.addEventListener('mouseup', stopRecording);
micButton.addEventListener('touchstart', startRecording);
micButton.addEventListener('touchend', stopRecording);

// Prevent context menu on long press
micButton.addEventListener('contextmenu', (e) => e.preventDefault());

function startRecording() {
    if (!speechRecognitionAvailable || isRecording) return;
    
    try {
        isRecording = true;
        recognition.start();
        
        // Update UI
        micButton.classList.add('recording');
        micButton.querySelector('.mic-text').textContent = 'Listening...';
        
        // Visual feedback
        document.querySelector('.visualizer').classList.add('active');
        animateVisualizer();
        
    } catch (error) {
        console.error('Error starting recognition:', error);
        updateStatus('Failed to start recording', 'error');
        isRecording = false;
        setTimeout(() => updateStatus('Ready'), 3000);
    }
}

function stopRecording() {
    if (!isRecording) return;
    
    isRecording = false;
    recognition.stop();
    
    // Update UI
    micButton.classList.remove('recording');
    micButton.querySelector('.mic-text').textContent = 'Hold to Talk';
    updateStatus('Processing...');
    
    // Stop visualizer
    document.querySelector('.visualizer').classList.remove('active');
}

function sendTextToServer(text) {
    console.log('Sending text to server:', text);
    
    // Add user message to conversation
    addMessage('user', text);
    
    // Send text via Socket.IO
    socket.emit('text_message', { text: text });
    
    updateStatus('Thinking...');
}

function playAudioResponse(base64Audio) {
    try {
        // Edge-TTS returns MP3 format
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        audio.play().catch(error => {
            console.error('Error playing audio:', error);
            // Fallback: try as wav
            const audioWav = new Audio(`data:audio/wav;base64,${base64Audio}`);
            audioWav.play().catch(e => console.error('Audio playback failed:', e));
        });
        
        audio.onended = () => {
            updateStatus('Ready');
        };
    } catch (error) {
        console.error('Audio playback error:', error);
        updateStatus('Ready');
    }
}

function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    
    // Process markdown for display (basic support)
    let displayText = text;
    // Convert bold markdown to HTML
    displayText = displayText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Convert italic markdown to HTML
    displayText = displayText.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Use innerHTML for formatted text, but escape other HTML first
    displayText = displayText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    displayText = displayText.replace(/&lt;strong&gt;/g, '<strong>').replace(/&lt;\/strong&gt;/g, '</strong>');
    displayText = displayText.replace(/&lt;em&gt;/g, '<em>').replace(/&lt;\/em&gt;/g, '</em>');
    
    contentDiv.innerHTML = displayText;
    
    messageDiv.appendChild(contentDiv);
    conversation.appendChild(messageDiv);
    
    // Scroll to bottom
    conversation.scrollTop = conversation.scrollHeight;
}

function updateStatus(message, className = '') {
    status.textContent = message;
    status.className = 'status';
    if (className) {
        status.classList.add(className);
    }
}

// Simple visualizer animation
let animationId;
function animateVisualizer() {
    const WIDTH = audioVisualizer.width;
    const HEIGHT = audioVisualizer.height;
    
    visualizerCanvas.fillStyle = 'rgba(0, 0, 0, 0.2)';
    visualizerCanvas.fillRect(0, 0, WIDTH, HEIGHT);
    
    // Create random bars for visual effect
    const barCount = 20;
    const barWidth = WIDTH / barCount;
    
    for (let i = 0; i < barCount; i++) {
        const barHeight = Math.random() * HEIGHT * 0.7 + HEIGHT * 0.1;
        
        const r = 250 * (i / barCount);
        const g = 50;
        const b = 250;
        
        visualizerCanvas.fillStyle = `rgb(${r},${g},${b})`;
        visualizerCanvas.fillRect(i * barWidth, HEIGHT - barHeight, barWidth - 2, barHeight);
    }
    
    if (isRecording) {
        animationId = requestAnimationFrame(animateVisualizer);
    }
}

// Reset button handler
resetButton.addEventListener('click', async () => {
    try {
        const response = await fetch('http://localhost:5000/api/reset-conversation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            // Clear conversation UI
            conversation.innerHTML = `
                <div class="message assistant">
                    <div class="message-content">
                        Conversation reset. How can I help you today?
                    </div>
                </div>
            `;
            updateStatus('Conversation reset', 'active');
            setTimeout(() => updateStatus('Ready'), 2000);
        }
    } catch (error) {
        console.error('Error resetting conversation:', error);
        updateStatus('Reset failed', 'error');
        setTimeout(() => updateStatus('Ready'), 2000);
    }
});

// Test button handler
testButton.addEventListener('click', async () => {
    updateStatus('Testing system...', 'active');
    
    const testText = "Hello FRIDAY, how are you today?";
    sendTextToServer(testText);
});

// Check for browser compatibility
if (!speechRecognitionAvailable) {
    status.innerHTML = 'Speech recognition not supported. Please use Chrome, Edge, or Safari.';
    micButton.disabled = true;
}