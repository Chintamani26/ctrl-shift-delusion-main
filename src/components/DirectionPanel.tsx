import { useState } from 'react';
import { SceneState } from '../types/scene';
import { Send } from 'lucide-react';

interface DirectionPanelProps {
  sceneState: SceneState | null;
  onDirect: (command: string) => void;
  isProcessing?: boolean;
}

export default function DirectionPanel({ sceneState, onDirect, isProcessing = false }: DirectionPanelProps) {
  const [command, setCommand] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() && !isProcessing) {
      onDirect(command.trim());
      setCommand('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 border-r border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-gray-100">Director's Panel</h2>
        <p className="text-sm text-gray-400 mt-1">Guide the scene with your instructions</p>
      </div>
      
      <div className="flex-1 p-4">
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder={
              sceneState 
                ? "Enter your direction (e.g., 'Alex confronts Morgan about the secret')"
                : "Start a new scene (e.g., 'A tense negotiation in a coffee shop')"
            }
            className="flex-1 w-full bg-gray-800 text-gray-100 placeholder-gray-500 rounded-lg p-4 border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
            disabled={isProcessing}
          />
          
          <button
            type="submit"
            disabled={!command.trim() || isProcessing}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send size={18} />
                Direct
              </>
            )}
          </button>
        </form>
      </div>

      {sceneState && (
        <div className="p-4 border-t border-gray-800 bg-gray-800/50">
          <div className="text-xs text-gray-400 space-y-1">
            <div><span className="text-gray-500">Scene:</span> {sceneState.title}</div>
            <div><span className="text-gray-500">Genre:</span> {sceneState.genre}</div>
            <div><span className="text-gray-500">Setting:</span> {sceneState.setting}</div>
            <div><span className="text-gray-500">Beat:</span> {sceneState.currentBeat}</div>
          </div>
        </div>
      )}
    </div>
  );
}

