import subprocess
import os
import time
import threading
import webbrowser

def start_backend():
    """Start the Flask backend server"""
    backend_path = r"C:\Users\navee\Projects\Hackathon\F.R.I.D.A.Y\backend"
    python_path = r"C:\Users\navee\Projects\Hackathon\F.R.I.D.A.Y\friday_env\Scripts\python.exe"
    
    print("Starting backend server on http://localhost:5000...")
    os.chdir(backend_path)
    subprocess.Popen([python_path, "app.py"])

def start_frontend():
    """Start the frontend HTTP server"""
    frontend_path = r"C:\Users\navee\Projects\Hackathon\F.R.I.D.A.Y\frontend"
    
    print("Starting frontend server on http://localhost:8000...")
    os.chdir(frontend_path)
    subprocess.Popen(["python", "-m", "http.server", "8000"])

def main():
    print("=== Starting F.R.I.D.A.Y Voice Assistant ===\n")
    
    # Start backend in a thread
    backend_thread = threading.Thread(target=start_backend)
    backend_thread.start()
    
    # Wait a bit for backend to initialize
    time.sleep(3)
    
    # Start frontend in a thread
    frontend_thread = threading.Thread(target=start_frontend)
    frontend_thread.start()
    
    # Wait for servers to start
    time.sleep(2)
    
    print("\n✓ Backend running on: http://localhost:5000")
    print("✓ Frontend running on: http://localhost:8000")
    print("\nOpening browser...")
    
    # Open browser
    webbrowser.open("http://localhost:8000")
    
    print("\nPress Ctrl+C to stop all servers")
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down servers...")

if __name__ == "__main__":
    main()