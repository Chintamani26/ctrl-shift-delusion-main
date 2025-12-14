import { SceneState, Line, Actor } from '../types/scene';

// TODO: Initialize GoogleGenerativeAI client here
// import { GoogleGenerativeAI } from '@google/generative-ai';
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateSceneLines(
  currentScene: SceneState | null,
  userCommand: string
): Promise<{ updatedScene: SceneState; newLines: Line[] }> {
  // If no scene exists, create a new one with default actors
  if (!currentScene) {
    const defaultActors: Actor[] = [
      {
        id: 'actor-1',
        name: 'Alex',
        role: 'protagonist',
        language: 'en-US',
        voiceId: 'voice-1',
        style: 'confident, determined'
      },
      {
        id: 'actor-2',
        name: 'Morgan',
        role: 'supporting',
        language: 'en-US',
        voiceId: 'voice-2',
        style: 'calm, analytical'
      }
    ];

    const newScene: SceneState = {
      title: 'Untitled Scene',
      genre: 'Drama',
      setting: 'A mysterious location',
      actors: defaultActors,
      lines: [],
      currentBeat: 0
    };

    // Generate initial lines based on user command
    const initialLines = await generateLinesFromPrompt(newScene, userCommand || 'Start the scene');
    
    newScene.lines = initialLines;
    newScene.currentBeat = 1;

    return {
      updatedScene: newScene,
      newLines: initialLines
    };
  }

  // Existing scene: generate new lines based on user command
  const newLines = await generateLinesFromPrompt(currentScene, userCommand);
  
  const updatedScene: SceneState = {
    ...currentScene,
    lines: [...currentScene.lines, ...newLines],
    currentBeat: currentScene.currentBeat + 1
  };

  return {
    updatedScene,
    newLines
  };
}

async function generateLinesFromPrompt(
  scene: SceneState,
  userCommand: string
): Promise<Line[]> {
  // TODO: Replace with actual Gemini API call
  // const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  // const prompt = constructPrompt(scene, userCommand);
  // const result = await model.generateContent(prompt);
  // const response = await result.response;
  // const text = response.text();
  // return parseGeminiResponse(text, scene);

  // Mock implementation for now
  return mockGenerateLines(scene, userCommand);
}

function constructPrompt(scene: SceneState, userCommand: string): string {
  const actorsInfo = scene.actors.map(a => `${a.name} (${a.role}, ${a.style})`).join(', ');
  const recentLines = scene.lines.slice(-5).map(l => {
    const actor = scene.actors.find(a => a.id === l.actorId);
    return `${actor?.name || 'Unknown'}: ${l.text}`;
  }).join('\n');

  return `You are a film director writing a ${scene.genre} scene.

Scene Context:
- Title: ${scene.title}
- Setting: ${scene.setting}
- Current Beat: ${scene.currentBeat}
- Actors: ${actorsInfo}

Recent Dialogue:
${recentLines || '(Scene just started)'}

Director's Instruction: ${userCommand}

Generate 1-2 lines of dialogue or action that advance the scene. Format each line as:
[ACTOR_NAME]: [dialogue text]
or
[ACTION]: [action description]

Return only the lines, one per line.`;
}

function parseGeminiResponse(responseText: string, scene: SceneState): Line[] {
  // This would parse the Gemini response and convert it to Line objects
  // For now, return mock data
  return mockGenerateLines(scene, '');
}

function mockGenerateLines(scene: SceneState, userCommand: string): Line[] {
  const lines: Line[] = [];
  const timestamp = Date.now();
  
  // Generate 1-2 lines based on available actors
  const numLines = Math.min(2, scene.actors.length);
  
  for (let i = 0; i < numLines; i++) {
    const actor = scene.actors[i % scene.actors.length];
    // Use crypto.randomUUID() for globally unique IDs (matches Python's uuid.uuid4())
    const lineId = `line-${crypto.randomUUID()}`;
    
    let text = '';
    if (userCommand.toLowerCase().includes('action') || userCommand.toLowerCase().includes('move')) {
      text = `[ACTION] ${actor.name} ${userCommand.toLowerCase().includes('move') ? 'moves closer' : 'takes a deep breath'}`;
    } else {
      const responses = [
        `What do you think about ${userCommand || 'this situation'}?`,
        `I understand. Let's proceed carefully.`,
        `That's an interesting perspective.`,
        `We need to act now.`
      ];
      text = responses[Math.floor(Math.random() * responses.length)];
    }

    lines.push({
      id: lineId,
      actorId: actor.id,
      text,
      timestamp: timestamp + i * 1000,
      beatIndex: scene.currentBeat + 1
    });
  }

  return lines;
}

