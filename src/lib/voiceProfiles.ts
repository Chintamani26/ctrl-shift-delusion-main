/**
 * Voice profiles for different characters
 * Each character has unique voice characteristics (pitch, rate, voice selection)
 */

import { Actor } from '../types/scene';

export interface CharacterVoiceProfile {
  pitch: number;      // 0.5 to 2.0 (lower = deeper, higher = higher)
  rate: number;       // 0.1 to 10.0 (slower to faster)
  volume: number;     // 0.0 to 1.0
  voicePreference?: string[]; // Preferred voice names (optional)
}

// Character voice profiles - unique voice settings for each character
const characterVoiceProfiles: Record<string, CharacterVoiceProfile> = {
  // Arjun (Protagonist) - Nervous, human, slightly higher pitch
  'hero': {
    pitch: 1.1,
    rate: 0.95,
    volume: 1.0,
    voicePreference: ['en-US', 'en-GB'] // Prefer male voices
  },
  'Arjun': {
    pitch: 1.1,
    rate: 0.95,
    volume: 1.0,
    voicePreference: ['en-US', 'en-GB']
  },
  
  // Nexus (AI/Supporting) - Robotic, mechanical, lower pitch, slower rate
  'ai': {
    pitch: 0.85,
    rate: 0.8,
    volume: 1.0,
    voicePreference: ['en-US', 'en-GB'] // Prefer deeper voices
  },
  'Nexus': {
    pitch: 0.85,
    rate: 0.8,
    volume: 1.0,
    voicePreference: ['en-US', 'en-GB']
  },
  
  // Default profiles for common character types
  'protagonist': {
    pitch: 1.05,
    rate: 0.9,
    volume: 1.0
  },
  'antagonist': {
    pitch: 0.9,
    rate: 0.85,
    volume: 1.0
  },
  'supporting': {
    pitch: 1.0,
    rate: 0.9,
    volume: 1.0
  }
};

/**
 * Get voice profile for a character
 * Falls back to role-based profile, then default
 */
export function getCharacterVoiceProfile(actor: Actor | null): CharacterVoiceProfile {
  if (!actor) {
    return { pitch: 1.0, rate: 0.9, volume: 1.0 };
  }

  // Try by ID first
  if (characterVoiceProfiles[actor.id]) {
    return characterVoiceProfiles[actor.id];
  }

  // Try by name
  if (characterVoiceProfiles[actor.name]) {
    return characterVoiceProfiles[actor.name];
  }

  // Try by role
  if (characterVoiceProfiles[actor.role]) {
    return characterVoiceProfiles[actor.role];
  }

  // Default profile
  return { pitch: 1.0, rate: 0.9, volume: 1.0 };
}

/**
 * Get voice profile by character ID or name
 */
export function getVoiceProfileById(id: string, name?: string, role?: string): CharacterVoiceProfile {
  // Try by ID
  if (characterVoiceProfiles[id]) {
    return characterVoiceProfiles[id];
  }

  // Try by name
  if (name && characterVoiceProfiles[name]) {
    return characterVoiceProfiles[name];
  }

  // Try by role
  if (role && characterVoiceProfiles[role]) {
    return characterVoiceProfiles[role];
  }

  // Default
  return { pitch: 1.0, rate: 0.9, volume: 1.0 };
}

