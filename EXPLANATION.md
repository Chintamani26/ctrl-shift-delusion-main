# Technical Explanation

## 1. Agent Workflow

### Step-by-Step Processing Flow

1. **Receive User Input**
   - User types a director command in the DirectionPanel (e.g., "Alex confronts Morgan about the secret")
   - Frontend captures the command and current scene state

2. **API Request**
   - Frontend sends POST request to `/api/scene/turn`
   - Payload: `{ sceneState: SceneState | null, userCommand: string }`
   - If `sceneState` is null, backend initializes a new scene

3. **Planning Phase (Director Agent)**
   - `DirectorAgent.process_turn()` orchestrates the workflow
   - Determines if scene needs initialization
   - Prepares context for Gemini API call

4. **Tool Execution (Gemini Director)**
   - `DirectorTools.generate_dialogue()` constructs a context-aware prompt:
     - Scene setting and genre
     - List of actors with their roles and styles
     - Last 5 lines of dialogue (for context)
     - User's director command
   - Calls Google Gemini API (`gemini-1.5-flash` model)
   - Parses JSON response to extract new dialogue lines

5. **Action Phase (TTS Generation)**
   - For each new line, `generate_tts_audio()` is called
   - Currently mocked (returns placeholder URL)
   - Future: Will integrate with ElevenLabs API

6. **State Update**
   - New lines are assigned unique UUIDs
   - Beat index assigned: `beatIndex = currentBeat + 1`
   - Lines added to scene
   - `currentBeat` incremented

7. **Response & Rendering**
   - Updated scene and new lines returned to frontend
   - React state updated
   - UI re-renders with new content
   - ScriptPanel auto-scrolls to latest line

## 2. Key Modules

### Planner (`src/planner.py`)
- **Purpose**: Orchestrates the director turn workflow
- **Key Functions**:
  - `process_turn()`: Main orchestration method
  - Scene initialization with default actors
  - Coordinates dialogue generation and TTS
  - Manages beat tracking

### Tools (`src/tools.py`)
- **Purpose**: Interface with external services (Gemini, TTS)
- **Key Functions**:
  - `generate_dialogue()`: Calls Gemini API with context
  - `generate_tts_audio()`: Mock TTS implementation (async)
- **Gemini Integration**:
  - Uses `google.generativeai` library
  - Model: `gemini-1.5-flash`
  - Prompt engineering for structured JSON output
  - Error handling with fallback responses

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

### Google Gemini API
- **Tool**: `google.generativeai.GenerativeModel`
- **Model**: `gemini-1.5-flash`
- **Usage**:
  ```python
  model = genai.GenerativeModel('gemini-1.5-flash')
  response = model.generate_content(prompt)
  ```
- **Prompt Structure**:
  - Context: Setting, characters, recent dialogue
  - Instruction: User's director command
  - Output Format: JSON with `newLines` array
- **Response Parsing**:
  - Removes markdown code blocks (```json)
  - Parses JSON to extract dialogue lines
  - Handles errors with fallback responses

### Text-to-Speech (Mock)
- **Current**: Mock implementation with `asyncio.sleep()`
- **Future**: ElevenLabs API integration
- **Function**: `generate_tts_audio(text, voiceId)`
- **Returns**: Audio URL (currently placeholder)

## 4. Memory & State Management

### Scene State
- **Storage**: In-memory (passed between requests)
- **Structure**: `SceneState` type with actors, lines, beats
- **Persistence**: None (stateless API design)
- **Future**: Could add database (PostgreSQL, MongoDB) or Redis cache

### Context Window Management
- **Recent Lines**: Only last 5 lines sent to Gemini (token efficiency)
- **Actor List**: Full actor list included in each prompt
- **Scene Metadata**: Title, genre, setting included for context

### Beat Tracking
- **Purpose**: Organize script by beats (scene progression units)
- **Implementation**: Consistent across TypeScript and Python
- **Logic**: `beatIndex = currentBeat + 1`, then increment `currentBeat`

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
