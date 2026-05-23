import { createContext, useContext, useCallback, useRef, useState, useEffect, type ReactNode } from "react";

/* ─── Web Audio API Synthesized Sounds ─── */
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

/** Short bright "cling" — ascending, 0.15s */
function playClingUp(volume: number) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

/** Short soft "cling" — descending, 0.15s */
function playClingDown(volume: number) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(660, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(volume * 0.8, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

/** Tiny tap — very short click, 0.06s */
function playTap(volume: number) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  gain.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.06);
}

/** Soft pop — for toggling, 0.1s */
function playPop(volume: number) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.05);
  osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(volume * 0.6, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

/** Whoosh — for navigation/transition, 0.2s */
function playWhoosh(volume: number) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const bufferSize = ctx.sampleRate * 0.2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.setValueAtTime(2000, ctx.currentTime);
  bandpass.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.2);
  bandpass.Q.value = 2;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  source.connect(bandpass).connect(gain).connect(ctx.destination);
  source.start(ctx.currentTime);
}

/** Play the session-complete mp3 jingle — capped at 5 seconds */
function playVictoryJingle(volume: number) {
  try {
    const audio = new Audio("/manus-storage/session-complete_972bd950.mp3");
    audio.volume = volume * 0.55;
    audio.play().catch(() => {});
    // Fade out and stop after 5 seconds
    setTimeout(() => {
      const fadeOut = setInterval(() => {
        if (audio.volume > 0.05) {
          audio.volume = Math.max(0, audio.volume - 0.05);
        } else {
          audio.pause();
          clearInterval(fadeOut);
        }
      }, 50);
    }, 4500);
  } catch {
    // ignore
  }
}

/* ─── Context ─── */
interface SoundContextValue {
  muted: boolean;
  toggleMute: () => void;
  play: {
    swipeRight: () => void;
    swipeLeft: () => void;
    tap: () => void;
    pop: () => void;
    whoosh: () => void;
    victory: () => void;
  };
}

const SoundContext = createContext<SoundContextValue | null>(null);

const MUTE_KEY = "korean-mastery-muted";

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const mutedRef = useRef(muted);
  useEffect(() => {
    mutedRef.current = muted;
    try { localStorage.setItem(MUTE_KEY, String(muted)); } catch {}
  }, [muted]);

  const toggleMute = useCallback(() => setMuted(m => !m), []);

  const volume = 0.5;

  const play = {
    swipeRight: useCallback(() => { if (!mutedRef.current) playClingUp(volume); }, []),
    swipeLeft: useCallback(() => { if (!mutedRef.current) playClingDown(volume); }, []),
    tap: useCallback(() => { if (!mutedRef.current) playTap(volume); }, []),
    pop: useCallback(() => { if (!mutedRef.current) playPop(volume); }, []),
    whoosh: useCallback(() => { if (!mutedRef.current) playWhoosh(volume); }, []),
    victory: useCallback(() => { if (!mutedRef.current) playVictoryJingle(volume); }, []),
  };

  return (
    <SoundContext.Provider value={{ muted, toggleMute, play }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    // Fallback: return no-op sounds if outside provider
    return {
      muted: false,
      toggleMute: () => {},
      play: {
        swipeRight: () => {},
        swipeLeft: () => {},
        tap: () => {},
        pop: () => {},
        whoosh: () => {},
        victory: () => {},
      },
    };
  }
  return ctx;
}
