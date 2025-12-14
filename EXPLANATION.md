# Technical Explanation

## 1. Agentic Workflow (ReAct Pattern)

The ManchAI Director implements a **ReAct (Reasoning + Acting)** agentic architecture, following a clear planning-execution-observation cycle.

### Complete Agent Cycle

1. **Receive User Input**
   - User types a director command in the DirectionPanel (e.g., "Alex confronts Morgan about the secret")
   - Frontend captures the command and current scene state
   - POST request sent to `/api/scene/turn` with `{ sceneState, userCommand }`

2. **REASON Phase (Planner)**
   - **Memory Retrieval**: Planner retrieves relevant context from Memory module:
     - Recent dialogue lines (last 5 lines via sliding window)
     - Actor information and roles
     - Scene metadata (title, genre, setting, current beat)
   - **Gemini Reasoning**: Planner uses Gemini API to analyze the command:
     - Does this require scene initialization?
     - What type of dialogue/action should be generated?
     - Which actors should be involved?
     - How many lines should be generated?
   - **Output**: Structured reasoning result with identified requirements

3. **PLAN Phase (Planner)**
   - **Task Breakdown**: Planner breaks down the user command into sub-tasks:
     - **Sub-task 1**: Initialize scene (if needed)
     - **Sub-task 2**: Generate dialogue lines using Gemini
     - **Sub-task 3**: Generate audio for each line
   - **Execution Plan**: Creates a structured plan with:
     - Plan ID (UUID)
     - List of actions with types and parameters
     - Context information (session ID, current beat)

4. **ACT Phase (Executor)**
   - **Execute Actions**: Executor processes each planned action:
     - **Action 1**: `initialize_scene` → Returns default scene state
     - **Action 2**: `generate_dialogue` → Calls Gemini API via Tools module
       - Constructs context-aware prompt
       - Sends to `gemini-1.5-flash` model
       - Parses JSON response
     - **Action 3**: `generate_audio` → Calls TTS service (mocked)
   - **Collect Results**: Executor logs each action's success/failure
   - **Error Handling**: Failed actions are logged but don't stop the workflow

5. **OBSERVE Phase (Planner)**
   - **Process Results**: Planner processes execution results:
     - Extracts generated dialogue lines
     - For each line: generates audio URL, creates Line object with UUID
     - Assigns `beatIndex = currentBeat + 1`
     - Updates scene state (adds lines, increments beat)
   - **State Update**: Builds complete updated scene state

6. **STORE Phase (Memory)**
   - **Store State**: Memory module stores updated scene state
   - **Log Interaction**: Logs the interaction for observability:
     - Timestamp
     - User command
     - Plan ID and action count
     - Success status

7. **Response & Rendering**
   - Updated scene and new lines returned to frontend
   - React state updated
   - UI re-renders with new content
   - ScriptPanel auto-scrolls to latest line

## 2. Key Modules

### Planner (`src/planner.py`)
- **Purpose**: Implements ReAct pattern - breaks down user goals into sub-tasks
- **Key Functions**:
  - `plan_turn()`: Main planning method that creates execution plans
  - `_reason_about_command()`: Uses Gemini to reason about user commands
  - `_create_execution_plan()`: Breaks down into actionable sub-tasks
  - `process_turn()`: Orchestrates complete ReAct cycle (Plan → Execute → Observe)
  - `_retrieve_context()`: Retrieves relevant memory and context
  - `_process_execution_results()`: Processes executor results and updates state
- **Planning Style**: 
  - Uses Gemini for reasoning (not just execution)
  - Breaks complex commands into atomic sub-tasks
  - Creates structured execution plans with action sequences

### Executor (`src/executor.py`)
- **Purpose**: Executes planned actions and tool calls
- **Key Functions**:
  - `execute_plan()`: Executes a sequence of planned actions
  - `_execute_action()`: Executes individual actions (dialogue, audio, initialization)
  - `call_gemini()`: Direct Gemini API calls for reasoning (used by planner)
  - `log_execution()`: Logs execution steps for observability
- **Action Types**:
  - `generate_dialogue`: Generate dialogue using Gemini
  - `generate_audio`: Generate TTS audio
  - `initialize_scene`: Initialize new scene
