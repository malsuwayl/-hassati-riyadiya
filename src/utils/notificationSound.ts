/**
 * Sound & Notification Utility for School Period Alerts & Bells
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesizes a pleasant metallic school bell / chime ring using Web Audio API
 */
export function playSchoolBellSound(type: 'start' | 'end' | 'pre' = 'start') {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (type === 'pre') {
      // Gentle double chime (E5 -> A5)
      const frequencies = [659.25, 880];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.25);

        gain.gain.setValueAtTime(0.3, now + idx * 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.25 + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.25);
        osc.stop(now + idx * 0.25 + 0.8);
      });
    } else if (type === 'start') {
      // Traditional 3-step School Bell Chime (C5 -> E5 -> G5 -> C6)
      const chimeNotes = [523.25, 659.25, 783.99, 1046.5];
      chimeNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.2);

        gain.gain.setValueAtTime(0.4, now + idx * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.2 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.2);
        osc.stop(now + idx * 0.2 + 1.2);
      });
    } else {
      // End of Class Bell (Dismissal Gong: C6 -> G5 -> E5 -> C5)
      const chimeNotes = [1046.5, 783.99, 659.25, 523.25];
      chimeNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.22);

        gain.gain.setValueAtTime(0.4, now + idx * 0.22);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.22 + 1.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.22);
        osc.stop(now + idx * 0.22 + 1.4);
      });
    }
  } catch (e) {
    console.warn('Audio Context exception or blocked by browser policy:', e);
  }
}

/**
 * Text to Speech Arabic Voice Announcement
 */
export function speakArabicAnnouncement(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Try to find an Arabic voice if available
    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find((v) => v.lang.startsWith('ar'));
    if (arVoice) {
      utterance.voice = arVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech Synthesis error:', e);
  }
}

/**
 * Check & Request Browser Notification Permission
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch {
    return 'denied';
  }
}

/**
 * Sends a Browser Native Notification popup
 */
export function sendBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.ico',
        dir: 'rtl',
        lang: 'ar',
      });
      // Auto close after 8 seconds
      setTimeout(() => notif.close(), 8000);
    } catch (e) {
      console.warn('Failed to dispatch browser notification:', e);
    }
  }
}

/**
 * Unified Alert Trigger
 */
export function triggerFullPeriodAlert(
  title: string,
  message: string,
  alertType: 'start' | 'end' | 'pre',
  options: {
    enableSound?: boolean;
    enableTTS?: boolean;
    enableBrowser?: boolean;
  } = {}
) {
  const { enableSound = true, enableTTS = true, enableBrowser = true } = options;

  // 1. Play School Bell Sound
  if (enableSound) {
    playSchoolBellSound(alertType);
  }

  // 2. Speak Arabic Announcement
  if (enableTTS) {
    speakArabicAnnouncement(`${title}. ${message}`);
  }

  // 3. Send Browser System Notification
  if (enableBrowser) {
    sendBrowserNotification(title, message);
  }

  // 4. Mobile Haptic Vibration
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200, 100, 300]);
    } catch {
      // ignore
    }
  }
}
