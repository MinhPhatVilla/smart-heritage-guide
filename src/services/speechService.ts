import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../types/heritage';

export interface SpeechCallbacks {
  onParagraphChange?: (index: number) => void;
  onStateChange?: (state: 'idle' | 'playing' | 'paused') => void;
  onComplete?: () => void;
}

class MultiLingualSpeechService {
  private synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : null;
  private fallbackTimer: ReturnType<typeof setInterval> | null = null;
  private currentParagraphs: string[] = [];
  private currentIndex = 0;
  private currentLang: SupportedLanguage = 'vi';
  private currentRate = 1.0;
  private state: 'idle' | 'playing' | 'paused' = 'idle';
  private callbacks: SpeechCallbacks = {};

  private clearFallbackTimer() {
    if (this.fallbackTimer) {
      clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }

  private getBcp47(lang: SupportedLanguage): string {
    return SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.bcp47 || 'vi-VN';
  }

  private selectBestVoice(bcp47: string): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    if (!voices.length) return null;

    const exact = voices.find((v) => v.lang.toLowerCase() === bcp47.toLowerCase());
    if (exact) return exact;

    const prefix = bcp47.split('-')[0].toLowerCase();
    const partial = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
    return partial || null;
  }

  public speakScript(
    paragraphs: string[],
    lang: SupportedLanguage,
    rate = 1.0,
    startIndex = 0,
    callbacks: SpeechCallbacks = {}
  ) {
    this.stop();
    if (!paragraphs.length) return;

    this.currentParagraphs = paragraphs;
    this.currentLang = lang;
    this.currentRate = rate;
    this.currentIndex = Math.max(0, Math.min(startIndex, paragraphs.length - 1));
    this.callbacks = callbacks;

    this.state = 'playing';
    this.callbacks.onStateChange?.('playing');
    this.speakCurrentParagraph();
  }

  private speakCurrentParagraph() {
    this.clearFallbackTimer();
    if (this.currentIndex >= this.currentParagraphs.length) {
      this.state = 'idle';
      this.callbacks.onStateChange?.('idle');
      this.callbacks.onComplete?.();
      return;
    }

    this.callbacks.onParagraphChange?.(this.currentIndex);
    const text = this.currentParagraphs[this.currentIndex];
    const bcp47 = this.getBcp47(this.currentLang);

    if (this.synth) {
      try {
        this.synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = bcp47;
        utterance.rate = this.currentRate;

        const bestVoice = this.selectBestVoice(bcp47);
        if (bestVoice) {
          utterance.voice = bestVoice;
        }

        let finished = false;
        utterance.onend = () => {
          if (finished || this.state !== 'playing') return;
          finished = true;
          this.currentIndex += 1;
          this.speakCurrentParagraph();
        };

        utterance.onerror = () => {
          if (finished || this.state !== 'playing') return;
          finished = true;
          this.runSimulatedReading(text);
        };

        this.synth.speak(utterance);
        return;
      } catch {
        this.runSimulatedReading(text);
        return;
      }
    }

    this.runSimulatedReading(text);
  }

  private runSimulatedReading(text: string) {
    const durationMs = Math.max(2500, Math.round((text.length * 55) / this.currentRate));
    this.fallbackTimer = setTimeout(() => {
      if (this.state !== 'playing') return;
      this.currentIndex += 1;
      this.speakCurrentParagraph();
    }, durationMs);
  }

  public pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.clearFallbackTimer();
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
    this.callbacks.onStateChange?.('paused');
  }

  public resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.callbacks.onStateChange?.('playing');
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    } else {
      this.speakCurrentParagraph();
    }
  }

  public stop() {
    this.clearFallbackTimer();
    this.state = 'idle';
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // Ignore browser cancel errors
      }
    }
    this.callbacks.onStateChange?.('idle');
  }
}

export const speechService = new MultiLingualSpeechService();
