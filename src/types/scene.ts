export type ActorRole = 'protagonist' | 'antagonist' | 'supporting';

export type LanguageCode = 'en-US' | 'ja-JP' | 'es-ES' | 'fr-FR' | 'de-DE' | 'zh-CN' | 'ko-KR';

export interface Actor {
  id: string;
  name: string;
  role: ActorRole;
  language: LanguageCode;
  voiceId: string;
  style: string;
}

export interface Line {
  id: string;
  actorId: string;
  text: string;
  timestamp: number;
  beatIndex: number;
  audioUrl?: string;
}

export interface SceneState {
  title: string;
  genre: string;
  setting: string;
  actors: Actor[];
  lines: Line[];
  currentBeat: number;
}

