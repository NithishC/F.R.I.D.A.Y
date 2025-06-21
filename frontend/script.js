// Initialize Socket.IO connection
const socket = io('http://localhost:5000');

// DOM elements
const status = document.getElementById('status');
const conversation = document.getElementById('conversation');
const audioVisualizer = document.getElementById('audioVisualizer');
const visualizerCanvas = audioVisualizer.getContext('2d');
const resetButton = document.getElementById('resetButton');
const wakeIndicator = document.getElementById('wakeIndicator');

// Speech recognition setup
let recognition;
let isListening = false;
let isProcessing = false;
let silenceTimer;
let finalTranscript = '';
let isWakeWordActive = false;
let hasUserInteracted = false;
let audioContext = null;

// Initialize Web Speech API
function initSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        updateStatus('Speech recognition not supported', 'error');
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
        if (!isWakeWordActive && hasUserInteracted) {
            updateStatus('Say "Hello Friday" to activate', 'active');
        }
    };
    
    recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                // Check for wake word only when not active
                if (!isWakeWordActive && (transcript.toLowerCase().includes('hello friday') || 
                    transcript.toLowerCase().includes('hey friday'))) {
                    activateFriday();
                    finalTranscript = ''; // Clear the wake word from transcript
                    return;
                }
                
                // If Friday is active, accumulate all speech
                if (isWakeWordActive) {
                    finalTranscript += transcript + ' ';
                    
                    // Check for deactivation commands
                    const lowerTranscript = transcript.toLowerCase();
                    if (lowerTranscript.includes('goodbye') || 
                        lowerTranscript.includes('stop listening') ||
                        lowerTranscript.includes('go to sleep') ||
                        lowerTranscript.includes('deactivate')) {
                        // Send the goodbye message first
                        processSpeech('goodbye');
                        return;
                    }
                    
                    resetSilenceTimer();
                }
            } else {
                interimTranscript += transcript;
                
                // Check for wake word in interim results too
                if (!isWakeWordActive && (interimTranscript.toLowerCase().includes('hello friday') || 
                    interimTranscript.toLowerCase().includes('hey friday'))) {
                    activateFriday();
                    return;
                }
                
                // If Friday is active, show interim results and reset silence timer
                if (isWakeWordActive && interimTranscript.trim()) {
                    resetSilenceTimer();
                }
            }
        }
        
        // Show real-time transcription when Friday is active
        if (isWakeWordActive) {
            const currentText = finalTranscript + interimTranscript;
            if (currentText.trim()) {
                updateStatus(`"${currentText.trim()}"`, 'active');
            }
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'no-speech') {
            // Ignore no-speech errors when waiting for wake word
            if (!isWakeWordActive) {
                return;
            }
        }
        
        let errorMessage = 'Speech recognition error';
        switch(event.error) {
            case 'network':
                errorMessage = 'Network error - please check your connection';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone access denied';
                break;
            case 'audio-capture':
                errorMessage = 'No microphone found';
                break;
        }
        
        if (event.error !== 'no-speech') {
            updateStatus(errorMessage, 'error');
            setTimeout(() => {
                if (hasUserInteracted) startListening();
            }, 3000);
        }
    };
    
    recognition.onend = () => {
        console.log('Speech recognition ended');
        isListening = false;
        
        // Process final transcript if Friday was active and we have speech
        if (isWakeWordActive && finalTranscript.trim() && !isProcessing) {
            processSpeech(finalTranscript.trim());
        }
        
        // Always restart recognition if user has interacted and we're not processing
        if (!isProcessing && hasUserInteracted) {
            setTimeout(() => startListening(), 100);
        }
    };
    
    return true;
}

// Initialize speech recognition on load
const speechRecognitionAvailable = initSpeechRecognition();

// Socket.IO event listeners
socket.on('connect', () => {
    console.log('Connected to server');
    if (!hasUserInteracted) {
        updateStatus('Click anywhere to start FRIDAY', 'active');
        showStartPrompt();
    } else {
        updateStatus('Connected - Say "Hello Friday" to start', 'active');
        startListening();
    }
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateStatus('Disconnected', 'error');
});

socket.on('response', async (data) => {
    console.log('Received response:', data);
    console.log('Response contains audio:', !!data.audio);
    
    // Add message to conversation
    addMessage('assistant', data.text);
    
    // Check if this is a goodbye response
    const isGoodbye = data.text.toLowerCase().includes('goodbye') || 
                      data.text.toLowerCase().includes('see you') ||
                      data.text.toLowerCase().includes('going to sleep');
    
    if (data.audio) {
        console.log('Audio data received, length:', data.audio.length);
        console.log('First 50 chars of audio:', data.audio.substring(0, 50));
        
        // Store goodbye flag for use after audio playback
        window.shouldDeactivateAfterAudio = isGoodbye;
        
        // Play the audio response
        await playAudioResponse(data.audio);
    } else {
        console.error('No audio data in response!');
        // Still reset state even if no audio
        if (isGoodbye) {
            deactivateFriday();
            updateStatus('Say "Hello Friday" to activate');
            isProcessing = false;
            finalTranscript = '';
        } else {
            handleAudioEnd();
        }
    }
});

