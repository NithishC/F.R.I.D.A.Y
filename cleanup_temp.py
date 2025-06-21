import os

files_to_delete = [
    r"C:\Users\navee\Projects\Hackathon\F.R.I.D.A.Y\install_ffmpeg.bat",
    r"C:\Users\navee\Projects\Hackathon\F.R.I.D.A.Y\setup_ffmpeg.py",
    r"C:\Users\navee\Projects\Hackathon\F.R.I.D.A.Y\QUICK_START.md",
    r"C:\Users\navee\Projects\Hackathon\F.R.I.D.A.Y\test_installation.py",
    r"C:\Users\navee\Projects\Hackathon\F.R.I.D.A.Y\start_servers.py"
]

for file_path in files_to_delete:
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Deleted: {file_path}")
        else:
            print(f"Not found: {file_path}")
    except Exception as e:
        print(f"Error deleting {file_path}: {e}")

print("\nCleanup complete!")