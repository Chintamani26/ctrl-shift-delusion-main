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
        updated_state = await agent.process_turn(request.sceneState, request.userCommand)
        return {"sceneState": updated_state}
    except Exception as e:
        print(f"Error in turn: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Run on port 8000 to avoid conflict with Next.js (3000)
    uvicorn.run(app, host="0.0.0.0", port=8000)