socket.on('error', (data) => {
    updateStatus(`Error: ${data.message}`, 'error');
    isProcessing = false;
    isWakeWordActive = false;
    setTimeout(() => updateStatus('Say "Hello Friday" to activate'), 3000);
});

// Show start prompt
function showStartPrompt() {
    // Add click listener to entire document
    document.addEventListener('click', initializeAssistant, { once: true });
    
    // Add visual prompt
    const promptDiv = document.createElement('div');
    promptDiv.id = 'startPrompt';
    promptDiv.className = 'start-prompt';
    promptDiv.innerHTML = `
        <div class="prompt-content">
            <h2>Welcome to F.R.I.D.A.Y</h2>
            <p>Click anywhere to start the voice assistant</p>
            <button class="start-button">Start FRIDAY</button>
        </div>
    `;
    document.body.appendChild(promptDiv);
}

// Initialize assistant after user interaction
function initializeAssistant() {
    hasUserInteracted = true;
    
    // Initialize audio context
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Remove prompt if exists
    const prompt = document.getElementById('startPrompt');
    if (prompt) {
        prompt.remove();
    }
    
    // Start listening
    updateStatus('Say "Hello Friday" to activate', 'active');
    startListening();
    
    // Play welcome sound
    playWelcomeSound();
}

// Play welcome sound
function playWelcomeSound() {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

// Activate Friday when wake word is detected
function activateFriday() {
    isWakeWordActive = true;
    finalTranscript = '';
    updateStatus('Listening... Speak now', 'active');
    
    // Visual feedback
    wakeIndicator.classList.add('active');
    document.querySelector('.visualizer').classList.add('active');
    animateVisualizer();
    
    // Play activation sound
    playActivationSound();
    
    // Start silence detection
    resetSilenceTimer();
}

// Reset silence timer
function resetSilenceTimer() {
    clearTimeout(silenceTimer);
    
    // Wait for 3 seconds of silence before processing (increased from 2)
    silenceTimer = setTimeout(() => {
        if (finalTranscript.trim() && !isProcessing) {
            processSpeech(finalTranscript.trim());
        } else if (!finalTranscript.trim() && isWakeWordActive) {
            // No speech detected for a while, but keep listening
            // Don't deactivate, just show we're still listening
            updateStatus('Still listening... speak anytime', 'active');
            // Set a longer timeout to eventually deactivate if no activity
            silenceTimer = setTimeout(() => {
                if (!finalTranscript.trim() && !isProcessing) {
                    deactivateFriday();
                    updateStatus('Session ended. Say "Hello Friday" to activate');
                }
            }, 30000); // 30 seconds of inactivity before deactivating
        }
    }, 3000);
}

// Deactivate Friday
function deactivateFriday() {
    isWakeWordActive = false;
    wakeIndicator.classList.remove('active');
    document.querySelector('.visualizer').classList.remove('active');
}

// Process the speech
function processSpeech(text) {
    console.log('Processing speech:', text);
    
    isProcessing = true;
    clearTimeout(silenceTimer);
    
    // Stop visualizer
    deactivateFriday();
    
    // Add user message to conversation
    addMessage('user', text);
    
    // Send text via Socket.IO
    socket.emit('text_message', { text: text });
    
    updateStatus('Thinking...');
}

// Start continuous listening
function startListening() {
    if (!speechRecognitionAvailable || isListening || !hasUserInteracted) return;
    
    try {
        isListening = true;
        recognition.start();
    } catch (error) {
        console.error('Error starting recognition:', error);
        isListening = false;
        setTimeout(() => startListening(), 1000);
    }
}

// Play activation sound
function playActivationSound() {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
}

async function playAudioResponse(base64Audio) {
    try {
        // Ensure audio context is initialized and resumed
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Resume audio context if suspended (browser autoplay policy)
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('Audio context resumed');
        }
        
        // Pause recognition during audio playback
        if (recognition && isListening) {
            recognition.stop();
            isListening = false;
        }
        
        // Convert base64 to blob
        const blob = base64ToBlob(base64Audio, 'audio/mp3');
        const audioUrl = URL.createObjectURL(blob);
        
        // Create audio element with proper attributes
        const audio = new Audio();
        audio.src = audioUrl;
        audio.volume = 1.0;
        // Don't set crossOrigin for blob URLs
        audio.preload = 'auto';
        
        // Log for debugging
        console.log('Playing audio response, blob size:', blob.size, 'bytes');
        
        // Play audio with Web Audio API for better control
        try {
            // First try simple play
            await audio.play();
            console.log('Audio playback started successfully');
            
            // Update status to show speaking
            updateStatus('Speaking...', 'active');
        } catch (playError) {
            console.error('Initial play failed:', playError);
            
            // Fallback: use Web Audio API directly
            try {
                const response = await fetch(audioUrl);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start(0);
                
                console.log('Web Audio API playback started');
                updateStatus('Speaking...', 'active');
                
                // Calculate duration and set up end handler
                const duration = audioBuffer.duration * 1000; // Convert to milliseconds
                setTimeout(() => {
                    console.log('Web Audio playback ended');
                    handleAudioEnd();
                }, duration);
                
                URL.revokeObjectURL(audioUrl);
                return; // Exit since we're using Web Audio API
            } catch (webAudioError) {
                console.error('Web Audio API fallback failed:', webAudioError);
                throw playError; // Re-throw original error
            }
        }
        
        // Set up event handlers for HTML Audio element
        audio.onended = () => {
            console.log('Audio playback ended');
            URL.revokeObjectURL(audioUrl);
            handleAudioEnd();
        };
        
        audio.onerror = (error) => {
            console.error('Audio error event:', error);
            console.error('Audio error details:', audio.error);
            URL.revokeObjectURL(audioUrl);
            updateStatus('Audio playback error', 'error');
            handleAudioEnd();
        };
        
    } catch (error) {
        console.error('Audio playback error:', error);
        updateStatus('Audio playback failed', 'error');
        handleAudioEnd();
    }
}

