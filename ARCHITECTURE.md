# Architecture Overview

## Agentic AI Architecture (ReAct Pattern)

This system implements a **ReAct (Reasoning + Acting)** agentic architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                    (Next.js React Frontend)                     │
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │  Direction   │      │    Script    │      │     Cast     │ │
│  │    Panel     │      │    Panel     │      │    Panel     │ │
│  │              │      │              │      │              │ │
│  │ - User input │      │ - Line list  │      │ - Actor info │ │
│  │ - "Direct"   │      │ - Beat groups│      │ - Roles      │ │
│  │   button     │      │ - Auto-scroll│      │ - Languages  │ │
│  └──────┬───────┘      └──────┬───────┘      └──────┬───────┘ │
│         │                      │                      │         │
│         └──────────────────────┼──────────────────────┘         │
│                                │                                │
│                    ┌───────────▼───────────┐                    │
│                    │   State Management    │                    │
│                    │  (React useState)     │                    │
│                    └───────────┬───────────┘                    │
└────────────────────────────────┼────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   API Layer             │
                    │   /api/scene/turn       │
                    │   (Next.js API Route)   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Backend Services      │
                    │   (FastAPI / Python)    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Director Planner      │
                    │   (planner.py)          │
                    │                         │
                    │   ReAct Cycle:          │
                    │   1. REASON             │
                    │   2. PLAN               │
                    │   3. ACT                 │
                    │   4. OBSERVE             │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
┌───────▼────────┐    ┌──────────▼──────────┐  ┌────────▼────────┐
│   Memory       │    │   Executor          │  │   Tools         │
│   (memory.py)  │    │   (executor.py)    │  │   (tools.py)    │
│                │    │                     │  │                 │
│  - Context     │    │  - Execute Plan     │  │  - Gemini API   │
│  - History      │    │  - Call Tools       │  │  - TTS Service  │
│  - Metadata    │    │  - Log Results      │  │  - JSON Parse   │
└────────────────┘    └─────────────────────┘  └─────────────────┘
```

## Core Agent Modules

### 1. **Planner (`src/planner.py`)**
- **Purpose**: Breaks down user goals into sub-tasks using ReAct pattern
- **Key Methods**:
  - `plan_turn()`: Main planning method that creates execution plans
  - `_reason_about_command()`: Uses Gemini to reason about user commands
  - `_create_execution_plan()`: Breaks down into actionable sub-tasks
  - `process_turn()`: Orchestrates the complete ReAct cycle
- **Planning Process**:
  1. **Retrieve Context**: Gets relevant memory and scene state
  2. **Reason**: Uses Gemini to analyze the command
  3. **Plan**: Creates execution plan with sub-tasks
  4. **Execute**: Delegates to executor
  5. **Observe**: Processes results and updates state

### 2. **Executor (`src/executor.py`)**
- **Purpose**: Executes planned actions and tool calls
- **Key Methods**:
  - `execute_plan()`: Executes a sequence of planned actions
  - `_execute_action()`: Executes individual actions (dialogue, audio, etc.)
  - `call_gemini()`: Direct Gemini API calls for reasoning
- **Action Types**:
  - `generate_dialogue`: Generate dialogue using Gemini
  - `generate_audio`: Generate TTS audio
  - `initialize_scene`: Initialize new scene

### 3. **Memory (`src/memory.py`)**
- **Purpose**: Stores and retrieves scene context and dialogue history
- **Key Methods**:
  - `store_scene_state()`: Store scene state for a session
  - `retrieve_scene_state()`: Retrieve stored scene state
  - `get_recent_context()`: Get recent dialogue lines (sliding window)
  - `get_actor_context()`: Get actor information
  - `get_scene_metadata()`: Get scene metadata (title, genre, setting)
- **Features**:
  - In-memory storage (can be extended to database)
  - Context window management (last N lines)
  - Session-based organization

### 4. **Tools (`src/tools.py`)**
- **Purpose**: Direct integration with external APIs (Gemini, TTS)
- **Key Methods**:
  - `generate_dialogue()`: Calls Gemini API with context-aware prompts
  - `generate_tts_audio()`: Generates TTS audio (currently mocked)
- **Gemini Integration**:
  - Model: `gemini-1.5-flash`
  - Structured JSON output parsing
  - Error handling with fallbacks

## Component Breakdown

### 1. **Frontend Layer (Next.js/React)**

#### DirectionPanel Component
- **Purpose**: User input interface for director commands
- **Responsibilities**:
  - Capture user commands
  - Display current scene metadata
  - Handle form submission
  - Show processing state

#### ScriptPanel Component
- **Purpose**: Display generated script lines
- **Responsibilities**:
  - Group lines by beat index
  - Auto-scroll to latest line
  - Highlight newest additions
  - Format timestamps and actor names

#### CastPanel Component
- **Purpose**: Display cast information
- **Responsibilities**:
  - Show actor details (name, role, language, style)
  - Visual role indicators
  - Actor count display

### 2. **API Layer (Next.js API Routes)**

#### `/api/scene/turn` Endpoint
- **Method**: POST
- **Input**: `{ sceneState: SceneState | null, userCommand: string }`
- **Output**: `{ updatedScene: SceneState, newLines: Line[] }`
- **Responsibilities**:
  - Validate request
  - Call Gemini Director
  - Generate audio URLs
  - Merge new lines with existing scene

### 3. **Backend Layer (FastAPI/Python)**

#### DirectorAgent (`planner.py`)
- **Purpose**: Orchestrate the director turn workflow
- **Responsibilities**:
  - Initialize scene state if needed
  - Coordinate dialogue generation
  - Process TTS audio generation
  - Update scene state and beat counter
  - Return updated state

#### DirectorTools (`tools.py`)
- **Purpose**: Interface with external services
- **Responsibilities**:
  - Generate dialogue using Gemini API
  - Construct context-aware prompts
  - Parse Gemini JSON responses
  - Generate TTS audio URLs (mock implementation)

### 4. **AI Integration (Google Gemini)**

#### Gemini Director
- **Model**: `gemini-1.5-flash`
- **Input**: Scene context, recent dialogue, user command
- **Output**: Structured JSON with new dialogue lines
- **Prompt Engineering**:
  - Context includes: setting, actors, recent lines
  - Instruction format: Director's command
  - Output format: JSON with actorId and text

## Data Flow

### Agentic Workflow (ReAct Pattern)

```
1. User enters command in DirectionPanel
   ↓
