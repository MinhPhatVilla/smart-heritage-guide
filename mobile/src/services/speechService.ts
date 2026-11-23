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
  /** Tiến độ đọc thời gian thực trong đoạn hiện tại (0..1) kèm giây hiện tại & tổng giây */
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

interface SegmentBound {
  startRatio: number;
  endRatio: number;
}

interface ContinuousScriptBundle {
  fullText: string;
  normalizedSegments: string[];
  bounds: SegmentBound[];
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
  onloadedmetadata?: (() => void) | null;
  onended: (() => void) | null;
  onerror: (() => void) | null;
  play: () => Promise<void>;
  pause: () => void;
}

const MAX_CONTINUOUS_TTS_CHARS = 3800;
const NEURAL_FETCH_TIMEOUT_MS = 5500;
const NEURAL_COOLDOWN_MS = 45_000;

function buildContinuousScript(
  segments: string[],
  lang: SupportedLanguage
): ContinuousScriptBundle {
  const normalizedSegments = segments.map((raw) => {
    const clean = preprocessTextForSpeech(raw, lang) || (raw || '').trim();
    if (!clean) return '';
    return /[.!?。！？]$/.test(clean) ? clean : `${clean}.`;
  });

  const weights = normalizedSegments.map((s) => Math.max(16, s.length));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0) || 1;
  let cursor = 0;
  const bounds: SegmentBound[] = weights.map((w) => {
    const startRatio = cursor / totalWeight;
    cursor += w;
    const endRatio = cursor / totalWeight;
    return { startRatio, endRatio };
  });

  const fullText = normalizedSegments
    .filter(Boolean)
    .join(' ')
    .slice(0, MAX_CONTINUOUS_TTS_CHARS)
    .trim();

  return { fullText, normalizedSegments, bounds };
}

