import { useCallback, useEffect, useState } from 'react';

const GUEST_MODE_KEY = 'guest-mode';
const GUEST_WORDS_COUNT_KEY = 'guest-words-count';
const GUEST_LIMIT = 100;

export function useGuestProgress() {
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [wordsCount, setWordsCount] = useState(0);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  // Initialize guest mode state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const guestMode = localStorage.getItem(GUEST_MODE_KEY) === 'true';
    const count = parseInt(localStorage.getItem(GUEST_WORDS_COUNT_KEY) || '0', 10);
    
    setIsGuestMode(guestMode);
    setWordsCount(count);
  }, []);

  // Track word progress
  const trackWordProgress = useCallback((count: number = 1) => {
    if (!isGuestMode) return;
    
    const newCount = wordsCount + count;
    setWordsCount(newCount);
    localStorage.setItem(GUEST_WORDS_COUNT_KEY, newCount.toString());

    // Show signup prompt when reaching limit
    if (newCount >= GUEST_LIMIT) {
      setShowSignupPrompt(true);
    }
  }, [isGuestMode, wordsCount]);

  // Exit guest mode
  const exitGuestMode = useCallback(() => {
    localStorage.removeItem(GUEST_MODE_KEY);
    localStorage.removeItem(GUEST_WORDS_COUNT_KEY);
    setIsGuestMode(false);
    setWordsCount(0);
    setShowSignupPrompt(false);
  }, []);

  const canContinue = !isGuestMode || wordsCount < GUEST_LIMIT;
  const remainingWords = Math.max(0, GUEST_LIMIT - wordsCount);
  const progressPercent = (wordsCount / GUEST_LIMIT) * 100;

  return {
    isGuestMode,
    wordsCount,
    canContinue,
    remainingWords,
    progressPercent,
    showSignupPrompt,
    trackWordProgress,
    exitGuestMode,
    setShowSignupPrompt,
  };
}
