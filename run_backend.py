#!/usr/bin/env python3
"""
Backend launcher script - can be run from project root
This script handles the path setup automatically
"""
import sys
import os
from pathlib import Path

# Add src directory to Python path
project_root = Path(__file__).parent
src_dir = project_root / "src"
sys.path.insert(0, str(src_dir))

# Change to src directory for relative imports
os.chdir(str(src_dir))

# Now import and run the app
if __name__ == "__main__":
    import uvicorn
    from app import app
    
    print("🚀 Starting ManchAI Backend...")
    print("📍 Running from:", os.getcwd())
    print("🌐 Server will be available at: http://localhost:8000")
    print("📚 API docs available at: http://localhost:8000/docs")
    print("")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)

