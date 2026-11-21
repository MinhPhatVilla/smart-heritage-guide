import * as Speech from 'expo-speech';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../types/heritage';

export type SpeechPlayState = 'idle' | 'playing' | 'paused';

export const SPEECH_RATES = [0.75, 1.0, 1.25, 1.5] as const;
export type SpeechRate = (typeof SPEECH_RATES)[number];

export interface SpeechCallbacks {
  onSegmentChange?: (index: number) => void;
  /** Alias tương thích với phiên bản web */
  onParagraphChange?: (index: number) => void;
  onStateChange?: (state: SpeechPlayState) => void;
  onEnd?: () => void;
  /** Alias tương thích với phiên bản web */
  onComplete?: () => void;
  onError?: (errorMessage: string) => void;
}

class MultiLingualSpeechService {
  private fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private currentSegments: string[] = [];
  private currentIndex = 0;
  private currentLang: SupportedLanguage = 'vi';
  private currentRate = 1.0;
  private state: SpeechPlayState = 'idle';
  private callbacks: SpeechCallbacks = {};
  private playbackId = 0;
  private cachedVoices: Speech.Voice[] | null = null;

  private clearFallbackTimer(): void {
    if (this.fallbackTimer !== null) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }

  private getBcp47(lang: SupportedLanguage): string {
    return SUPPORTED_LANGUAGES.find((item) => item.code === lang)?.bcp47 ?? 'vi-VN';
  }

  private notifySegmentChange(index: number): void {
    this.callbacks.onSegmentChange?.(index);
    this.callbacks.onParagraphChange?.(index);
  }

  private notifyStateChange(nextState: SpeechPlayState): void {
    this.state = nextState;
    this.callbacks.onStateChange?.(nextState);
  }

  private notifyEnd(): void {
    this.callbacks.onEnd?.();
    this.callbacks.onComplete?.();
  }

