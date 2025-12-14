from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from planner import agent

app = FastAPI(title="ManchAI Backend")

# Allow CORS so localhost:3000 (Next.js) can talk to localhost:8000 (Python)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models (Mirroring your TypeScript types) ---
class TurnRequest(BaseModel):
    sceneState: Optional[Dict[str, Any]] = None
    userCommand: str

# --- Routes ---

@app.get("/")
def read_root():
    return {"status": "ManchAI Director is Online"}

@app.post("/api/scene/turn")
async def director_turn(request: TurnRequest):
    """
    Main endpoint called by the frontend.
    Passes the state and command to the Agent Planner.
    """
    try:
        print(f"[Backend] Received command: '{request.userCommand}'")
        print(f"[Backend] Scene state: {'exists' if request.sceneState else 'null (new scene)'}")
        
        updated_state = await agent.process_turn(request.sceneState, request.userCommand)
        
        # Extract new lines for frontend
        previous_lines = request.sceneState.get('lines', []) if request.sceneState else []
        new_lines = updated_state.get('lines', [])[len(previous_lines):]
        
        print(f"[Backend] Generated {len(new_lines)} new lines")
        
        return {
            "sceneState": updated_state,
            "newLines": new_lines  # Also return new lines for frontend convenience
        }
    except Exception as e:
        print(f"[Backend] Error in turn: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Run on port 8000 to avoid conflict with Next.js (3000)
    uvicorn.run(app, host="0.0.0.0", port=8000)