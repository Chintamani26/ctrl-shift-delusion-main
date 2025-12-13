import { useState, useEffect } from 'react';
import Head from 'next/head';
import { SceneState } from '../types/scene';
import DirectionPanel from '../components/DirectionPanel';
import ScriptPanel from '../components/ScriptPanel';
import CastPanel from '../components/CastPanel';
import { Loader2 } from 'lucide-react'; // Optional: install lucide-react or remove this icon

export default function Home() {
  const [sceneState, setSceneState] = useState<SceneState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [latestLineId, setLatestLineId] = useState<string | undefined>();

  // Function to send commands to the AI Director
  const handleTurn = async (userCommand: string) => {
    setIsProcessing(true);
    setLatestLineId(undefined);
    try {
      const response = await fetch('/api/scene/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneState, // Send current state (or null if starting)
          userCommand,
        }),
      });

      if (!response.ok) throw new Error('Director went on strike (API Error)');

      const data = await response.json();
      setSceneState(data.updatedScene);
      
      // Highlight the latest line
      if (data.newLines && data.newLines.length > 0) {
        setLatestLineId(data.newLines[data.newLines.length - 1].id);
      }
    } catch (error) {
      console.error(error);
      alert('Error connecting to the studio. Check console.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-start: Initialize the scene when the page first loads
  useEffect(() => {
    if (!sceneState) {
      handleTurn('Start the scene with a dramatic entrance.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden font-sans">
      <Head>
        <title>ManchAI Studio</title>
      </Head>

      {/* Header */}
      <header className="h-14 border-b border-gray-800 flex items-center px-6 bg-gray-900/50 backdrop-blur">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          ManchAI <span className="text-xs text-gray-500 font-mono tracking-widest">| DIRECTOR MODE</span>
        </h1>
        {isProcessing && (
          <div className="ml-4 flex items-center text-xs text-yellow-400 animate-pulse">
            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            Generating Script...
          </div>
        )}
      </header>

      {/* Main Studio Layout */}
      <main className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        
        {/* LEFT: Direction Panel (Input) - Takes 3 columns */}
        <div className="col-span-3 border-r border-gray-800 bg-gray-900/30">
          <DirectionPanel 
            sceneState={sceneState}
            onDirect={handleTurn} 
            isProcessing={isProcessing} 
          />
        </div>

        {/* CENTER: Script Panel (Display) - Takes 6 columns */}
        <div className="col-span-6 bg-black relative shadow-2xl">
          <ScriptPanel 
            sceneState={sceneState}
            latestLineId={latestLineId}
          />
        </div>

        {/* RIGHT: Cast Panel (Info) - Takes 3 columns */}
        <div className="col-span-3 border-l border-gray-800 bg-gray-900/30">
          <CastPanel sceneState={sceneState} />
        </div>

      </main>
    </div>
  );
}