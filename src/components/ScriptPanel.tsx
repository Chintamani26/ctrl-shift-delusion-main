import { useEffect, useRef, useState } from 'react';
import { SceneState, Line } from '../types/scene';
import { Clock, Volume2, Play, Square, VolumeX } from 'lucide-react';
import { speakText, stopSpeaking, isSpeaking } from '../lib/tts';
import { getCharacterVoiceProfile } from '../lib/voiceProfiles';

interface ScriptPanelProps {
  sceneState: SceneState | null;
  latestLineId?: string;
}

export default function ScriptPanel({ sceneState, latestLineId }: ScriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [playingLineId, setPlayingLineId] = useState<string | null>(null);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState<boolean>(true);
  const [lastPlayedLineIndex, setLastPlayedLineIndex] = useState<number>(-1);
  const isPlayingQueueRef = useRef<boolean>(false);

  useEffect(() => {
    // Auto-scroll to bottom when new lines are added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sceneState?.lines.length, latestLineId]);

  // Cleanup: stop speaking when component unmounts
  useEffect(() => {
    return () => {
      stopSpeaking();
      isPlayingQueueRef.current = false;
    };
  }, []);

  // Auto-play functionality: play lines sequentially when new lines are added
  useEffect(() => {
    if (!sceneState || !autoPlayEnabled || isPlayingQueueRef.current) {
      return;
    }

    const lines = sceneState.lines;
    if (lines.length === 0) {
      return;
    }

    // Find the next unplayed line (after lastPlayedLineIndex)
    const nextLineIndex = lastPlayedLineIndex + 1;
    
    if (nextLineIndex < lines.length) {
      // Start playing from the next unplayed line
      // Use a small delay to ensure state is updated
      const timeoutId = setTimeout(() => {
        playLinesSequentially(lines, nextLineIndex);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneState?.lines.length, autoPlayEnabled]);

  const playLinesSequentially = async (lines: Line[], startIndex: number) => {
    if (isPlayingQueueRef.current || !sceneState) {
      return; // Already playing or no scene state
    }

    isPlayingQueueRef.current = true;

    for (let i = startIndex; i < lines.length; i++) {
      // Check if auto-play was disabled during playback
      if (!autoPlayEnabled) {
        isPlayingQueueRef.current = false;
        return;
      }

      // Re-check sceneState in case it changed
      if (!sceneState) {
        isPlayingQueueRef.current = false;
        return;
      }

      const line = lines[i];
      
      // Get current last played index (may have changed)
      const currentLastIndex = lastPlayedLineIndex;
      if (i <= currentLastIndex) {
        continue; // Already played
      }

      // Skip action lines (optional - you can remove this if you want to play actions too)
      if (line.text.startsWith('[ACTION]')) {
        setLastPlayedLineIndex(i);
        continue;
      }

      const actor = sceneState.actors.find(a => a.id === line.actorId);
      const textToSpeak = line.text;

      if (!textToSpeak.trim()) {
        setLastPlayedLineIndex(i);
        continue;
      }

      // Set current playing line
      setPlayingLineId(line.id);

      // Get character-specific voice profile
      const voiceProfile = getCharacterVoiceProfile(actor || null);
      
      // Play this line with character-specific voice
      await new Promise<void>((resolve) => {
        speakText(textToSpeak, {
          language: actor?.language || 'en-US',
          pitch: voiceProfile.pitch,
          rate: voiceProfile.rate,
          volume: voiceProfile.volume,
          voicePreference: voiceProfile.voicePreference,
        }, () => {
          // On end callback
          setPlayingLineId(null);
          setLastPlayedLineIndex(i);
          resolve();
        });
      });

      // Small delay between lines for natural flow (300ms pause)
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    isPlayingQueueRef.current = false;
  };

  const handlePlayAudio = (line: Line) => {
    // Check if this line is currently playing
    const isCurrentlyPlaying = playingLineId === line.id;
    
    if (isCurrentlyPlaying) {
      // Stop if already playing
      stopSpeaking();
      setPlayingLineId(null);
      isPlayingQueueRef.current = false;
      return;
    }

    // Stop any current speech and auto-play queue
    stopSpeaking();
    setPlayingLineId(null);
    isPlayingQueueRef.current = false;
    
    const actor = sceneState?.actors.find(a => a.id === line.actorId);
    const textToSpeak = line.text.startsWith('[ACTION]') 
      ? line.text.replace('[ACTION]', '').trim()
      : line.text;

    if (!textToSpeak.trim()) {
      return; // Don't speak empty text
    }

    // Find the index of this line
    const lineIndex = sceneState?.lines.findIndex(l => l.id === line.id) ?? -1;
    
    // If auto-play is enabled and this line is after the last played, continue from here
    if (lineIndex >= 0 && autoPlayEnabled && lineIndex > lastPlayedLineIndex) {
      // Stop current playback
      stopSpeaking();
      isPlayingQueueRef.current = false;
      // Set to one before this line so it plays this and continues
      setLastPlayedLineIndex(lineIndex - 1);
      // Trigger sequential play from this line
      if (sceneState) {
        playLinesSequentially(sceneState.lines, lineIndex);
      }
    } else {
      // Manual play (auto-play disabled or line already played)
      // Get character-specific voice profile
      const voiceProfile = getCharacterVoiceProfile(actor || null);
      
      speakText(textToSpeak, {
        language: actor?.language || 'en-US',
        pitch: voiceProfile.pitch,
        rate: voiceProfile.rate,
        volume: voiceProfile.volume,
        voicePreference: voiceProfile.voicePreference,
      }, () => {
        // On end callback - clear playing state
        setPlayingLineId(null);
      });

      setPlayingLineId(line.id);
    }
  };

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

  const handleToggleAutoPlay = () => {
    if (autoPlayEnabled) {
      // Stop current playback
      stopSpeaking();
      setPlayingLineId(null);
      isPlayingQueueRef.current = false;
    }
    setAutoPlayEnabled(!autoPlayEnabled);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-100">Script</h2>
            <p className="text-sm text-gray-400 mt-1">{sceneState.lines.length} lines across {Object.keys(linesByBeat).length} beats</p>
          </div>
          <button
            onClick={handleToggleAutoPlay}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              autoPlayEnabled
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title={autoPlayEnabled ? 'Disable auto-play' : 'Enable auto-play'}
          >
            {autoPlayEnabled ? (
              <>
                <Volume2 size={14} />
                Auto-Play ON
              </>
            ) : (
              <>
                <VolumeX size={14} />
                Auto-Play OFF
              </>
            )}
          </button>
        </div>
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

                  <div className="mt-3 flex items-center gap-3">
                    {/* Play button for browser TTS */}
                    <button
                      onClick={() => handlePlayAudio(line)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                      title={playingLineId === line.id ? 'Stop playback' : 'Play audio'}
                    >
                      {playingLineId === line.id ? (
                        <>
                          <Square size={12} />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play size={12} />
                          Play
                        </>
                      )}
                    </button>

                    {/* Show audio URL if available (from backend) */}
                    {line.audioUrl && (
                      <div className="flex items-center gap-2">
                        <Volume2 size={14} className="text-gray-400" />
                        <a
                          href={line.audioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 underline"
                        >
                          Download audio
                        </a>
                      </div>
                    )}
                  </div>
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

