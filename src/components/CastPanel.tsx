import React from 'react';
import { SceneState, ActorRole } from '../types/scene';
import { Mic, Globe } from 'lucide-react';

interface CastPanelProps {
  sceneState: SceneState | null;
}

const roleColors: Record<ActorRole, string> = {
  protagonist: 'bg-green-600',
  antagonist: 'bg-red-600',
  supporting: 'bg-blue-600'
};

const roleLabels: Record<ActorRole, string> = {
  protagonist: 'Protagonist',
  antagonist: 'Antagonist',
  supporting: 'Supporting'
};

export default function CastPanel({ sceneState }: CastPanelProps) {
  if (!sceneState || sceneState.actors.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 border-l border-gray-800">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">No cast members</p>
          <p className="text-sm">Actors will appear when scene starts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-gray-100">Cast</h2>
        <p className="text-sm text-gray-400 mt-1">{sceneState.actors.length} actor{sceneState.actors.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sceneState.actors.map((actor) => (
          <div
            key={actor.id}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-12 h-12 rounded-full ${roleColors[actor.role]} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                {actor.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-100 truncate">
                  {actor.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded ${roleColors[actor.role]} text-white font-medium`}>
                    {roleLabels[actor.role]}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Globe size={14} />
                <span>{actor.language}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-400">
                <Mic size={14} />
                <span className="font-mono text-xs">{actor.voiceId}</span>
              </div>

              {actor.style && (
                <div className="pt-2 border-t border-gray-700">
                  <p className="text-gray-300 italic text-xs">
                    "{actor.style}"
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

