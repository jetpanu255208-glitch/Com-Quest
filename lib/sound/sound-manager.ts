'use client';

/**
 * Sound Manager for Com Quest
 * Handles MP3 sound effects (SFX), Web Audio API procedural arcade synthesizers,
 * volume settings, and mute toggles.
 * Persists settings in localStorage and dispatches change events.
 */

const STORAGE_KEY_VOLUME = 'com_quest_sfx_volume';
const STORAGE_KEY_MUTED = 'com_quest_sfx_muted';

const DEFAULT_VOLUME = 0.7; // 70% default volume
const DEFAULT_MUTED = false;

// Audio file paths (served from /public/sounds/)
export const SOUND_PATHS = {
  clear: '/sounds/Clear.mp3',
  over: '/sounds/Over.mp3',
  hit: '/sounds/EXhit.mp3',
  hurt: '/sounds/Undertelhit.mp3',
  explosion: '/sounds/explosion.mp3',
  pop: '/sounds/POP.mp3',
  marioJump: '/sounds/Mariojump.mp3',
  marioCorrect: '/sounds/Mariotuk.mp3',
  marioLose: '/sounds/MarioLose.mp3',
  marioWin: '/sounds/Mariowin.mp3',
} as const;

export type SoundEffectType = keyof typeof SOUND_PATHS;

// In-memory cache for audio elements to minimize latency
const audioCache: Partial<Record<SoundEffectType, HTMLAudioElement>> = {};
let activeAudio: HTMLAudioElement | null = null;
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Get current volume (0.0 to 1.0) from localStorage
 */
export function getSoundVolume(): number {
  if (typeof window === 'undefined') return DEFAULT_VOLUME;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_VOLUME);
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        return parsed;
      }
    }
  } catch {
    // localStorage may be disabled
  }
  return DEFAULT_VOLUME;
}

/**
 * Check if sound effects are muted
 */
export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') return DEFAULT_MUTED;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MUTED);
    if (saved !== null) {
      return saved === 'true';
    }
  } catch {
    // localStorage may be disabled
  }
  return DEFAULT_MUTED;
}

/**
 * Save new volume level (0.0 to 1.0) and notify listeners
 */
export function setSoundVolume(volume: number): void {
  if (typeof window === 'undefined') return;
  const clamped = Math.max(0, Math.min(1, volume));
  try {
    localStorage.setItem(STORAGE_KEY_VOLUME, clamped.toString());
  } catch {}

  if (activeAudio) {
    activeAudio.volume = isSoundMuted() ? 0 : clamped;
  }

  notifySoundSettingsChange();
}

/**
 * Toggle or set mute state and notify listeners
 */
export function setSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_MUTED, muted ? 'true' : 'false');
  } catch {}

  if (activeAudio) {
    const vol = getSoundVolume();
    activeAudio.volume = muted ? 0 : vol;
  }

  notifySoundSettingsChange();
}

/**
 * Dispatch an event so React components or tabs update their UI
 */
function notifySoundSettingsChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('com_quest_sfx_change', {
      detail: {
        volume: getSoundVolume(),
        muted: isSoundMuted(),
      },
    })
  );
}

/**
 * Stop any currently playing sound effect
 */
export function stopAllSounds(): void {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {}
    activeAudio = null;
  }
}

/**
 * Preload sound effects into memory to eliminate latency
 */
export function preloadSounds(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const key of Object.keys(SOUND_PATHS) as SoundEffectType[]) {
      if (!audioCache[key]) {
        const audio = new Audio(SOUND_PATHS[key]);
        audio.preload = 'auto';
        audioCache[key] = audio;
      }
    }
  } catch {}
}

/**
 * Play a sound effect by type ('clear' | 'over' | 'hit' | 'hurt' | 'explosion')
 */
export function playSound(type: SoundEffectType, stopOthers: boolean = false): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;

  const muted = isSoundMuted();
  const volume = getSoundVolume();

  if (muted || volume <= 0) {
    return null;
  }

  try {
    if (stopOthers) {
      stopAllSounds();
    }

    let audio = audioCache[type];
    if (!audio) {
      audio = new Audio(SOUND_PATHS[type]);
      audio.preload = 'auto';
      audioCache[type] = audio;
    }

    try {
      audio.currentTime = 0;
    } catch {}
    audio.volume = volume;
    activeAudio = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn(`[SFX] Autoplay or playback error for ${type}:`, err);
      });
    }

    return audio;
  } catch (err) {
    console.warn(`[SFX] Failed to initialize audio for ${type}:`, err);
    return null;
  }
}

/**
 * Convenience helper to play the Quest Clear sound
 */
export function playClearSound(): HTMLAudioElement | null {
  return playSound('clear', true);
}

/**
 * Convenience helper to play the Game Over sound
 */
export function playOverSound(): HTMLAudioElement | null {
  return playSound('over', true);
}

/**
 * Play hit sound (EXhit.mp3) when player correctly attacks boss
 */
export function playHitSound(): HTMLAudioElement | null {
  return playSound('hit', false);
}

/**
 * Play hurt sound (Undertelhit.mp3) when player misses and gets struck by boss
 */
export function playHurtSound(): HTMLAudioElement | null {
  return playSound('hurt', false);
}

/**
 * Play boss explosion sound (explosion.mp3) when boss HP drops or is defeated
 */
export function playExplosionSound(): HTMLAudioElement | null {
  return playSound('explosion', false);
}

/**
 * Play Mario jump sound (Mariojump.mp3) on jump
 */
