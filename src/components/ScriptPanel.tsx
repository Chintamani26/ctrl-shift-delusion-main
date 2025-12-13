import { useEffect, useRef } from 'react';
import { SceneState, Line } from '../types/scene';
import { Clock, Volume2 } from 'lucide-react';

interface ScriptPanelProps {
  sceneState: SceneState | null;
  latestLineId?: string;
}

export default function ScriptPanel({ sceneState, latestLineId }: ScriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new lines are added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sceneState?.lines.length, latestLineId]);

  if (!sceneState) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">No scene active</p>
          <p className="text-sm">Start directing from the left panel</p>
        </div>
      </div>
    );
  }

  // Group lines by beat
  const linesByBeat = sceneState.lines.reduce((acc, line) => {
    if (!acc[line.beatIndex]) {
      acc[line.beatIndex] = [];
    }
    acc[line.beatIndex].push(line);
    return acc;
  }, {} as Record<number, Line[]>);

  const getActorName = (actorId: string) => {
    return sceneState.actors.find(a => a.id === actorId)?.name || 'Unknown';
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-gray-100">Script</h2>
        <p className="text-sm text-gray-400 mt-1">{sceneState.lines.length} lines across {Object.keys(linesByBeat).length} beats</p>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6"
      >
        {Object.entries(linesByBeat).map(([beatIndex, lines]) => (
          <div key={beatIndex} className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {beatIndex}
              </div>
              <div className="h-px flex-1 bg-gray-700" />
            </div>

            {lines.map((line) => {
              const actor = sceneState.actors.find(a => a.id === line.actorId);
              const isLatest = line.id === latestLineId;
              const isAction = line.text.startsWith('[ACTION]');

              return (
                <div
                  key={line.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isLatest
                      ? 'bg-blue-900/30 border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'bg-gray-800/50 border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isAction ? (
                        <span className="text-purple-400 font-semibold text-sm">ACTION</span>
                      ) : (
                        <span className="text-blue-400 font-semibold">
                          {getActorName(line.actorId)}
                        </span>
                      )}
                      {actor && (
                        <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-700 rounded">
                          {actor.role}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={12} />
                      {formatTimestamp(line.timestamp)}
                    </div>
                  </div>

                  <p className="text-gray-100 leading-relaxed">
                    {isAction ? line.text.replace('[ACTION]', '').trim() : line.text}
                  </p>

                  {line.audioUrl && (
                    <div className="mt-3 flex items-center gap-2">
                      <Volume2 size={14} className="text-gray-400" />
                      <a
                        href={line.audioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        Audio available
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {sceneState.lines.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg mb-2">Script is empty</p>
            <p className="text-sm">Start directing to generate dialogue</p>
          </div>
        )}
      </div>
    </div>
  );
}

