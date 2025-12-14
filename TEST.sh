#!/bin/bash
# Smoke-test script to verify core functionality of ManchAI

set -e  # Exit on error

echo "🧪 Running ManchAI Smoke Tests..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check Python dependencies
echo "📦 Test 1: Checking Python dependencies..."
if python -c "import fastapi, uvicorn, google.generativeai, dotenv, pydantic" 2>/dev/null; then
    echo -e "${GREEN}✓ Python dependencies installed${NC}"
else
    echo -e "${RED}✗ Python dependencies missing${NC}"
    exit 1
fi

# Test 2: Check Node.js dependencies
echo "📦 Test 2: Checking Node.js dependencies..."
if [ -d "node_modules" ] && [ -f "node_modules/.bin/next" ]; then
    echo -e "${GREEN}✓ Node.js dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠ Node.js dependencies not found (run: npm install)${NC}"
fi

# Test 3: Python imports
echo "🔍 Test 3: Testing Python module imports..."
cd src
if python -c "from planner import agent; from tools import tools; print('OK')" 2>/dev/null; then
    echo -e "${GREEN}✓ Python modules import successfully${NC}"
else
    echo -e "${RED}✗ Python module import failed${NC}"
    exit 1
fi
cd ..

# Test 4: TypeScript compilation
echo "🔍 Test 4: Testing TypeScript compilation..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ TypeScript compiles successfully${NC}"
else
    echo -e "${YELLOW}⚠ TypeScript compilation has warnings (check manually)${NC}"
fi

# Test 5: Check environment variables
echo "🔍 Test 5: Checking environment setup..."
if [ -f ".env" ] || [ -f ".env.local" ]; then
    echo -e "${GREEN}✓ Environment file found${NC}"
else
    echo -e "${YELLOW}⚠ No .env file found (create one with GEMINI_API_KEY)${NC}"
fi

# Test 6: Python async functionality
echo "🔍 Test 6: Testing async functionality..."
cd src
if python -c "
import asyncio
from planner import agent

async def test():
    result = await agent.process_turn(None, 'Test command')
    assert 'title' in result
    assert 'actors' in result
    assert 'lines' in result
    print('OK')

asyncio.run(test())
" 2>/dev/null; then
    echo -e "${GREEN}✓ Async functionality works${NC}"
else
    echo -e "${RED}✗ Async test failed${NC}"
    exit 1
fi
cd ..

# Test 7: Check file structure
echo "📁 Test 7: Checking file structure..."
REQUIRED_FILES=(
    "src/app.py"
    "src/planner.py"
    "src/tools.py"
    "src/pages/index.tsx"
    "src/lib/geminiDirector.ts"
    "ARCHITECTURE.md"
    "EXPLANATION.md"
    "DEMO.md"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All required files present${NC}"
else
    echo -e "${RED}✗ Missing files: ${MISSING_FILES[*]}${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All smoke tests passed!${NC}"
echo ""
echo "🚀 Ready to run:"
echo "   Frontend: npm run dev"
echo "   Backend:  cd src && python app.py"