  public async getAvailableVoices(): Promise<Speech.Voice[]> {
    if (this.cachedVoices && this.cachedVoices.length > 0) {
      return this.cachedVoices;
    }
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      if (Array.isArray(voices) && voices.length > 0) {
        this.cachedVoices = voices;
      }
      return Array.isArray(voices) ? voices : [];
    } catch {
      return [];
    }
  }

  private async selectBestVoiceIdentifier(bcp47: string): Promise<string | undefined> {
    const voices = await this.getAvailableVoices();
    if (!voices.length) return undefined;

    const normalized = bcp47.toLowerCase();
    const exact = voices.find((v) => (v.language || '').toLowerCase() === normalized);
    if (exact?.identifier) return exact.identifier;

    const prefix = normalized.split('-')[0];
    const partial = voices.find((v) => (v.language || '').toLowerCase().startsWith(prefix));
    return partial?.identifier;
  }

  public speakScript(
    segments: string[],
    lang: SupportedLanguage,
    rate = 1.0,
    startIndex = 0,
    callbacks: SpeechCallbacks = {}
  ): void {
    this.stopInternal(false);
    if (!segments.length) {
      this.currentSegments = [];
      this.currentIndex = 0;
      this.notifyStateChange('idle');
      return;
    }

    this.currentSegments = [...segments];
    this.currentLang = lang;
    this.currentRate = this.clampRate(rate);
    this.currentIndex = Math.max(0, Math.min(startIndex, segments.length - 1));
    this.callbacks = callbacks;

    this.notifyStateChange('playing');
    void this.speakCurrentSegment();
  }

  private clampRate(rate: number): number {
    if (!Number.isFinite(rate)) return 1.0;
    return Math.max(0.5, Math.min(2.0, rate));
  }

  private async speakCurrentSegment(): Promise<void> {
    this.clearFallbackTimer();

    if (this.currentIndex >= this.currentSegments.length) {
      this.notifyStateChange('idle');
      this.notifyEnd();
      return;
    }

    const token = ++this.playbackId;
    const text = this.currentSegments[this.currentIndex];
    const bcp47 = this.getBcp47(this.currentLang);

    this.notifySegmentChange(this.currentIndex);

    try {
      await Speech.stop();
    } catch {
      // Bỏ qua lỗi stop trên một số trình duyệt/thiết bị khi chưa phát
    }

    if (token !== this.playbackId || this.state !== 'playing') {
      return;
    }

    const voice = await this.selectBestVoiceIdentifier(bcp47);
    if (token !== this.playbackId || this.state !== 'playing') {
      return;
    }

    let settled = false;
    const advanceToNext = () => {
      if (settled || token !== this.playbackId || this.state !== 'playing') {
        return;
      }
      settled = true;
      this.currentIndex += 1;
      void this.speakCurrentSegment();
    };

    try {
      Speech.speak(text, {
        language: bcp47,
        rate: this.currentRate,
        pitch: 1.0,
        ...(voice ? { voice } : {}),
        onDone: () => {
          advanceToNext();
        },
        onStopped: () => {
          // Bỏ qua: được xử lý chủ động qua pause()/stop()/chuyển câu
        },
        onError: (err) => {
          if (settled || token !== this.playbackId || this.state !== 'playing') {
            return;
          }
          settled = true;
          const detail =
            err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
              ? err.message
              : 'Thiết bị chưa hỗ trợ giọng đọc cho ngôn ngữ này, chuyển sang chạy phụ đề tự động.';
          this.callbacks.onError?.(detail);
          this.runSimulatedReading(text, token);
        },
      });
    } catch (err) {
      const detail =
        err instanceof Error
          ? err.message
          : 'Không thể khởi chạy bộ đọc giọng nói, đang chạy phụ đề tự động.';
      this.callbacks.onError?.(detail);
      this.runSimulatedReading(text, token);
    }
  }

  private runSimulatedReading(text: string, token: number): void {
    this.clearFallbackTimer();
    const durationMs = Math.max(2500, Math.round((text.length * 55) / this.currentRate));
    this.fallbackTimer = setTimeout(() => {
      if (token !== this.playbackId || this.state !== 'playing') {
        return;
      }
      this.currentIndex += 1;
      void this.speakCurrentSegment();
    }, durationMs);
  }

  /**
   * Tạm dừng phát tại chỉ mục câu hiện tại.
   * Sử dụng dừng & lưu chỉ mục câu để đảm bảo hoạt động đồng nhất trên iOS, Android và Expo Web.
   */
  public pause(): void {
    if (this.state !== 'playing') return;
    this.playbackId += 1;
    this.clearFallbackTimer();
    void Speech.stop().catch(() => {});
    this.notifyStateChange('paused');
  }

  /** Tiếp tục phát từ câu đang tạm dừng */
  public resume(): void {
    if (this.state !== 'paused') return;
    if (!this.currentSegments.length) {
      this.notifyStateChange('idle');
      return;
    }
    this.notifyStateChange('playing');
    void this.speakCurrentSegment();
  }

  /** Chuyển tới câu tiếp theo */
  public nextSegment(): number {
    if (!this.currentSegments.length) return 0;
    const nextIdx = Math.min(this.currentSegments.length - 1, this.currentIndex + 1);
    return this.jumpToSegment(nextIdx, this.state === 'playing');
  }

  /** Quay về câu trước đó */
  public prevSegment(): number {
    if (!this.currentSegments.length) return 0;
    const prevIdx = Math.max(0, this.currentIndex - 1);
    return this.jumpToSegment(prevIdx, this.state === 'playing');
  }

  /** Nhảy tới một câu cụ thể */
  public jumpToSegment(index: number, autoPlay = true): number {
    if (!this.currentSegments.length) return 0;
    const clamped = Math.max(0, Math.min(this.currentSegments.length - 1, index));
    this.currentIndex = clamped;
    this.notifySegmentChange(clamped);

    if (autoPlay) {
      this.notifyStateChange('playing');
      void this.speakCurrentSegment();
    } else if (this.state === 'playing') {
      this.pause();
    }
    return clamped;
  }

  /** Đổi tốc độ đọc (0.75x, 1.0x, 1.25x, 1.5x) */
  public setRate(rate: SpeechRate | number): void {
    this.currentRate = this.clampRate(rate);
    if (this.state === 'playing' && this.currentSegments.length > 0) {
      void this.speakCurrentSegment();
    }
  }

  /** Đổi ngôn ngữ đọc và tùy chọn cập nhật mảng câu thoại theo ngôn ngữ mới */
  public setLanguage(lang: SupportedLanguage, updatedSegments?: string[]): void {
    this.currentLang = lang;
    if (updatedSegments && updatedSegments.length > 0) {
      this.currentSegments = [...updatedSegments];
      this.currentIndex = Math.min(this.currentIndex, updatedSegments.length - 1);
    }
    if (this.state === 'playing' && this.currentSegments.length > 0) {
      void this.speakCurrentSegment();
    }
  }

  private stopInternal(emitState: boolean): void {
    this.playbackId += 1;
    this.clearFallbackTimer();
    this.state = 'idle';
    void Speech.stop().catch(() => {});
    if (emitState) {
      this.callbacks.onStateChange?.('idle');
    }
  }

  public stop(): void {
    this.stopInternal(true);
  }

  public async isSpeaking(): Promise<boolean> {
    try {
      const nativeSpeaking = await Speech.isSpeakingAsync();
      return nativeSpeaking || this.state === 'playing';
    } catch {
      return this.state === 'playing';
    }
  }

  public getState(): SpeechPlayState {
    return this.state;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public getRate(): number {
    return this.currentRate;
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLang;
  }
}

export const speechService = new MultiLingualSpeechService();