// Helper function to handle audio end
function handleAudioEnd() {
    // Check if we should deactivate after goodbye
    if (window.shouldDeactivateAfterAudio) {
        window.shouldDeactivateAfterAudio = false;
        deactivateFriday();
        updateStatus('Say "Hello Friday" to activate');
        isProcessing = false;
        finalTranscript = '';
        // Resume listening for wake word
        setTimeout(() => {
            if (hasUserInteracted) {
                startListening();
            }
        }, 500);
        return;
    }
    
    // Keep Friday active after response for continuous conversation
    isProcessing = false;
    finalTranscript = '';
    
    // Stay active and ready for next input
    isWakeWordActive = true;
    updateStatus('Listening...', 'active');
    wakeIndicator.classList.add('active');
    document.querySelector('.visualizer').classList.add('active');
    
    // Restart visualizer animation
    animateVisualizer();
    
    // Resume listening immediately
    setTimeout(() => {
        if (hasUserInteracted) {
            startListening();
            // Start silence timer for next interaction
            resetSilenceTimer();
        }
    }, 100);
}

// Helper function to convert base64 to blob
function base64ToBlob(base64, mimeType) {
    try {
        // Remove any whitespace or newlines
        const cleanBase64 = base64.replace(/\s/g, '');
        
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        console.log('Created blob:', blob.size, 'bytes, type:', blob.type);
        return blob;
    } catch (error) {
        console.error('Error converting base64 to blob:', error);
        throw error;
    }
}

function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    
    // Process markdown for display
    let displayText = text;
    displayText = displayText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    displayText = displayText.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
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
    
    if (isWakeWordActive) {
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
            conversation.innerHTML = `
                <div class="message assistant">
                    <div class="message-content">
                        Conversation reset. Say "Hello Friday" to start a new conversation.
                    </div>
                </div>
            `;
            updateStatus('Conversation reset', 'active');
            setTimeout(() => updateStatus('Say "Hello Friday" to activate'), 2000);
        }
    } catch (error) {
        console.error('Error resetting conversation:', error);
        updateStatus('Reset failed', 'error');
        setTimeout(() => updateStatus('Say "Hello Friday" to activate'), 2000);
    }
});

// Check for browser compatibility
if (!speechRecognitionAvailable) {
    status.innerHTML = 'Speech recognition not supported. Please use Chrome, Edge, or Safari.';
}

// Add debug keyboard shortcut (Ctrl+Shift+T) to test TTS
document.addEventListener('keydown', async (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'T') {
        console.log('Testing TTS...');
        
        try {
            const response = await fetch('http://localhost:5000/api/text-to-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: 'This is a test of the text to speech system. If you can hear this, audio playback is working correctly.'
                })
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const audioUrl = URL.createObjectURL(blob);
                const audio = new Audio(audioUrl);
                audio.volume = 1.0;
                
                audio.play().then(() => {
                    console.log('Test audio playing successfully');
                    updateStatus('TTS Test: Playing...', 'active');
                }).catch(error => {
                    console.error('Test audio failed:', error);
                    updateStatus('TTS Test: Failed', 'error');
                });
                
                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    updateStatus('TTS Test: Complete', 'active');
                    setTimeout(() => updateStatus('Say "Hello Friday" to activate'), 2000);
                };
            }
        } catch (error) {
            console.error('TTS test error:', error);
            updateStatus('TTS Test: Error', 'error');
        }
    }
});