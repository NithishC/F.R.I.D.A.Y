import os
import sys
import zipfile
import urllib.request
import shutil

def download_ffmpeg():
    """Download and extract FFmpeg for Windows"""
    print("Downloading FFmpeg...")
    
    # Create ffmpeg directory in backend
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    ffmpeg_dir = os.path.join(backend_dir, "backend", "ffmpeg")
    os.makedirs(ffmpeg_dir, exist_ok=True)
    
    # Download URL for FFmpeg Windows build
    ffmpeg_url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
    zip_path = os.path.join(ffmpeg_dir, "ffmpeg.zip")
    
    try:
        # Download FFmpeg
        print(f"Downloading from {ffmpeg_url}")
        print("This may take a few minutes...")
        urllib.request.urlretrieve(ffmpeg_url, zip_path)
        
        # Extract ZIP
        print("Extracting FFmpeg...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(ffmpeg_dir)
        
        # Find the extracted folder (it has a version number)
        extracted_folders = [f for f in os.listdir(ffmpeg_dir) if f.startswith('ffmpeg-') and os.path.isdir(os.path.join(ffmpeg_dir, f))]
        
        if extracted_folders:
            extracted_folder = extracted_folders[0]
            source_bin = os.path.join(ffmpeg_dir, extracted_folder, "bin")
            target_bin = os.path.join(ffmpeg_dir, "bin")
            
            # Move bin folder to expected location
            if os.path.exists(source_bin):
                if os.path.exists(target_bin):
                    shutil.rmtree(target_bin)
                shutil.move(source_bin, target_bin)
                
                # Clean up
                shutil.rmtree(os.path.join(ffmpeg_dir, extracted_folder))
                os.remove(zip_path)
                
                print(f"✓ FFmpeg installed successfully!")
                print(f"  Location: {target_bin}")
                print(f"  Files: {', '.join(os.listdir(target_bin))}")
                return True
            else:
                print("Error: Could not find bin folder in extracted files")
                return False
        else:
            print("Error: Could not find extracted FFmpeg folder")
            return False
            
    except Exception as e:
        print(f"Error downloading FFmpeg: {e}")
        return False

def check_ffmpeg():
    """Check if FFmpeg is available"""
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    ffmpeg_path = os.path.join(backend_dir, "backend", "ffmpeg", "bin", "ffmpeg.exe")
    
    if os.path.exists(ffmpeg_path):
        print(f"✓ FFmpeg is already installed at: {ffmpeg_path}")
        return True
    
    # Check system PATH
    import shutil
    if shutil.which("ffmpeg"):
        print("✓ FFmpeg is available in system PATH")
        return True
    
    return False

if __name__ == "__main__":
    print("=== FFmpeg Setup for F.R.I.D.A.Y ===\n")
    
    if check_ffmpeg():
        print("\nFFmpeg is already set up!")
    else:
        print("\nFFmpeg not found. Would you like to download it?")
        response = input("Download FFmpeg? (y/n): ").lower()
        
        if response == 'y':
            if download_ffmpeg():
                print("\n✓ Setup complete! You can now run the application.")
            else:
                print("\n✗ Setup failed. Please download FFmpeg manually from https://ffmpeg.org/download.html")
        else:
            print("\nPlease install FFmpeg manually:")
            print("1. Download from: https://ffmpeg.org/download.html")
            print("2. Extract and add the 'bin' folder to your system PATH")
            print("   OR")
            print("3. Place ffmpeg.exe and ffprobe.exe in: backend/ffmpeg/bin/")