export function playMarioJumpSound(): HTMLAudioElement | null {
  return playSound('marioJump', false);
}

/**
 * Play Mario correct answer sound (Mariotuk.mp3) on correct answer
 */
export function playMarioCorrectSound(): HTMLAudioElement | null {
  return playSound('marioCorrect', false);
}

/**
 * Play Mario game over sound (MarioLose.mp3) when player loses all hearts
 */
export function playMarioLoseSound(): HTMLAudioElement | null {
  return playSound('marioLose', true);
}

/**
 * Play Mario stage/game win sound (Mariowin.mp3) when player clears stage
 */
export function playMarioWinSound(): HTMLAudioElement | null {
  return playSound('marioWin', true);
}

// In-memory audio pool for ultra-responsive polyphonic pop effects on block snapping/dropping
let popAudioPool: HTMLAudioElement[] = [];
let popPoolIndex = 0;

/**
 * Play tactile pop sound effect (POP.mp3) when dragging and dropping/snapping blocks
 */
export function playPopSound(): void {
  if (typeof window === 'undefined' || isSoundMuted()) return;
  const volume = getSoundVolume();
  if (volume <= 0) return;
  try {
    if (popAudioPool.length === 0) {
      for (let i = 0; i < 6; i++) {
        const a = new Audio(SOUND_PATHS.pop);
        a.preload = 'auto';
        popAudioPool.push(a);
      }
    }
    const audio = popAudioPool[popPoolIndex % popAudioPool.length];
    popPoolIndex++;
    audio.currentTime = 0;
    audio.volume = Math.min(1, volume * 1.0);
    const p = audio.play();
    if (p !== undefined) {
      p.catch(() => {});
    }
  } catch {
    // Fallback if blocked
  }
}

// ============================================================================
// PROCEDURAL WEB AUDIO API ARCADE SOUND SYNTHESIZERS
// Zero latency, zero network failure, respects user volume & mute settings
// ============================================================================

/**
 * Crisp UI / Option selection blip
 */
export function playSelectSound(): void {
  if (typeof window === 'undefined' || isSoundMuted()) return;
  const vol = getSoundVolume();
  if (vol <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(860, now + 0.055);

    const level = Math.min(0.22, vol * 0.22);
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  } catch {}
}

/**
 * Cyber energy charge sound when rushing toward boss
 */
export function playChargeSound(): void {
  if (typeof window === 'undefined' || isSoundMuted()) return;
  const vol = getSoundVolume();
  if (vol <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.22);

    const level = Math.min(0.18, vol * 0.18);
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(level, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch {}
}

/**
 * Ascending combo streak chime (pitches up with higher combo streak)
 */
export function playComboSound(streak: number = 1): void {
  if (typeof window === 'undefined' || isSoundMuted()) return;
  const vol = getSoundVolume();
  if (vol <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const baseFreq = 440 * Math.pow(1.08, Math.min(streak, 10));
    const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
    const level = Math.min(0.2, vol * 0.2);

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const start = now + idx * 0.055;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(level, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.13);
    });
  } catch {}
}

/**
 * Countdown timer tick (urgent beep when <= 5 seconds left)
 */
export function playTickSound(isCritical: boolean = false): void {
  if (typeof window === 'undefined' || isSoundMuted()) return;
  const vol = getSoundVolume();
  if (vol <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isCritical ? 'square' : 'sine';
    osc.frequency.setValueAtTime(isCritical ? 980 : 660, now);
    osc.frequency.exponentialRampToValueAtTime(isCritical ? 740 : 520, now + 0.06);

    const level = Math.min(0.16, vol * (isCritical ? 0.18 : 0.1));
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  } catch {}
}

/**
 * Triumphant 4-note level-up arpeggio when passing a coding mission
 */
export function playMissionClearSound(): void {
  if (typeof window === 'undefined' || isSoundMuted()) return;
  const vol = getSoundVolume();
  if (vol <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const level = Math.min(0.22, vol * 0.22);

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const start = now + i * 0.075;
      const duration = i === notes.length - 1 ? 0.35 : 0.12;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(level, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    });
  } catch {}
}

/**
 * Retro 8-bit laser shot sound for PC Shooting minigame
 */
export function playLaserShootSound(): void {
  if (typeof window === 'undefined' || isSoundMuted()) return;
  const vol = getSoundVolume();
  if (vol <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.09);

    const level = Math.min(0.18, vol * 0.18);
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
  } catch {}
}

/**
 * Explosive missile / heavy bullet blast sound
 */
export function playHeavyLaserSound(): void {
  if (typeof window === 'undefined' || isSoundMuted()) return;
  const vol = getSoundVolume();
  if (vol <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Low rumble oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.28);

    const level = Math.min(0.25, vol * 0.25);
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.29);
  } catch {}
}

/**
 * Cyber Base Shield activation hum
 */
export function playShieldSound(): void {
  if (typeof window === 'undefined' || isSoundMuted()) return;
  const vol = getSoundVolume();
  if (vol <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    [520, 780, 1040].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.15, now + 0.35);

      const level = Math.min(0.12, vol * 0.12);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(level, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.42);
    });
  } catch {}
}

/**
 * Boss entry alarm horn
 */
export function playBossAlertSound(): void {
  if (typeof window === 'undefined' || isSoundMuted()) return;
  const vol = getSoundVolume();
  if (vol <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    [0, 0.18, 0.36].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(idx % 2 === 0 ? 320 : 440, now + offset);

      const level = Math.min(0.2, vol * 0.2);
      gain.gain.setValueAtTime(level, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.15);
    });
  } catch {}
}
