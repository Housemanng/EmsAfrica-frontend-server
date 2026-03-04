/**
 * Plays a short notification sound when a new message arrives.
 * Uses Web Audio API — no external audio files required.
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioContext) return audioContext;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  audioContext = new Ctx();
  return audioContext;
}

/**
 * Play a subtle notification tone (short "ding").
 * Fails silently if the browser blocks autoplay or Web Audio is unavailable.
 */
export function playMessageNotificationSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume if suspended (browsers often start AudioContext suspended until user interaction)
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.08);
    oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.16);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  } catch {
    // Silently ignore — autoplay may be blocked or Web Audio unavailable
  }
}