class MultiLingualSpeechService {
  private fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private progressTimer: ReturnType<typeof setInterval> | null = null;
  private activeFetchAbort: AbortController | null = null;
  private currentSegments: string[] = [];
  private currentBundle: ContinuousScriptBundle | null = null;
  private isContinuousMode = false;
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
  private nativeWarmupKeys = new Set<string>();
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
      this.callbacks.onProgress?.(
        ratio,
        Math.min(elapsedSec, estDurationSec),
        estDurationSec
      );
    }, 180);
  }

  private cleanupAudioPlayers(): void {
    this.clearProgressTimer();
    this.isContinuousMode = false;
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
        this.webAudio.onloadedmetadata = null;
        this.webAudio.onended = null;
        this.webAudio.onerror = null;
        this.webAudio.pause();
        this.webAudio.src = '';
      } catch {
        // Ignore browser cleanup error
      }
      this.webAudio = null;
    }
    if (this.nativeSubscription) {
      try {
        this.nativeSubscription.remove();
      } catch {
        // Ignore
      }
      this.nativeSubscription = null;
    }
    if (this.nativePlayer) {
      try {
        this.nativePlayer.pause();
        this.nativePlayer.remove();
      } catch {
        // Ignore
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

  private syncContinuousProgress(curSec: number, durSec: number): void {
    if (!this.currentBundle || durSec <= 0) return;
    const overallRatio = Math.max(0, Math.min(1, curSec / durSec));
    const bounds = this.currentBundle.bounds;
    let idx = bounds.length - 1;
    for (let i = 0; i < bounds.length; i += 1) {
      if (overallRatio <= bounds[i].endRatio || i === bounds.length - 1) {
        idx = i;
        break;
      }
    }
    if (idx !== this.currentIndex) {
      this.currentIndex = idx;
      this.notifySegmentChange(idx);
    }
    const b = bounds[idx];
    const span = Math.max(0.001, b.endRatio - b.startRatio);
    const segRatio = Math.max(0, Math.min(1, (overallRatio - b.startRatio) / span));
    this.callbacks.onProgress?.(segRatio, curSec, durSec);
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

  /**
   * Tiền tải (Pre-warm) toàn bộ bài thuyết minh liên mạch ngay khi mở chi tiết di tích
   * để khi người dùng bấm "Nghe thuyết minh" âm thanh phát gần như tức thì (<50ms) và không bị ngắt đoạn!
   */
  public prefetchScript(
    segments: string[],
    lang: SupportedLanguage,
    gender: SpeechVoiceGender = this.voiceGender
  ): void {
    if (!segments.length || !shouldTryBackendProxy() || Date.now() < this.neuralDisabledUntil) {
      return;
    }
    const bundle = buildContinuousScript(segments, lang);
    if (!bundle.fullText) return;

    if (Platform.OS === 'web') {
      void this.fetchWebNeuralBlobUrl(bundle.fullText, lang, gender, true);
      return;
    }

    // Native: kích hoạt warm RAM LRU cache trên Backend để expo-audio tải về tức thì khi bấm Play
    const key = this.makeCacheKey(bundle.fullText, lang, gender);
    if (this.nativeWarmupKeys.has(key)) return;
    this.nativeWarmupKeys.add(key);
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), NEURAL_FETCH_TIMEOUT_MS);
    void fetch(`${getApiBaseUrl()}/api/v1/ai/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: bundle.fullText,
        language: lang,
        voice_gender: gender,
      }),
      signal: controller.signal,
    })
      .catch(() => {
        this.nativeWarmupKeys.delete(key);
      })
      .finally(() => {
        clearTimeout(tid);
      });
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
      this.currentBundle = null;
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
    this.currentBundle = buildContinuousScript(this.currentSegments, this.currentLang);
    this.currentIndex = Math.max(0, Math.min(startIndex, segments.length - 1));
    this.callbacks = callbacks;

    this.notifyStateChange('playing');
    void this.startPlaybackPipeline(this.currentIndex);
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
    gender: SpeechVoiceGender,
    isPrefetch = false
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
      if (!isPrefetch) {
        this.activeFetchAbort = controller;
      }
      const timeoutId = setTimeout(() => controller.abort(), NEURAL_FETCH_TIMEOUT_MS);
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
            this.neuralDisabledUntil = Date.now() + NEURAL_COOLDOWN_MS;
          }
          return null;
        }
        const blob = await res.blob();
        if (!blob || blob.size < 256) return null;
        const urlCreator = (
          globalThis as unknown as { URL?: { createObjectURL?: (b: Blob) => string } }
        ).URL;
        if (!urlCreator?.createObjectURL) return null;
        const blobUrl = urlCreator.createObjectURL(blob);
        this.webBlobCache.set(key, blobUrl);
        return blobUrl;
      } catch {
        if (!isPrefetch) {
          // Backend offline hoặc chậm -> tạm bỏ qua Neural TTS 45s để chuyển giọng thiết bị ngay lập tức
          this.neuralDisabledUntil = Date.now() + NEURAL_COOLDOWN_MS;
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

  /**
   * Ưu tiên 1: Phát 1 luồng AI Neural liên mạch duy nhất cho toàn bộ bài thuyết minh.
   * Không ngắt quãng giữa các đoạn, seek tức thì 0ms khi bấm chọn đoạn bất kỳ!
   */
  private async tryPlayContinuousNeuralAudio(
    bundle: ContinuousScriptBundle,
    startIndex: number,
    token: number
  ): Promise<boolean> {
    if (
      !bundle.fullText ||
      !shouldTryBackendProxy() ||
      Date.now() < this.neuralDisabledUntil
    ) {
      return false;
    }

    const startRatio = bundle.bounds[startIndex]?.startRatio ?? 0;
    const voiceLabel =
      this.currentLang === 'vi'
        ? this.voiceGender === 'female'
          ? 'AI · Hoài My'
          : 'AI · Nam Minh'
        : `AI Neural (${this.currentLang.toUpperCase()})`;

    // 1. Web: HTML5 Audio + Blob Cache 1 file liên mạch
    if (Platform.OS === 'web') {
      const AudioCtor = (
        globalThis as unknown as { Audio?: new (src?: string) => WebAudioLike }
      ).Audio;
      if (!AudioCtor) return false;

      const cacheKey = this.makeCacheKey(
        bundle.fullText,
        this.currentLang,
        this.voiceGender
      );
      const isAlreadyCached = this.webBlobCache.has(cacheKey);
      if (!isAlreadyCached) {
        this.callbacks.onLoadingChange?.(true);
      }
      const blobUrl = await this.fetchWebNeuralBlobUrl(
        bundle.fullText,
        this.currentLang,
        this.voiceGender,
        false
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
          this.isContinuousMode = true;

          let resolved = false;
          let appliedInitialSeek = startRatio <= 0.005;

          const applySeekIfReady = () => {
            if (
              !appliedInitialSeek &&
              Number.isFinite(audio.duration) &&
              audio.duration > 0
            ) {
              appliedInitialSeek = true;
              try {
                audio.currentTime = Math.min(
                  Math.max(0, startRatio * audio.duration),
                  Math.max(0, audio.duration - 0.25)
                );
              } catch {
                // Ignore seek error
              }
            }
          };

          const emitWebProgress = () => {
            if (token !== this.playbackId || this.state !== 'playing') return;
            applySeekIfReady();
            const dur =
              Number.isFinite(audio.duration) && audio.duration > 0
                ? audio.duration
                : 0;
            const cur = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
            if (dur > 0) {
              this.syncContinuousProgress(cur, dur);
            }
          };

          audio.onloadedmetadata = applySeekIfReady;
          audio.ontimeupdate = emitWebProgress;
          audio.onended = () => {
            this.clearProgressTimer();
            if (token !== this.playbackId || this.state !== 'playing') return;
            const dur =
              Number.isFinite(audio.duration) && audio.duration > 0
                ? audio.duration
                : 0;
            this.callbacks.onProgress?.(1, dur, dur);
            this.isContinuousMode = false;
            this.notifyStateChange('idle');
            this.notifyEnd();
          };
          audio.onerror = () => {
            this.clearProgressTimer();
            this.isContinuousMode = false;
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
              applySeekIfReady();
              this.notifyEngineChange('neural', voiceLabel);
              this.clearProgressTimer();
              this.progressTimer = setInterval(emitWebProgress, 150);
              if (!resolved) {
                resolved = true;
                resolve(true);
              }
            })
            .catch(() => {
              this.isContinuousMode = false;
              if (!resolved) {
                resolved = true;
                resolve(false);
              }
            });
        } catch {
          this.isContinuousMode = false;
          resolve(false);
        }
      });
    }

    // 2. iOS / Android Native: expo-audio phát 1 luồng liên mạch từ Backend RAM stream
    try {
      if (!this.audioModeConfigured) {
        await setAudioModeAsync({
          playsInSilentMode: true,
        }).catch(() => {});
        this.audioModeConfigured = true;
      }

      const ttsUrl = this.buildGetTtsUrl(
        bundle.fullText,
        this.currentLang,
        this.voiceGender
      );

      this.callbacks.onLoadingChange?.(true);
      const player = createAudioPlayer(
        { uri: ttsUrl },
        { updateInterval: 200, downloadFirst: false }
      );
      try {
        player.shouldCorrectPitch = true;
      } catch {
        // Ignore on devices that do not support pitch correction before load
      }
      this.nativePlayer = player;
      this.isContinuousMode = true;

      return await new Promise<boolean>((resolve) => {
        let started = false;
        let finished = false;
        let appliedInitialSeek = startRatio <= 0.005;

        const guardTimer = setTimeout(() => {
          if (!started && !finished) {
            finished = true;
            this.callbacks.onLoadingChange?.(false);
            this.cleanupAudioPlayers();
            this.neuralDisabledUntil = Date.now() + NEURAL_COOLDOWN_MS;
            resolve(false);
          }
        }, NEURAL_FETCH_TIMEOUT_MS);

        this.nativeSubscription = player.addListener(
          'playbackStatusUpdate',
          (status) => {
            if (token !== this.playbackId) return;

            if (status.error) {
              clearTimeout(guardTimer);
              this.callbacks.onLoadingChange?.(false);
              this.cleanupAudioPlayers();
              this.neuralDisabledUntil = Date.now() + NEURAL_COOLDOWN_MS;
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
              try {
                player.setPlaybackRate(this.currentRate);
              } catch {
                // Ignore unsupported rate before playback starts
              }
              if (!appliedInitialSeek && status.duration > 0) {
                appliedInitialSeek = true;
                try {
                  void player.seekTo(startRatio * status.duration);
                } catch {
                  // Ignore
                }
              }
              if (!status.playing && this.state === 'playing') {
                try {
                  player.play();
                } catch {
                  // Already starting
                }
              }
              this.notifyEngineChange('neural', voiceLabel);
              resolve(true);
            }

            if (status.duration > 0) {
              if (!appliedInitialSeek) {
                appliedInitialSeek = true;
                try {
                  void player.seekTo(startRatio * status.duration);
                } catch {
                  // Ignore
                }
              }
              this.syncContinuousProgress(status.currentTime, status.duration);
            }

            if (status.didJustFinish && !finished) {
              finished = true;
              clearTimeout(guardTimer);
              this.callbacks.onProgress?.(
                1,
                status.duration || 0,
                status.duration || 0
              );
              this.isContinuousMode = false;
              this.notifyStateChange('idle');
              this.notifyEnd();
            }
          }
        );

        try {
          player.play();
        } catch {
          // Will start automatically on isLoaded
        }
      });
    } catch {
      this.callbacks.onLoadingChange?.(false);
      this.cleanupAudioPlayers();
      return false;
    }
  }

  private async startPlaybackPipeline(startIndex: number): Promise<void> {
    this.clearFallbackTimer();
    this.cleanupAudioPlayers();

    if (startIndex >= this.currentSegments.length) {
      this.notifyStateChange('idle');
      this.notifyEnd();
      return;
    }

    const token = ++this.playbackId;
    this.currentIndex = startIndex;
    this.notifySegmentChange(startIndex);

    try {
      await Speech.stop();
    } catch {
      // Ignore stop error when idle
    }

    if (token !== this.playbackId || this.state !== 'playing') {
      return;
    }

    // Ưu tiên 1: 1 luồng AI Neural liên mạch (0 độ trễ giữa các đoạn!)
    if (this.currentBundle && this.currentBundle.fullText) {
      const playedNeural = await this.tryPlayContinuousNeuralAudio(
        this.currentBundle,
        startIndex,
        token
      );
      if (playedNeural) {
        return;
      }
    }

    if (token !== this.playbackId || this.state !== 'playing') {
      return;
    }

    // Ưu tiên 2 (Offline Fallback): Giọng thiết bị chất lượng cao + chuẩn hóa phát âm số & tên nước ngoài
    await this.speakSegmentWithDeviceTts(token);
  }

  private async speakSegmentWithDeviceTts(token: number): Promise<void> {
    if (token !== this.playbackId || this.state !== 'playing') return;
    if (this.currentIndex >= this.currentSegments.length) {
      this.notifyStateChange('idle');
      this.notifyEnd();
      return;
    }

    const rawText = this.currentSegments[this.currentIndex];
    const spokenText =
      this.currentBundle?.normalizedSegments[this.currentIndex] ||
      preprocessTextForSpeech(rawText, this.currentLang) ||
      rawText;
    const bcp47 = this.getBcp47(this.currentLang);

    this.notifySegmentChange(this.currentIndex);

    const bestVoice = await this.selectBestVoice(bcp47);
    if (token !== this.playbackId || this.state !== 'playing') {
      return;
    }

    const deviceRate =
      this.currentLang === 'vi'
        ? this.clampRate(this.currentRate * 0.94)
        : this.currentRate;

    this.notifyEngineChange(
      'device',
      bestVoice.name ? bestVoice.name.slice(0, 26) : 'Giọng thiết bị'
    );
    this.startEstimatedProgressTicker(spokenText, deviceRate, token);

    let settled = false;
    const advanceToNext = () => {
      if (settled || token !== this.playbackId || this.state !== 'playing') {
        return;
      }
      settled = true;
      this.currentIndex += 1;
      void this.speakSegmentWithDeviceTts(token);
    };

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
          // Handled via pause/stop/jump
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
      void this.speakSegmentWithDeviceTts(token);
    }, durationMs);
  }

  /** Tạm dừng phát: giữ nguyên vị trí chính xác nếu đang phát MP3 Neural */
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
            const dur =
              Number.isFinite(audio.duration) && audio.duration > 0
                ? audio.duration
                : 0;
            const cur = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
            if (dur > 0) {
              this.syncContinuousProgress(cur, dur);
            }
          }, 150);
        })
        .catch(() => {
          void this.startPlaybackPipeline(this.currentIndex);
        });
      return;
    }
    if (this.nativePlayer) {
      this.notifyStateChange('playing');
      try {
        this.nativePlayer.play();
      } catch {
        void this.startPlaybackPipeline(this.currentIndex);
      }
      return;
    }
    this.notifyStateChange('playing');
    void this.startPlaybackPipeline(this.currentIndex);
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

  /**
   * Nhảy tới đoạn bất kỳ:
   * - Nếu đang ở chế độ Continuous Neural: tua (seek) tức thì 0ms không cần tải lại!
   * - Nếu đang ở chế độ Device TTS: đọc ngay đoạn mới.
   */
  public jumpToSegment(index: number, autoPlay = true): number {
    if (!this.currentSegments.length) return 0;
    const clamped = Math.max(
      0,
      Math.min(this.currentSegments.length - 1, index)
    );
    this.currentIndex = clamped;
    this.notifySegmentChange(clamped);

    const targetRatio = this.currentBundle?.bounds[clamped]?.startRatio ?? 0;

    if (this.isContinuousMode && this.webAudio) {
      const dur = this.webAudio.duration;
      if (Number.isFinite(dur) && dur > 0) {
        try {
          this.webAudio.currentTime = Math.min(
            Math.max(0, targetRatio * dur),
            Math.max(0, dur - 0.25)
          );
          this.callbacks.onProgress?.(0, this.webAudio.currentTime, dur);
        } catch {
          // Ignore seek error
        }
        if (autoPlay && this.state !== 'playing') {
          this.resume();
        } else if (!autoPlay && this.state === 'playing') {
          this.pause();
        }
        return clamped;
      }
    }

    if (this.isContinuousMode && this.nativePlayer) {
      const dur = this.nativePlayer.duration || 0;
      if (dur > 0) {
        try {
          void this.nativePlayer.seekTo(targetRatio * dur);
          this.callbacks.onProgress?.(0, targetRatio * dur, dur);
        } catch {
          // Ignore seek error
        }
        if (autoPlay && this.state !== 'playing') {
          this.resume();
        } else if (!autoPlay && this.state === 'playing') {
          this.pause();
        }
        return clamped;
      }
    }

    if (autoPlay) {
      this.notifyStateChange('playing');
      void this.startPlaybackPipeline(clamped);
    } else if (this.state === 'playing') {
      this.pause();
    }
    return clamped;
  }

  /** Đổi tốc độ đọc mượt tức thì (0.75x, 1.0x, 1.25x, 1.5x) mà không cần tải lại audio */
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
      void this.startPlaybackPipeline(this.currentIndex);
    }
  }

  /** Đổi giới tính giọng đọc (Nữ / Nam) */
  public setVoiceGender(gender: SpeechVoiceGender): void {
    if (this.voiceGender === gender) return;
    this.voiceGender = gender;
    this.neuralDisabledUntil = 0;
    if (this.state === 'playing' && this.currentSegments.length > 0) {
      void this.startPlaybackPipeline(this.currentIndex);
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
      this.currentBundle = buildContinuousScript(this.currentSegments, lang);
      this.currentIndex = Math.min(
        this.currentIndex,
        updatedSegments.length - 1
      );
    }
    if (this.state === 'playing' && this.currentSegments.length > 0) {
      void this.startPlaybackPipeline(this.currentIndex);
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
