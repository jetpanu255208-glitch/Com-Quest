'use client';

/**
 * Sound Manager for Com Quest
 * Handles sound effects (SFX), volume settings, and mute toggles.
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
} as const;

export type SoundEffectType = keyof typeof SOUND_PATHS;

// In-memory cache for audio elements to minimize latency
const audioCache: Partial<Record<SoundEffectType, HTMLAudioElement>> = {};
let activeAudio: HTMLAudioElement | null = null;

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

  // Update any active playing audio volume immediately
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

  // Update active audio
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
 * Play a sound effect by type ('clear' | 'over')
 */
export function playSound(type: SoundEffectType): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;

  const muted = isSoundMuted();
  const volume = getSoundVolume();

  // If muted or volume is 0, we can skip playing or play silently
  if (muted || volume <= 0) {
    return null;
  }

  try {
    stopAllSounds();

    // Create or reuse audio element
    const path = SOUND_PATHS[type];
    const audio = new Audio(path);
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
  return playSound('clear');
}

/**
 * Convenience helper to play the Game Over sound
 */
export function playOverSound(): HTMLAudioElement | null {
  return playSound('over');
}
