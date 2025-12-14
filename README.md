# ManchAI - Real-Time AI Scriptwriting Studio

**ManchAI** is a real-time scriptwriting studio where an AI Director (powered by Google Gemini) collaborates with users to create dynamic, interactive scripts. The Director interprets user commands and generates dialogue, actions, and scene progression in real-time.

## 🎬 Features

- **AI Director**: Google Gemini-powered director that interprets commands and generates script content
- **Real-Time Script Generation**: Dynamic dialogue and action lines generated on-demand
- **Beat-Based Organization**: Scripts organized by beats for clear scene progression
- **Cast Management**: Visual cast panel with actor roles, languages, and styles
- **Dark Cinematic UI**: Modern, dark-themed interface optimized for creative workflow
- **Dual Backend Support**: Next.js (TypeScript) and FastAPI (Python) implementations

## 🏗️ Agentic Architecture (ReAct Pattern)

ManchAI implements a **ReAct (Reasoning + Acting)** agentic architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Direction   │  │    Script    │  │     Cast     │       │
│  │    Panel     │  │    Panel     │  │    Panel     │       │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────-─┘       │
│         │                 │                │                │
│         └─────────────────┼────────────────┘                │
│                           │                                 │
│                    ┌───────▼────────┐                       │
│                    │  API Route     │                       │
│                    │ /api/scene/turn│                       │
│                    └───────┬────────┘                       │
└────────────────────────────┼────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Backend API    │
                    │ (FastAPI/Python)│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Planner       │
                    │  (planner.py)   │
                    │  ReAct Cycle    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼──────────────────┐
        │                    │                  │
┌───────▼────────┐   ┌───────▼────────┐  ┌──────▼────────┐
│   Memory       │   │   Executor     │  │   Tools       │
│  (memory.py)   │   │  (executor.py) │  │  (tools.py)   │
│                │   │                │  │               │
│  - Context     │   │  - Execute     │  │  - Gemini API │
│  - History     │   │  - Call Tools  │  │  - TTS        │
└────────────────┘   └────────────────┘  └───────────────┘
```

### Core Agent Modules

- **`planner.py`**: Breaks down user goals into sub-tasks using Gemini for reasoning
- **`executor.py`**: Executes planned actions and tool calls
- **`memory.py`**: Stores and retrieves scene context and dialogue history
- **`tools.py`**: Direct integration with Google Gemini API

### Agent Workflow

1. **REASON**: Planner uses Gemini to analyze user command
2. **PLAN**: Breaks down into sub-tasks (initialize, generate dialogue, generate audio)
3. **ACT**: Executor calls tools (Gemini API, TTS)
4. **OBSERVE**: Processes results and updates state
5. **STORE**: Memory module stores updated state

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.12+
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Chintamani26/ctrl-shift-delusion-main.git
   cd ctrl-shift-delusion-main
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   
   Create `.env` in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   For Next.js (optional), create `.env.local`:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. **Run the development servers**

   Terminal 1 (Next.js Frontend):
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:3000`

   Terminal 2 (Python Backend):
   
   **Option A - Easy way (from project root):**
   ```bash
   python run_backend.py
   ```
   
   **Option B - Manual way:**
   ```bash
   cd src
   python app.py
   ```
   
   Backend will be available at `http://localhost:8000`
   API documentation: `http://localhost:8000/docs`
   
   **Troubleshooting**: If you encounter issues, see [BACKEND_SETUP.md](BACKEND_SETUP.md) for detailed troubleshooting guide.

## 📂 Project Structure

```
ctrl-shift-delusion-main/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI smoke-test workflow
├── src/                        # Your agent code
│   ├── app.py                  # FastAPI backend server
│   ├── planner.py              # ReAct planner (breaks down tasks)
│   ├── executor.py             # Tool executor (executes actions)
│   ├── memory.py               # Memory & context management
│   ├── tools.py                # Gemini API integration & TTS
│   ├── components/              # React UI components
│   │   ├── DirectionPanel.tsx
│   │   ├── ScriptPanel.tsx
│   │   └── CastPanel.tsx
│   ├── lib/                     # Core logic
│   │   ├── geminiDirector.ts   # Gemini Director (TypeScript)
│   │   └── mockTTS.ts           # TTS mock implementation
│   ├── pages/                   # Next.js pages
│   │   ├── index.tsx            # Main app page
│   │   └── api/
│   │       └── scene/
│   │           └── turn.ts      # API endpoint
│   ├── types/
│   │   └── scene.ts             # TypeScript type definitions
│   └── styles/
│       └── globals.css          # Global styles
├── environment.yml              # Conda environment specification
├── Dockerfile                   # Docker build file (alternative to Conda)
├── TEST.sh                      # Smoke-test script to verify core functionality
├── ARCHITECTURE.md              # High-level diagram and component breakdown
├── EXPLANATION.md               # Technical write-up of your design choices
├── DEMO.md                      # Link to demo video with timestamps
├── requirements.txt             # Python dependencies
├── package.json                 # Node.js dependencies
└── README.md                    # This file
```

## 🧪 Testing

Run the smoke test to verify core functionality:

```bash
chmod +x TEST.sh
./TEST.sh
```

Or manually test:

```bash
# Test Python backend
cd src
python -c "from planner import agent; import asyncio; print('Backend OK')"

# Test Next.js build
npm run build
```

## 📋 Submission Checklist

- [x] All code in `src/` runs without errors  
- [x] `ARCHITECTURE.md` contains a clear diagram sketch and explanation  
- [x] `EXPLANATION.md` covers planning, tool use, memory, and limitations  
- [ ] `DEMO.md` links to a 3–5 min video with timestamped highlights  

## 🏅 Judging Criteria Alignment

### Technical Excellence
- ✅ Robust error handling and async/await patterns
- ✅ Type-safe TypeScript implementation
- ✅ Consistent beat tracking across backends
- ✅ Proper environment variable management

### Solution Architecture & Documentation
- ✅ Clear separation of concerns (Frontend/Backend/Tools)
- ✅ Comprehensive documentation (README, ARCHITECTURE, EXPLANATION)
- ✅ Well-organized codebase with consistent naming
- ✅ Security best practices (API keys in .env, .gitignore)

### Innovative Gemini Integration
- ✅ Creative use of Gemini as a "Director" AI
- ✅ Context-aware prompt engineering for script generation
- ✅ Dynamic scene state management
- ✅ Structured JSON output parsing

### Societal Impact & Novelty
- ✅ Novel application: AI-powered collaborative scriptwriting
- ✅ Real-world applicability: Content creation, education, entertainment
- ✅ Unique approach: Real-time director-agent collaboration
- ✅ Potential for accessibility in creative industries

## 🔧 Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.12, Pydantic
- **AI**: Google Gemini API (gemini-1.5-flash)
- **UI Components**: Lucide React icons

## 📝 License

See [LICENSE](LICENSE) file for details.

## 📝 Example Commands

For sample director commands to test the app, see [EXAMPLE_COMMANDS.md](EXAMPLE_COMMANDS.md).

Quick examples:
- `Start with Arjun discovering a mysterious encrypted file.`
- `Nexus reveals a shocking truth about the hackathon.`
- `Arjun and Nexus must work together to escape danger.`

## 🤝 Contributors

Chintamani Joshi - @Chintamani26 ,
Mihika Jadhav - @mihikajadhav02
---

**Built for the Agentic AI App Hackathon** 🚀
