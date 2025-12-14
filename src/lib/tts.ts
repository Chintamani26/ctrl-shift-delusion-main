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

    const preferredVoices = languageToVoiceMap[config.language] || [config.language];
    
    const voice = voices.find(v => 
      preferredVoices.some(lang => v.lang.startsWith(lang))
    ) || voices.find(v => v.lang.startsWith(config.language)) || voices[0];

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

