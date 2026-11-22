import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../types/heritage';
import { getApiBaseUrl, shouldTryBackendProxy } from './apiClient';
import {
  preprocessTextForSpeech,
  scoreSpeechVoice,
  type SpeechVoiceGender,
} from '../utils/speechTextUtils';

export { preprocessTextForSpeech, scoreSpeechVoice, type SpeechVoiceGender };
export type SpeechPlayState = 'idle' | 'playing' | 'paused';
export type SpeechEngineMode = 'neural' | 'device' | 'simulated';

export const SPEECH_RATES = [0.75, 1.0, 1.25, 1.5] as const;
export type SpeechRate = (typeof SPEECH_RATES)[number];

export interface VoiceGenderOption {
  id: SpeechVoiceGender;
  labelVi: string;
  shortLabel: string;
}

export const VOICE_GENDER_OPTIONS: VoiceGenderOption[] = [
  { id: 'female', labelVi: 'Nữ · Hoài My', shortLabel: 'Giọng Nữ' },
  { id: 'male', labelVi: 'Nam · Nam Minh', shortLabel: 'Giọng Nam' },
];

export interface SpeechCallbacks {
  onSegmentChange?: (index: number) => void;
  /** Alias tương thích với phiên bản web */
  onParagraphChange?: (index: number) => void;
  onStateChange?: (state: SpeechPlayState) => void;
  onEngineChange?: (engine: SpeechEngineMode, voiceLabel?: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  /** Tiến độ đọc thời gian thực trong đoạn hiện tại (0..1) kèm giây hiện tại & tổng giây ước tính */
  onProgress?: (
    segmentProgress: number,
    currentSeconds: number,
    durationSeconds: number
  ) => void;
  onEnd?: () => void;
  /** Alias tương thích với phiên bản web */
  onComplete?: () => void;
  onError?: (errorMessage: string) => void;
}

interface WebAudioLike {
  src: string;
  currentTime: number;
  duration: number;
  playbackRate: number;
  preservesPitch?: boolean;
  mozPreservesPitch?: boolean;
  webkitPreservesPitch?: boolean;
  ontimeupdate: (() => void) | null;
  onended: (() => void) | null;
  onerror: (() => void) | null;
  play: () => Promise<void>;
  pause: () => void;
}

class MultiLingualSpeechService {
  private fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private progressTimer: ReturnType<typeof setInterval> | null = null;
  private activeFetchAbort: AbortController | null = null;
  private currentSegments: string[] = [];
  private currentIndex = 0;
  private currentLang: SupportedLanguage = 'vi';
  private currentRate = 1.0;
  private voiceGender: SpeechVoiceGender = 'female';
  private activeEngine: SpeechEngineMode = 'neural';
  private state: SpeechPlayState = 'idle';
  private callbacks: SpeechCallbacks = {};
  private playbackId = 0;
  private cachedVoices: Speech.Voice[] | null = null;

  // Neural TTS playback handles (Web HTMLAudio + Native expo-audio)
  private webAudio: WebAudioLike | null = null;
  private nativePlayer: AudioPlayer | null = null;
  private nativeSubscription: { remove: () => void } | null = null;
  private webBlobCache = new Map<string, string>();
  private webBlobFetchInflight = new Map<string, Promise<string | null>>();
  private neuralDisabledUntil = 0;
  private audioModeConfigured = false;

  private clearFallbackTimer(): void {
    if (this.fallbackTimer !== null) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }

