# Architecture Overview

## High-Level System Architecture

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
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
┌───────▼────────┐    ┌──────────▼──────────┐  ┌────────▼────────┐
│  Director      │    │  Gemini Director    │  │  TTS Service    │
│  Agent         │    │  (Google Gemini API) │  │  (Mock/ElevenLabs)│
│                │    │                     │  │                 │
│  - Planner     │───▶│  - Prompt Builder   │  │  - Audio Gen    │
│  - Orchestrator│    │  - JSON Parser      │  │  - URL Return   │
│  - State Mgmt  │    │  - Context Handler  │  │                 │
└────────────────┘    └─────────────────────┘  └─────────────────┘
```

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

### Turn Processing Flow

```
1. User enters command in DirectionPanel
   ↓
2. Frontend calls /api/scene/turn with sceneState + userCommand
   ↓
3. API route calls generateSceneLines() (TypeScript) OR
   API route calls FastAPI backend /api/scene/turn
   ↓
4. Director Agent (planner.py) processes turn:
   a. Initialize scene if null
   b. Call tools.generate_dialogue() with context
   c. For each new line:
      - Generate TTS audio URL
      - Create Line object with unique ID
      - Assign beatIndex = currentBeat + 1
   d. Update scene_state['currentBeat'] += 1
   ↓
5. Return updated scene + new lines
   ↓
6. Frontend updates state and re-renders panels
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
