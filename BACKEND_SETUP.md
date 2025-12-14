# Backend Setup Guide

## Common Issues & Solutions

### Issue 1: Import Errors

**Error**: `ModuleNotFoundError: No module named 'planner'` or `No module named 'tools'`

**Solution**: Run the backend from the `src/` directory:

```bash
cd src
python app.py
```

**OR** set the PYTHONPATH:

```bash
# Windows PowerShell
$env:PYTHONPATH="src"
python src/app.py

# Windows CMD
set PYTHONPATH=src
python src/app.py

# Linux/Mac
export PYTHONPATH=src
python src/app.py
```

### Issue 2: Missing Dependencies

**Error**: `ModuleNotFoundError: No module named 'fastapi'` or similar

**Solution**: Install all Python dependencies:

```bash
pip install -r requirements.txt
```

Or install individually:
```bash
pip install fastapi uvicorn google-generativeai python-dotenv pydantic
```

### Issue 3: Missing Environment Variables

**Error**: `GEMINI_API_KEY not found` or API calls fail

**Solution**: Create a `.env` file in the project root:

```bash
# Create .env file
echo "GEMINI_API_KEY=your_actual_api_key_here" > .env
```

Or on Windows:
```powershell
# Create .env file
Set-Content -Path ".env" -Value "GEMINI_API_KEY=your_actual_api_key_here"
```

### Issue 4: Port Already in Use

**Error**: `Address already in use` or `port 8000 is already in use`

**Solution**: 
1. Find and stop the process using port 8000:
   ```bash
   # Windows
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:8000 | xargs kill
   ```

2. Or change the port in `src/app.py`:
   ```python
   uvicorn.run(app, host="0.0.0.0", port=8001)  # Use different port
   ```

### Issue 5: Python Version Mismatch

**Error**: Syntax errors or version-specific issues

**Solution**: Ensure Python 3.12+ is installed:

```bash
python --version  # Should show 3.12.x or higher
```

If using a different version, update the code or use Python 3.12.

## Step-by-Step Setup

1. **Navigate to src directory**:
   ```bash
   cd src
   ```

2. **Install dependencies** (if not already done):
   ```bash
   pip install -r ../requirements.txt
   ```

3. **Create .env file** (in project root, not src/):
   ```bash
   # From project root
   echo "GEMINI_API_KEY=your_key_here" > .env
   ```

4. **Run the backend**:
   ```bash
   python app.py
   ```

5. **Verify it's running**:
   - Open browser: http://localhost:8000
   - Should see: `{"status":"ManchAI Director is Online"}`
   - Check API docs: http://localhost:8000/docs

## Alternative: Run from Project Root

If you want to run from the project root, modify the imports:

**Option A**: Use relative imports (requires running as module):
```bash
python -m src.app
```

**Option B**: Add src to PYTHONPATH:
```bash
# Windows PowerShell
$env:PYTHONPATH="src"
python src/app.py
```

## Troubleshooting Checklist

- [ ] Python 3.12+ installed
- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file exists in project root with `GEMINI_API_KEY`
- [ ] Running from `src/` directory OR PYTHONPATH is set
- [ ] Port 8000 is not in use
- [ ] No firewall blocking port 8000

## Testing the Backend

```bash
# Test 1: Check imports
cd src
python -c "from planner import agent; from tools import tools; print('OK')"

# Test 2: Start server
python app.py

# Test 3: In another terminal, test the endpoint
curl http://localhost:8000/
# Should return: {"status":"ManchAI Director is Online"}
```

## Getting Help

If issues persist:
1. Check Python version: `python --version`
2. Check installed packages: `pip list | findstr fastapi`
3. Check for error messages in the terminal
4. Verify `.env` file exists and has the correct key

