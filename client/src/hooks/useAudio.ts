import { useCallback } from 'react';

type LanguageCode = 'ko-KR' | 'zh-CN' | 'ja-JP';

export function useAudio() {
  const speak = useCallback((text: string, language: LanguageCode = 'ko-KR') => {
    // Check if Web Speech API is available
    const SpeechSynthesisUtterance = window.SpeechSynthesisUtterance;
    const speechSynthesis = window.speechSynthesis;

    if (!SpeechSynthesisUtterance || !speechSynthesis) {
      console.warn('Web Speech API not supported in this browser');
      return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    // Speak
    speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const isSupported = useCallback(() => {
    return !!(window.SpeechSynthesisUtterance && window.speechSynthesis);
  }, []);

  return { speak, stop, isSupported };
}
