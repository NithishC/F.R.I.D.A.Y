"""
Test script for Edge-TTS functionality
Run this to verify Edge-TTS is working correctly
"""

import edge_tts
import asyncio
import base64
import pygame
import io
import os

async def test_edge_tts():
    """Test Edge-TTS functionality"""
    print("Testing Edge-TTS...")
    
    text = "Hello! This is a test of the Edge TTS system. If you can hear this, the text to speech is working correctly."
    voice = "en-US-AriaNeural"
    
    print(f"Text: {text}")
    print(f"Voice: {voice}")
    
    try:
        # Create communicate instance
        communicate = edge_tts.Communicate(text, voice)
        
        # Generate audio
        audio_data = b""
        print("Generating audio...")
        
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
        
        print(f"Audio generated: {len(audio_data)} bytes")
        
        # Save to file
        output_file = "test_output.mp3"
        with open(output_file, "wb") as f:
            f.write(audio_data)
        print(f"Audio saved to {output_file}")
        
        # Test base64 encoding
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        print(f"Base64 encoded length: {len(audio_base64)} characters")
        
        # Verify base64 decoding
        decoded = base64.b64decode(audio_base64)
        if len(decoded) == len(audio_data):
            print("✓ Base64 encoding/decoding verified")
        else:
            print("✗ Base64 encoding/decoding mismatch!")
        
        # Try to play with pygame
        try:
            pygame.mixer.init()
            pygame.mixer.music.load(io.BytesIO(audio_data))
            pygame.mixer.music.play()
            
            print("Playing audio... (press Ctrl+C to stop)")
            while pygame.mixer.music.get_busy():
                await asyncio.sleep(0.1)
                
        except Exception as e:
            print(f"Could not play audio with pygame: {e}")
            print("Audio file saved - you can play it manually")
        
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False

async def test_voices():
    """Test different voices"""
    voices = [
        "en-US-AriaNeural",
        "en-US-JennyNeural",
        "en-US-SaraNeural",
        "en-US-GuyNeural"
    ]
    
    text = "Testing voice"
    
    print("\nTesting different voices:")
    for voice in voices:
        try:
            communicate = edge_tts.Communicate(text, voice)
            audio_data = b""
            
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            
            print(f"✓ {voice}: {len(audio_data)} bytes")
        except Exception as e:
            print(f"✗ {voice}: {e}")

if __name__ == "__main__":
    print("Edge-TTS Test Script")
    print("=" * 50)
    
    # Run tests
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    # Test basic functionality
    success = loop.run_until_complete(test_edge_tts())
    
    if success:
        # Test different voices
        loop.run_until_complete(test_voices())
    
    loop.close()
    
    print("\nTest complete!")
