import type { NextApiRequest, NextApiResponse } from 'next';
import { SceneState, Line } from '../../../types/scene';
import { generateSceneLines } from '../../../lib/geminiDirector';
import { generateAudioUrl } from '../../../lib/mockTTS';

interface TurnRequest {
  sceneState: SceneState | null;
  userCommand: string;
}

interface TurnResponse {
  updatedScene: SceneState;
  newLines: Line[];
}

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

    // Generate new scene lines using Gemini Director
    const { updatedScene, newLines } = await generateSceneLines(sceneState, userCommand);

    // Generate audio URLs for each new line (simulate async processing)
    const linesWithAudio = await Promise.all(
      newLines.map(async (line) => {
        const actor = updatedScene.actors.find(a => a.id === line.actorId);
        if (!actor) return line;

        const audioUrl = await generateAudioUrl(line.text, actor.voiceId);
        return {
          ...line,
          audioUrl
        };
      })
    );

    // Update the scene with audio URLs
    const finalScene: SceneState = {
      ...updatedScene,
      lines: updatedScene.lines.map((line, index) => {
        const newLineIndex = newLines.findIndex(nl => nl.id === line.id);
        if (newLineIndex >= 0) {
          return linesWithAudio[newLineIndex];
        }
        return line;
      })
    };

    res.status(200).json({
      updatedScene: finalScene,
      newLines: linesWithAudio
    });
  } catch (error) {
    console.error('Error processing turn:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