- **Error Handling**: Catches and logs errors without stopping workflow

### Memory (`src/memory.py`)
- **Purpose**: Stores and retrieves scene context and dialogue history
- **Key Functions**:
  - `store_scene_state()`: Store scene state for a session
  - `retrieve_scene_state()`: Retrieve stored scene state
  - `get_recent_context()`: Get recent dialogue lines (sliding window, last N lines)
  - `get_actor_context()`: Get actor information
  - `get_scene_metadata()`: Get scene metadata (title, genre, setting, beat)
  - `log_interaction()`: Log interactions for observability
- **Memory Strategy**:
  - In-memory storage (session-based)
  - Context window management (last 5-10 lines)
  - Can be extended to database/vector store

### Tools (`src/tools.py`)
- **Purpose**: Direct integration with external APIs (Gemini, TTS)
- **Key Functions**:
  - `generate_dialogue()`: Calls Gemini API with context-aware prompts
  - `generate_tts_audio()`: Mock TTS implementation (async)
- **Gemini Integration**:
  - Uses `google.generativeai` library
  - Model: `gemini-1.5-flash`
  - Prompt engineering for structured JSON output
  - Error handling with fallback responses
- **API Key Management**: Loads from `.env` file securely

### Gemini Director (`src/lib/geminiDirector.ts`)
- **Purpose**: TypeScript implementation of Gemini Director
- **Key Functions**:
  - `generateSceneLines()`: Main entry point
  - `generateLinesFromPrompt()`: Calls Gemini (currently mocked)
  - `constructPrompt()`: Builds context-aware prompts
  - `mockGenerateLines()`: Fallback mock implementation

### Backend API (`src/app.py`)
- **Purpose**: FastAPI server for backend processing
- **Endpoints**:
  - `GET /`: Health check
  - `POST /api/scene/turn`: Main turn processing endpoint
- **Features**:
  - CORS middleware for frontend communication
  - Pydantic models for request/response validation
  - Error handling with HTTP exceptions

## 3. Tool Integration

### Google Gemini API Integration

The system uses Gemini API in **two distinct ways**:

#### 1. Reasoning (Planner → Gemini)
- **Purpose**: Analyze user commands and determine requirements
- **Location**: `planner.py` → `_reason_about_command()`
- **Usage**:
  ```python
  reasoning_prompt = f"""Analyze the director's instruction..."""
  response = await executor.call_gemini(reasoning_prompt)
  reasoning_result = json.loads(response)
  ```
- **Output**: Structured JSON with:
  - `needs_initialization`: Boolean
  - `dialogue_type`: "dialogue" | "action" | "both"
  - `involved_actors`: List of actor IDs
  - `num_lines`: Number of lines to generate
  - `reasoning`: Explanation of analysis

#### 2. Dialogue Generation (Executor → Tools → Gemini)
- **Purpose**: Generate actual dialogue lines
- **Location**: `tools.py` → `generate_dialogue()`
- **Usage**:
  ```python
  model = genai.GenerativeModel('gemini-1.5-flash')
  response = model.generate_content(prompt)
  ```
- **Model**: `gemini-1.5-flash`
- **Prompt Structure**:
  - Context: Setting, characters, recent dialogue (last 5 lines)
  - Instruction: User's director command
  - Output Format: JSON with `newLines` array
