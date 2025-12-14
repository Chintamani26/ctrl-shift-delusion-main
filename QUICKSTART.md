# Quick Start Guide

## For Your Partner - Backend Setup

### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

**If that doesn't work, install individually:**
```bash
pip install fastapi uvicorn google-generativeai python-dotenv pydantic
```

### Step 2: Create Environment File

Create a file named `.env` in the **project root** (same folder as `README.md`):

**Windows (PowerShell):**
```powershell
Set-Content -Path ".env" -Value "GEMINI_API_KEY=your_api_key_here"
```

**Windows (CMD):**
```cmd
echo GEMINI_API_KEY=your_api_key_here > .env
```

**Linux/Mac:**
```bash
echo "GEMINI_API_KEY=your_api_key_here" > .env
```

**Get your API key from:** https://makersuite.google.com/app/apikey

### Step 3: Run the Backend

**Easiest way (from project root):**
```bash
python run_backend.py
```

**Alternative way:**
```bash
cd src
python app.py
```

### Step 4: Verify It's Working

1. Open browser: http://localhost:8000
2. Should see: `{"status":"ManchAI Director is Online"}`
3. API docs: http://localhost:8000/docs

## Common Errors & Fixes

### Error: "No module named 'fastapi'"
**Fix:** Run `pip install -r requirements.txt`

### Error: "No module named 'planner'"
**Fix:** Make sure you're running from project root with `python run_backend.py` OR `cd src` then `python app.py`

### Error: "GEMINI_API_KEY not found"
**Fix:** Create `.env` file in project root with your API key

### Error: "Address already in use"
**Fix:** Port 8000 is busy. Kill the process or change port in `src/app.py`

### Error: "python: command not found"
**Fix:** Python not in PATH. Use full path or install Python 3.12+

## Still Having Issues?

1. Check Python version: `python --version` (needs 3.12+)
2. Check if dependencies installed: `pip list | findstr fastapi`
3. Verify `.env` file exists in project root
4. Try running from `src/` directory: `cd src && python app.py`
5. See [BACKEND_SETUP.md](BACKEND_SETUP.md) for detailed troubleshooting

