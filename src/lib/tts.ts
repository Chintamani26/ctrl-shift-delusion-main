/**
 * Browser-based Text-to-Speech using Web Speech API
 * No API keys required - works entirely in the browser
 */

export interface VoiceConfig {
  voiceId?: string;
  language: string;
  pitch?: number;
  rate?: number;
  volume?: number;
  voicePreference?: string[]; // Preferred voice names for character-specific voices
}

// Map of language codes to Web Speech API voices
const languageToVoiceMap: Record<string, string[]> = {
  'en-US': ['en-US', 'en-GB'],
  'ja-JP': ['ja-JP'],
  'es-ES': ['es-ES', 'es-MX'],
  'fr-FR': ['fr-FR'],
  'de-DE': ['de-DE'],
  'zh-CN': ['zh-CN'],
  'ko-KR': ['ko-KR'],
};

export function speakText(
  text: string,
  config: VoiceConfig,
  onEnd?: () => void
): void {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser');
    if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set language
  utterance.lang = config.language;

  // Set voice properties
  utterance.pitch = config.pitch || 1.0;
  utterance.rate = config.rate || 0.9;
  utterance.volume = config.volume || 1.0;

  // Function to set voice and speak
  const speakWithVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      console.warn('No voices available, using default');
      window.speechSynthesis.speak(utterance);
      return;
    }

    // Try to find a voice matching preferences (character-specific or language-based)
    let voice: SpeechSynthesisVoice | null = null;
    
    // First, try character-specific voice preferences if provided
    if (config.voicePreference && config.voicePreference.length > 0) {
      // Try to find voices matching the preferred language codes
      const preferredVoices = config.voicePreference;
      const matchingVoices = voices.filter(v => 
        preferredVoices.some(lang => v.lang.startsWith(lang))
      );
      
      if (matchingVoices.length > 0) {
        // If pitch is lower (deeper voice), prefer male voices; if higher, prefer female
        // This is a heuristic - actual voice gender varies by browser
        if (config.pitch && config.pitch < 1.0) {
          // Lower pitch - try to find deeper voices (often male)
          voice = matchingVoices.find(v => v.name.toLowerCase().includes('male') || 
                                          v.name.toLowerCase().includes('david') ||
                                          v.name.toLowerCase().includes('mark')) 
                 || matchingVoices[0];
        } else if (config.pitch && config.pitch > 1.0) {
          // Higher pitch - try to find higher voices (often female)
          voice = matchingVoices.find(v => v.name.toLowerCase().includes('female') || 
                                          v.name.toLowerCase().includes('zira') ||
                                          v.name.toLowerCase().includes('samantha')) 
                 || matchingVoices[0];
        } else {
          voice = matchingVoices[0];
        }
      }
    }
    
    // Fallback to language-based selection
    if (!voice) {
      const languageVoices = languageToVoiceMap[config.language] || [config.language];
      const langMatchingVoices = voices.filter(v => 
        languageVoices.some(lang => v.lang.startsWith(lang))
      );
      
      if (langMatchingVoices.length > 0) {
        voice = langMatchingVoices[0];
      } else {
        voice = voices.find(v => v.lang.startsWith(config.language)) || voices[0];
      }
    }

    if (voice) {
      utterance.voice = voice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Handle completion
  if (onEnd) {
    utterance.onend = () => {
      onEnd();
    };
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      onEnd();
    };
  } else {
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
    };
  }

  // Get voices (may need to wait for them to load)
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    speakWithVoice();
  } else {
    // Wait for voices to load (Chrome loads them asynchronously)
    window.speechSynthesis.onvoiceschanged = () => {
      speakWithVoice();
      window.speechSynthesis.onvoiceschanged = null; // Remove listener
    };
    // Fallback: speak anyway after short delay
    setTimeout(() => {
      if (window.speechSynthesis.getVoices().length === 0) {
        speakWithVoice();
      }
    }, 100);
  }
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  if (!('speechSynthesis' in window)) {
    return false;
  }
  return window.speechSynthesis.speaking || window.speechSynthesis.pending;
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

// Load voices when they become available
if (typeof window !== 'undefined') {
  if ('speechSynthesis' in window) {
    // Chrome loads voices asynchronously
    window.speechSynthesis.onvoiceschanged = () => {
      // Voices loaded
    };
  }
}

