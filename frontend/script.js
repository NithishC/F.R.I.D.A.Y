// Initialize Socket.IO connection
const socket = io('http://localhost:5000');

// DOM elements
const micButton = document.getElementById('micButton');
const status = document.getElementById('status');
const conversation = document.getElementById('conversation');
const audioVisualizer = document.getElementById('audioVisualizer');
const visualizerCanvas = audioVisualizer.getContext('2d');
const resetButton = document.getElementById('resetButton');

// Audio recording variables
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let audioContext;
let analyser;
let dataArray;
let animationId;

// Initialize audio context
function initAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
}

// Socket.IO event listeners
socket.on('connect', () => {
    console.log('Connected to server');
    updateStatus('Connected', 'active');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateStatus('Disconnected', 'error');
});

socket.on('transcription', (data) => {
    addMessage('user', data.text);
});

socket.on('response', (data) => {
    addMessage('assistant', data.text);
    playAudioResponse(data.audio);
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

async function startRecording() {
    if (isRecording) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (!audioContext) {
            initAudioContext();
        }
        
        // Connect to analyser for visualization
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        // Start visualization
        document.querySelector('.visualizer').classList.add('active');
        visualize();
        
        // Set up MediaRecorder
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            sendAudioToServer(audioBlob);
            
            // Stop visualization
            cancelAnimationFrame(animationId);
            document.querySelector('.visualizer').classList.remove('active');
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        
        // Update UI
        micButton.classList.add('recording');
        micButton.querySelector('.mic-text').textContent = 'Recording...';
        updateStatus('Listening...', 'active');
        
    } catch (error) {
        console.error('Error accessing microphone:', error);
        updateStatus('Microphone access denied', 'error');
        setTimeout(() => updateStatus('Ready'), 3000);
    }
}

function stopRecording() {
    if (!isRecording || !mediaRecorder) return;
    
    mediaRecorder.stop();
    isRecording = false;
    
    // Update UI
    micButton.classList.remove('recording');
    micButton.querySelector('.mic-text').textContent = 'Hold to Talk';
    updateStatus('Processing...');
}

function sendAudioToServer(audioBlob) {
    const reader = new FileReader();
    reader.onload = () => {
        const base64Audio = reader.result.split(',')[1];
        socket.emit('audio_data', { audio: base64Audio });
    };
    reader.readAsDataURL(audioBlob);
}

function playAudioResponse(base64Audio) {
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    audio.play().catch(error => {
        console.error('Error playing audio:', error);
    });
    
    audio.onended = () => {
        updateStatus('Ready');
    };
}

function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.textContent = text;
    
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

function visualize() {
    const WIDTH = audioVisualizer.width;
    const HEIGHT = audioVisualizer.height;
    
    analyser.getByteFrequencyData(dataArray);
    
    visualizerCanvas.fillStyle = 'rgba(0, 0, 0, 0.2)';
    visualizerCanvas.fillRect(0, 0, WIDTH, HEIGHT);
    
    const barWidth = (WIDTH / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
        barHeight = (dataArray[i] / 255) * HEIGHT;
        
        const r = 250 * (i / dataArray.length);
        const g = 50;
        const b = 250;
        
        visualizerCanvas.fillStyle = `rgb(${r},${g},${b})`;
        visualizerCanvas.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
    }
    
    animationId = requestAnimationFrame(visualize);
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

// Check for browser compatibility
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    updateStatus('Browser not supported', 'error');
    micButton.disabled = true;
}