- **Response Parsing**:
  - Removes markdown code blocks (```json)
  - Parses JSON to extract dialogue lines
  - Handles errors with fallback responses

### API Key Management
- **Storage**: `.env` file (gitignored)
- **Loading**: `python-dotenv` loads from `.env`
- **Security**: Never committed to repository
- **Verification**: System warns if key is missing

### Text-to-Speech (Mock)
- **Current**: Mock implementation with `asyncio.sleep()`
- **Future**: ElevenLabs API integration
- **Function**: `generate_tts_audio(text, voiceId)`
- **Returns**: Audio URL (currently placeholder)

## 4. Memory & State Management

### Memory Module (`memory.py`)
- **Storage**: In-memory dictionary (session-based)
- **Structure**: 
  - `scene_states`: Dictionary mapping session_id → scene_state
  - `dialogue_history`: Dictionary mapping session_id → list of lines
- **Context Retrieval**:
  - **Recent Lines**: Sliding window (last 5-10 lines) for token efficiency
  - **Actor Context**: Full actor list retrieved when needed
  - **Scene Metadata**: Title, genre, setting, current beat
- **Persistence**: Currently in-memory (stateless API design)
- **Future**: Could add database (PostgreSQL, MongoDB) or vector store for semantic search

### Context Window Management
- **Strategy**: Sliding window approach
  - Only last 5 lines sent to Gemini (token efficiency)
  - Configurable via `max_history_lines` parameter
  - Prevents context overflow in long scenes
- **Actor List**: Full actor list included in each prompt
- **Scene Metadata**: Title, genre, setting included for context
- **Session Management**: Each session maintains separate memory

### Beat Tracking
- **Purpose**: Organize script by beats (scene progression units)
- **Implementation**: Consistent across TypeScript and Python
- **Logic**: `beatIndex = currentBeat + 1`, then increment `currentBeat`
- **Storage**: Stored in scene state and memory module

## 5. Observability & Testing

### Logging
- **Python Backend**: `print()` statements for debugging
  - Director Agent processing messages
  - Error messages with stack traces
- **TypeScript**: `console.error()` for API errors
- **Future**: Structured logging with levels (INFO, ERROR, DEBUG)

### Error Handling
- **API Errors**: HTTP 500 with error messages
- **Gemini Errors**: Fallback to error line in script
- **JSON Parse Errors**: Graceful degradation with error messages
- **Frontend Errors**: User-friendly alerts

### Testing
- **Smoke Test**: `TEST.sh` script verifies core functionality
- **Manual Testing**: 
  - Python: `python -c "from planner import agent; ..."`
  - Next.js: `npm run build`
- **Future**: Unit tests, integration tests, E2E tests

## 6. Known Limitations

### Current Limitations

1. **No Persistence**
   - Scene state lost on server restart
   - No user sessions or multi-user support
   - **Mitigation**: Stateless design allows horizontal scaling

2. **Mock TTS**
   - Audio generation not implemented
   - Placeholder URLs returned
   - **Future**: ElevenLabs API integration

3. **Gemini API Rate Limits**
   - No rate limiting or retry logic
   - Could fail under high load
   - **Future**: Implement exponential backoff, rate limiting

4. **Context Window**
   - Only last 5 lines sent to Gemini
   - Long scenes may lose earlier context
   - **Future**: Implement sliding window or summarization

5. **Error Recovery**
   - Limited error recovery mechanisms
   - JSON parsing failures return error lines
   - **Future**: Retry logic, better error messages

6. **Concurrent Requests**
   - No handling of concurrent turn requests
   - Could cause state conflicts
   - **Future**: Request queuing or optimistic locking

7. **Security**
   - CORS allows all origins (development only)
   - No authentication/authorization
   - **Future**: JWT tokens, user authentication

### Performance Considerations

- **Async Operations**: TTS and API calls use async/await
- **Frontend**: React optimizations (useState, useEffect)
- **Backend**: FastAPI async endpoints
- **Bottlenecks**: 
  - Gemini API latency (~1-2 seconds)
  - TTS generation (when implemented)

### Scalability Path

1. **Short-term**: Add database for scene persistence
2. **Medium-term**: Implement user sessions, multi-scene support
3. **Long-term**: Real-time collaboration, version control, export features

## 7. Design Choices Rationale

### Why Dual Backend?
- **Flexibility**: Can use either Next.js API routes or FastAPI
- **Development**: Easier to test and develop separately
- **Production**: Can choose based on deployment needs

### Why Beat-Based Organization?
- **Clarity**: Clear scene progression tracking
- **UI**: Easy to group and display lines
- **Future**: Enables scene editing, beat-level operations

### Why UUID for IDs?
- **Uniqueness**: Prevents collisions in concurrent scenarios
- **Consistency**: Matches Python's `uuid.uuid4()` approach
- **Traceability**: Easier to track and reference specific lines

### Why Async/Await?
- **Performance**: Non-blocking operations
- **Scalability**: Better resource utilization
- **User Experience**: Responsive UI during API calls
