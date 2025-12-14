import type { NextApiRequest, NextApiResponse } from 'next';
import { SceneState, Line } from '../../../types/scene';

interface TurnRequest {
  sceneState: SceneState | null;
  userCommand: string;
}

interface TurnResponse {
  updatedScene: SceneState;
  newLines: Line[];
}

// Backend API URL - defaults to localhost:8000 for development
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TurnResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sceneState, userCommand }: TurnRequest = req.body;

    if (!userCommand || typeof userCommand !== 'string') {
      return res.status(400).json({ error: 'userCommand is required' });
    }

    // Forward request to Python FastAPI backend
    console.log(`[API Route] Forwarding to backend: ${BACKEND_URL}/api/scene/turn`);
    console.log(`[API Route] User command: "${userCommand}"`);
    
    const backendResponse = await fetch(`${BACKEND_URL}/api/scene/turn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sceneState,
        userCommand,
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`[API Route] Backend error: ${backendResponse.status} - ${errorText}`);
      throw new Error(`Backend error: ${backendResponse.status} - ${errorText}`);
    }

    const backendData = await backendResponse.json();
    
    // Backend returns { sceneState: ... }, but frontend expects { updatedScene, newLines }
    // Extract new lines by comparing with previous state
    const previousLines = sceneState?.lines || [];
    const updatedLines = backendData.sceneState?.lines || [];
    const newLines = updatedLines.slice(previousLines.length);

    // Format response for frontend
    const response: TurnResponse = {
      updatedScene: backendData.sceneState,
      newLines: newLines,
    };

    console.log(`[API Route] Successfully processed turn. Generated ${newLines.length} new lines.`);
    
    res.status(200).json(response);
  } catch (error) {
    console.error('[API Route] Error processing turn:', error);
    
    // If backend is not available, provide helpful error message
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('ECONNREFUSED'))) {
      console.error('[API Route] Backend connection failed:', error);
      res.status(503).json({ 
        error: 'Backend server is not running. Please start the Python backend with: python run_backend.py',
        details: 'Make sure the backend is running on http://localhost:8000'
      });
    } else {
      console.error('[API Route] Error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  }
}