2. Frontend calls /api/scene/turn with sceneState + userCommand
   ↓
3. FastAPI backend receives request
   ↓
4. PLANNER (planner.py) - REASON Phase:
   a. Retrieve context from Memory (recent lines, actors, metadata)
   b. Use Gemini to reason about the command:
      - Does it need scene initialization?
      - What type of dialogue/action?
      - Which actors involved?
      - How many lines?
   ↓
5. PLANNER - PLAN Phase:
   a. Break down into sub-tasks:
      - Sub-task 1: Initialize scene (if needed)
      - Sub-task 2: Generate dialogue lines
      - Sub-task 3: Generate audio for each line
   b. Create execution plan with action sequence
   ↓
6. EXECUTOR (executor.py) - ACT Phase:
   a. Execute each planned action:
      - Action 1: Initialize scene → returns default scene
      - Action 2: Generate dialogue → calls Gemini API via tools
      - Action 3: Generate audio → calls TTS (mocked)
   b. Collect results from each action
   ↓
7. PLANNER - OBSERVE Phase:
   a. Process execution results
   b. Build Line objects with UUIDs, timestamps, beatIndex
   c. Update scene state (add lines, increment beat)
   ↓
8. MEMORY (memory.py) - STORE Phase:
   a. Store updated scene state
   b. Log interaction for observability
   ↓
9. Return updated scene + new lines to frontend
   ↓
10. Frontend updates state and re-renders panels
```

## State Management

### SceneState Structure
```typescript
{
  title: string
  genre: string
  setting: string
  actors: Actor[]      // List of actors with roles, languages, styles
  lines: Line[]        // All dialogue/action lines
  currentBeat: number  // Current beat counter
}
```

### Beat Tracking
- **Initial**: `currentBeat = 0`
- **New Lines**: Assigned `beatIndex = currentBeat + 1`
- **After Addition**: `currentBeat` incremented
- **Consistency**: Both TypeScript and Python use same logic

## Key Design Decisions

1. **Dual Backend Support**: Both Next.js API routes and FastAPI can handle requests
2. **Async/Await Pattern**: Non-blocking operations for TTS and API calls
3. **Type Safety**: TypeScript types mirror Python data structures
4. **UUID for IDs**: Globally unique line IDs prevent collisions
5. **Beat-Based Organization**: Clear scene progression tracking
6. **Mock TTS**: Placeholder for ElevenLabs integration

## Scalability Considerations

- **Frontend**: Stateless React components, state in parent
- **Backend**: Stateless API handlers, scene state passed in requests
- **Future**: Could add database persistence, user sessions, multi-scene support

## Security

- API keys stored in environment variables
- `.env` files gitignored
- CORS configured for development (should be restricted in production)
- Input validation on API endpoints