  private clearProgressTimer(): void {
    if (this.progressTimer !== null) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  private startEstimatedProgressTicker(
    spokenText: string,
    effectiveRate: number,
    token: number
  ): void {
    this.clearProgressTimer();
    const charsPerSecond =
      this.currentLang === 'zh' || this.currentLang === 'ja' ? 5.2 : 14.5;
    const estDurationSec = Math.max(
      2.4,
      spokenText.length / (charsPerSecond * Math.max(0.5, effectiveRate))
    );
    const startedAt = Date.now();
    this.callbacks.onProgress?.(0.02, 0, estDurationSec);

    this.progressTimer = setInterval(() => {
      if (token !== this.playbackId || this.state !== 'playing') {
        this.clearProgressTimer();
        return;
      }
      const elapsedSec = (Date.now() - startedAt) / 1000;
      const ratio = Math.min(0.97, elapsedSec / estDurationSec);
      this.callbacks.onProgress?.(ratio, Math.min(elapsedSec, estDurationSec), estDurationSec);
    }, 180);
  }

  private cleanupAudioPlayers(): void {
    this.clearProgressTimer();
    if (this.activeFetchAbort) {
      try {
        this.activeFetchAbort.abort();
      } catch {
        // Ignore
      }
      this.activeFetchAbort = null;
    }
    if (this.webAudio) {
      try {
        this.webAudio.ontimeupdate = null;
        this.webAudio.onended = null;
        this.webAudio.onerror = null;
        this.webAudio.pause();
        this.webAudio.src = '';
      } catch {
        // Bỏ qua lỗi cleanup trình duyệt
      }
      this.webAudio = null;
    }
    if (this.nativeSubscription) {
      try {
        this.nativeSubscription.remove();
      } catch {
        // Bỏ qua
      }
      this.nativeSubscription = null;
    }
    if (this.nativePlayer) {
      try {
        this.nativePlayer.pause();
        this.nativePlayer.remove();
      } catch {
        // Bỏ qua
      }
      this.nativePlayer = null;
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

  private notifyEngineChange(engine: SpeechEngineMode, voiceLabel?: string): void {
    this.activeEngine = engine;
    this.callbacks.onEngineChange?.(engine, voiceLabel);
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

  private async selectBestVoice(
    bcp47: string
  ): Promise<{ identifier?: string; name?: string }> {
    const voices = await this.getAvailableVoices();
    if (!voices.length) return {};

    let best: Speech.Voice | null = null;
    let bestScore = -1;
    for (const v of voices) {
      const sc = scoreSpeechVoice(v, bcp47, this.voiceGender);
      if (sc > bestScore) {
        bestScore = sc;
        best = v;
      }
    }
    if (!best || bestScore < 0) return {};
    return { identifier: best.identifier, name: best.name };
  }

  public speakScript(
    segments: string[],
    lang: SupportedLanguage,
    rate = 1.0,
    startIndex = 0,
    callbacks: SpeechCallbacks = {},
    voiceGender?: SpeechVoiceGender
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
    if (voiceGender) {
      this.voiceGender = voiceGender;
    }
    this.currentIndex = Math.max(0, Math.min(startIndex, segments.length - 1));
    this.callbacks = callbacks;

    this.notifyStateChange('playing');
    void this.speakCurrentSegment();
  }

  private clampRate(rate: number): number {
    if (!Number.isFinite(rate)) return 1.0;
    return Math.max(0.5, Math.min(2.0, rate));
  }

  private makeCacheKey(text: string, lang: SupportedLanguage, gender: SpeechVoiceGender): string {
    return `${lang}|${gender}|${text}`;
  }

  private buildGetTtsUrl(text: string, lang: SupportedLanguage, gender: SpeechVoiceGender): string {
    const params = new URLSearchParams({
      text,
      language: lang,
      voice_gender: gender,
    });
    return `${getApiBaseUrl()}/api/v1/ai/tts?${params.toString()}`;
  }

  private async fetchWebNeuralBlobUrl(
    text: string,
    lang: SupportedLanguage,
    gender: SpeechVoiceGender
  ): Promise<string | null> {
    if (!shouldTryBackendProxy() || Date.now() < this.neuralDisabledUntil) {
      return null;
    }
    const key = this.makeCacheKey(text, lang, gender);
    const cached = this.webBlobCache.get(key);
    if (cached) return cached;

    const inflight = this.webBlobFetchInflight.get(key);
    if (inflight) return inflight;

    const promise = (async (): Promise<string | null> => {
      const controller = new AbortController();
      this.activeFetchAbort = controller;
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/v1/ai/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            language: lang,
            voice_gender: gender,
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          if (res.status >= 500 || res.status === 404) {
            this.neuralDisabledUntil = Date.now() + 20_000;
          }
          return null;
        }
        const blob = await res.blob();
        if (!blob || blob.size < 256) return null;
        const urlCreator = (globalThis as unknown as { URL?: { createObjectURL?: (b: Blob) => string } }).URL;
        if (!urlCreator?.createObjectURL) return null;
        const blobUrl = urlCreator.createObjectURL(blob);
        this.webBlobCache.set(key, blobUrl);
        return blobUrl;
      } catch {
        if (!controller.signal.aborted) {
          // Backend offline -> tạm dừng thử Neural TTS 20s để tránh delay mỗi đoạn
          this.neuralDisabledUntil = Date.now() + 20_000;
        }
        return null;
      } finally {
        clearTimeout(timeoutId);
        if (this.activeFetchAbort === controller) {
          this.activeFetchAbort = null;
        }
        this.webBlobFetchInflight.delete(key);
      }
    })();

    this.webBlobFetchInflight.set(key, promise);
    return promise;
  }

  private prefetchNextWebSegment(nextIndex: number): void {
    if (Platform.OS !== 'web') return;
    if (nextIndex >= this.currentSegments.length) return;
    const nextText = preprocessTextForSpeech(
      this.currentSegments[nextIndex],
      this.currentLang
    );
    if (!nextText) return;
    void this.fetchWebNeuralBlobUrl(nextText, this.currentLang, this.voiceGender);
  }

  private async tryPlayNeuralAudio(
    normalizedText: string,
    token: number,
    onDone: () => void
  ): Promise<boolean> {
    if (!shouldTryBackendProxy() || Date.now() < this.neuralDisabledUntil) {
      return false;
    }

    const voiceLabel =
      this.currentLang === 'vi'
        ? this.voiceGender === 'female'
          ? 'AI · Hoài My'
          : 'AI · Nam Minh'
        : `AI Neural (${this.currentLang.toUpperCase()})`;

    // 1. Web: HTML5 Audio + Blob cache + Prefetch đoạn kế tiếp
    if (Platform.OS === 'web') {
      const AudioCtor = (globalThis as unknown as { Audio?: new (src?: string) => WebAudioLike }).Audio;
      if (!AudioCtor) return false;

      this.callbacks.onLoadingChange?.(true);
      const blobUrl = await this.fetchWebNeuralBlobUrl(
        normalizedText,
        this.currentLang,
        this.voiceGender
      );
      this.callbacks.onLoadingChange?.(false);

      if (!blobUrl || token !== this.playbackId || this.state !== 'playing') {
        return false;
      }

      return new Promise<boolean>((resolve) => {
        try {
          const audio = new AudioCtor(blobUrl);
          audio.playbackRate = this.currentRate;
          audio.preservesPitch = true;
          audio.mozPreservesPitch = true;
          audio.webkitPreservesPitch = true;
          this.webAudio = audio;

          let resolved = false;
          const emitWebProgress = () => {
            if (token !== this.playbackId || this.state !== 'playing') return;
            const dur = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
            const cur = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
            if (dur > 0) {
              this.callbacks.onProgress?.(Math.min(1, cur / dur), cur, dur);
            }
          };
          audio.ontimeupdate = emitWebProgress;
          audio.onended = () => {
            this.clearProgressTimer();
            if (token !== this.playbackId || this.state !== 'playing') return;
            const dur = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
            this.callbacks.onProgress?.(1, dur, dur);
            onDone();
          };
          audio.onerror = () => {
            this.clearProgressTimer();
            if (!resolved) {
              resolved = true;
              resolve(false);
            }
          };

          void audio
            .play()
            .then(() => {
              if (token !== this.playbackId || this.state !== 'playing') {
                audio.pause();
                if (!resolved) {
                  resolved = true;
                  resolve(true);
                }
                return;
              }
              this.notifyEngineChange('neural', voiceLabel);
              this.clearProgressTimer();
              this.progressTimer = setInterval(emitWebProgress, 150);
              this.prefetchNextWebSegment(this.currentIndex + 1);
              if (!resolved) {
                resolved = true;
                resolve(true);
              }
            })
            .catch(() => {
              if (!resolved) {
                resolved = true;
                resolve(false);
              }
            });
        } catch {
          resolve(false);
        }
      });
    }

    // 2. iOS / Android Native: expo-audio streaming từ Backend Neural TTS
    try {
      if (!this.audioModeConfigured) {
        await setAudioModeAsync({
          playsInSilentMode: true,
        }).catch(() => {});
        this.audioModeConfigured = true;
      }

      // Kiểm tra nhanh backend còn online với HEAD/GET nhẹ bằng URL trực tiếp
      const ttsUrl = this.buildGetTtsUrl(
        normalizedText.slice(0, 1400),
        this.currentLang,
        this.voiceGender
      );

      this.callbacks.onLoadingChange?.(true);
      const player = createAudioPlayer(
        { uri: ttsUrl },
        { updateInterval: 250, downloadFirst: true }
      );
      player.shouldCorrectPitch = true;
      player.setPlaybackRate(this.currentRate);
      this.nativePlayer = player;

      return await new Promise<boolean>((resolve) => {
        let started = false;
        let finished = false;
        const guardTimer = setTimeout(() => {
          if (!started && !finished) {
            finished = true;
            this.callbacks.onLoadingChange?.(false);
            this.cleanupAudioPlayers();
            this.neuralDisabledUntil = Date.now() + 20_000;
            resolve(false);
          }
        }, 7000);

        this.nativeSubscription = player.addListener(
          'playbackStatusUpdate',
          (status) => {
            if (token !== this.playbackId) return;

            if (status.error) {
              clearTimeout(guardTimer);
              this.callbacks.onLoadingChange?.(false);
              this.cleanupAudioPlayers();
              this.neuralDisabledUntil = Date.now() + 20_000;
              if (!started && !finished) {
                finished = true;
                resolve(false);
              }
              return;
            }

            if ((status.playing || status.isLoaded) && !started) {
              started = true;
              clearTimeout(guardTimer);
              this.callbacks.onLoadingChange?.(false);
              this.notifyEngineChange('neural', voiceLabel);
              resolve(true);
            }

            if (status.duration > 0) {
              this.callbacks.onProgress?.(
                Math.min(1, status.currentTime / status.duration),
                status.currentTime,
                status.duration
              );
            }

            if (status.didJustFinish && !finished) {
              finished = true;
              clearTimeout(guardTimer);
              this.callbacks.onProgress?.(1, status.duration || 0, status.duration || 0);
              onDone();
            }
          }
        );

        player.play();
      });
    } catch {
      this.callbacks.onLoadingChange?.(false);
      this.cleanupAudioPlayers();
      return false;
    }
  }

  private async speakCurrentSegment(): Promise<void> {
    this.clearFallbackTimer();
    this.cleanupAudioPlayers();

    if (this.currentIndex >= this.currentSegments.length) {
      this.notifyStateChange('idle');
      this.notifyEnd();
      return;
    }

    const token = ++this.playbackId;
    const rawText = this.currentSegments[this.currentIndex];
    const spokenText = preprocessTextForSpeech(rawText, this.currentLang) || rawText;
    const bcp47 = this.getBcp47(this.currentLang);

    this.notifySegmentChange(this.currentIndex);

    try {
      await Speech.stop();
    } catch {
      // Bỏ qua lỗi stop khi chưa phát
    }

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

    // Ưu tiên 1: Giọng AI Neural (Microsoft HoaiMy / NamMinh + 5 ngôn ngữ) qua Backend có cache MP3
    const playedNeural = await this.tryPlayNeuralAudio(
      spokenText,
      token,
      advanceToNext
    );
    if (playedNeural) {
      return;
    }

    if (token !== this.playbackId || this.state !== 'playing') {
      return;
    }

    // Ưu tiên 2 (Offline Fallback): Giọng thiết bị chất lượng cao nhất + tiền xử lý tiếng Việt mượt mà
    const bestVoice = await this.selectBestVoice(bcp47);
    if (token !== this.playbackId || this.state !== 'playing') {
      return;
    }

    // Tốc độ đọc thiết bị tiếng Việt chậm hơn nhẹ 6% để tròn chữ, bớt gấp gáp
    const deviceRate =
      this.currentLang === 'vi'
        ? this.clampRate(this.currentRate * 0.94)
        : this.currentRate;

    this.notifyEngineChange(
      'device',
      bestVoice.name ? bestVoice.name.slice(0, 26) : 'Giọng thiết bị'
    );
    this.startEstimatedProgressTicker(spokenText, deviceRate, token);

    try {
      Speech.speak(spokenText, {
        language: bcp47,
        rate: deviceRate,
        pitch: this.voiceGender === 'male' ? 0.94 : 1.0,
        ...(bestVoice.identifier ? { voice: bestVoice.identifier } : {}),
        onDone: () => {
          this.clearProgressTimer();
          this.callbacks.onProgress?.(1, 0, 0);
          advanceToNext();
        },
        onStopped: () => {
          // Được xử lý chủ động qua pause()/stop()/chuyển câu
        },
        onError: (err) => {
          if (settled || token !== this.playbackId || this.state !== 'playing') {
            return;
          }
          settled = true;
          const detail =
            err &&
            typeof err === 'object' &&
            'message' in err &&
            typeof err.message === 'string'
              ? err.message
              : 'Thiết bị chưa hỗ trợ giọng đọc cho ngôn ngữ này, chuyển sang chạy phụ đề tự động.';
          this.callbacks.onError?.(detail);
          this.notifyEngineChange('simulated', 'Phụ đề tự động');
          this.runSimulatedReading(spokenText, token);
        },
      });
    } catch (err) {
      const detail =
        err instanceof Error
          ? err.message
          : 'Không thể khởi chạy bộ đọc giọng nói, đang chạy phụ đề tự động.';
      this.callbacks.onError?.(detail);
      this.notifyEngineChange('simulated', 'Phụ đề tự động');
      this.runSimulatedReading(spokenText, token);
    }
  }

  private runSimulatedReading(text: string, token: number): void {
    this.clearFallbackTimer();
    const durationMs = Math.max(
      2500,
      Math.round((text.length * 55) / this.currentRate)
    );
    this.fallbackTimer = setTimeout(() => {
      if (token !== this.playbackId || this.state !== 'playing') {
        return;
      }
      this.currentIndex += 1;
      void this.speakCurrentSegment();
    }, durationMs);
  }

  /** Tạm dừng phát: giữ nguyên vị trí nếu đang phát MP3 Neural, hoặc lưu chỉ mục câu với expo-speech */
  public pause(): void {
    if (this.state !== 'playing') return;
    this.clearFallbackTimer();
    this.clearProgressTimer();
    if (this.webAudio) {
      try {
        this.webAudio.pause();
      } catch {
        // Ignore
      }
      this.notifyStateChange('paused');
      return;
    }
    if (this.nativePlayer) {
      try {
        this.nativePlayer.pause();
      } catch {
        // Ignore
      }
      this.notifyStateChange('paused');
      return;
    }
    this.playbackId += 1;
    void Speech.stop().catch(() => {});
    this.notifyStateChange('paused');
  }

  /** Tiếp tục phát từ đúng vị trí đang tạm dừng */
  public resume(): void {
    if (this.state !== 'paused') return;
    if (!this.currentSegments.length) {
      this.notifyStateChange('idle');
      return;
    }
    if (this.webAudio) {
      const audio = this.webAudio;
      const token = this.playbackId;
      this.notifyStateChange('playing');
      void audio
        .play()
        .then(() => {
          this.clearProgressTimer();
          this.progressTimer = setInterval(() => {
            if (token !== this.playbackId || this.state !== 'playing') {
              this.clearProgressTimer();
              return;
            }
            const dur = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
            const cur = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
            if (dur > 0) {
              this.callbacks.onProgress?.(Math.min(1, cur / dur), cur, dur);
            }
          }, 150);
        })
        .catch(() => {
          void this.speakCurrentSegment();
        });
      return;
    }
    if (this.nativePlayer) {
      this.notifyStateChange('playing');
      try {
        this.nativePlayer.play();
      } catch {
        void this.speakCurrentSegment();
      }
      return;
    }
    this.notifyStateChange('playing');
    void this.speakCurrentSegment();
  }

  public nextSegment(): number {
    if (!this.currentSegments.length) return 0;
    const nextIdx = Math.min(
      this.currentSegments.length - 1,
      this.currentIndex + 1
    );
    return this.jumpToSegment(nextIdx, this.state === 'playing');
  }

  public prevSegment(): number {
    if (!this.currentSegments.length) return 0;
    const prevIdx = Math.max(0, this.currentIndex - 1);
    return this.jumpToSegment(prevIdx, this.state === 'playing');
  }

  public jumpToSegment(index: number, autoPlay = true): number {
    if (!this.currentSegments.length) return 0;
    const clamped = Math.max(
      0,
      Math.min(this.currentSegments.length - 1, index)
    );
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

  /** Đổi tốc độ đọc mượt tức thì (0.75x, 1.0x, 1.25x, 1.5x) mà không cần tải lại MP3 */
  public setRate(rate: SpeechRate | number): void {
    this.currentRate = this.clampRate(rate);
    if (this.webAudio) {
      this.webAudio.playbackRate = this.currentRate;
      return;
    }
    if (this.nativePlayer) {
      try {
        this.nativePlayer.setPlaybackRate(this.currentRate);
        return;
      } catch {
        // fallback reload
      }
    }
    if (this.state === 'playing' && this.currentSegments.length > 0) {
      void this.speakCurrentSegment();
    }
  }

  /** Đổi giới tính giọng đọc (Nữ / Nam) */
  public setVoiceGender(gender: SpeechVoiceGender): void {
    if (this.voiceGender === gender) return;
    this.voiceGender = gender;
    this.neuralDisabledUntil = 0; // Thử lại Neural voice khi đổi giọng
    if (this.state === 'playing' && this.currentSegments.length > 0) {
      void this.speakCurrentSegment();
    }
  }

  public getVoiceGender(): SpeechVoiceGender {
    return this.voiceGender;
  }

  public getActiveEngine(): SpeechEngineMode {
    return this.activeEngine;
  }

  public setLanguage(lang: SupportedLanguage, updatedSegments?: string[]): void {
    this.currentLang = lang;
    if (updatedSegments && updatedSegments.length > 0) {
      this.currentSegments = [...updatedSegments];
      this.currentIndex = Math.min(
        this.currentIndex,
        updatedSegments.length - 1
      );
    }
    if (this.state === 'playing' && this.currentSegments.length > 0) {
      void this.speakCurrentSegment();
    }
  }

  private stopInternal(emitState: boolean): void {
    this.playbackId += 1;
    this.clearFallbackTimer();
    this.cleanupAudioPlayers();
    this.callbacks.onLoadingChange?.(false);
    this.callbacks.onProgress?.(0, 0, 0);
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
    if (this.webAudio || this.nativePlayer) {
      return this.state === 'playing';
    }
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
