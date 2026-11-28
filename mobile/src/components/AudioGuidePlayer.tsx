import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  GestureResponderEvent,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Globe,
  Mic,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Square,
} from 'lucide-react-native';
import {
  HeritageSite,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from '../types/heritage';
import {
  SPEECH_RATES,
  SpeechEngineMode,
  SpeechPlayState,
  SpeechRate,
  SpeechVoiceGender,
  speechService,
} from '../services/speechService';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../theme';

export interface AudioPlaybackSnapshot {
  playState: SpeechPlayState;
  progressPercent: number;
  currentSeconds: number;
  durationSeconds: number;
  activeSegment: number;
  totalSegments: number;
  isBuffering: boolean;
}

export interface AudioGuidePlayerProps {
  site: HeritageSite;
  selectedLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  autoPlayOnOpen?: boolean;
  compact?: boolean;
  onPlaybackSnapshotChange?: (snapshot: AudioPlaybackSnapshot) => void;
}

const LOCALIZED_VOICE_LABELS: Record<
  SupportedLanguage,
  { female: string; male: string }
> = {
  vi: { female: 'Nữ · Hoài My', male: 'Nam · Nam Minh' },
  en: { female: 'Female · Aria', male: 'Male · Guy' },
  fr: { female: 'Femme · Denise', male: 'Homme · Henri' },
  zh: { female: '女声 · 晓晓', male: '男声 · 云希' },
  ja: { female: '女性 · 七海', male: '男性 · 圭太' },
};

export function formatAudioClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const AudioGuidePlayer: React.FC<AudioGuidePlayerProps> = ({
  site,
  selectedLanguage,
  onLanguageChange,
  autoPlayOnOpen = false,
  compact = false,
  onPlaybackSnapshotChange,
}) => {
  const [playState, setPlayState] = useState<SpeechPlayState>('idle');
  const [activeSegment, setActiveSegment] = useState<number>(0);
  const [speechRate, setSpeechRate] = useState<SpeechRate>(1.0);
  const [voiceGender, setVoiceGender] = useState<SpeechVoiceGender>(() =>
    speechService.getVoiceGender()
  );
  const [engineMode, setEngineMode] = useState<SpeechEngineMode>(() =>
    speechService.getActiveEngine()
  );
  const [activeVoiceLabel, setActiveVoiceLabel] = useState<string>('');
  const [isBufferingAudio, setIsBufferingAudio] = useState<boolean>(false);
  const [segmentProgress, setSegmentProgress] = useState<number>(0);
  const [segmentTiming, setSegmentTiming] = useState<{
    current: number;
    duration: number;
  }>({ current: 0, duration: 0 });
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [langMenuOpen, setLangMenuOpen] = useState<boolean>(false);
  const [showTranscript, setShowTranscript] = useState<boolean>(true);
  const [seekbarWidth, setSeekbarWidth] = useState<number>(0);

  const mountedRef = useRef(true);
  const bar1 = useRef(new Animated.Value(0.35)).current;
  const bar2 = useRef(new Animated.Value(0.55)).current;
  const bar3 = useRef(new Animated.Value(0.3)).current;

  const localized = site.translations[selectedLanguage] || site.translations.vi;
  const segments = localized.audioScript;
  const currentLangMeta =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) ||
    SUPPORTED_LANGUAGES[0];

  // Subtle equalizer animation when playing
  useEffect(() => {
    if (playState !== 'playing') {
      bar1.setValue(0.35);
      bar2.setValue(0.55);
      bar3.setValue(0.3);
      return;
    }

    const useNative = Platform.OS !== 'web';
    const makeWave = (val: Animated.Value, duration: number, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration,
            useNativeDriver: useNative,
          }),
          Animated.timing(val, {
            toValue: 0.28,
            duration,
            useNativeDriver: useNative,
          }),
        ])
      );

    const a1 = makeWave(bar1, 420, 0);
    const a2 = makeWave(bar2, 360, 120);
    const a3 = makeWave(bar3, 460, 220);
    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [playState, bar1, bar2, bar3]);

  const startSpeaking = useCallback(
    (
      index: number,
      lang: SupportedLanguage = selectedLanguage,
      rate: SpeechRate = speechRate,
      gender: SpeechVoiceGender = voiceGender
    ) => {
      setSpeechError(null);
      const script = (site.translations[lang] || site.translations.vi)
        .audioScript;
      if (!script.length) return;

      const clampedIndex = Math.max(0, Math.min(index, script.length - 1));
      setActiveSegment(clampedIndex);
      setSegmentProgress(0);
      setSegmentTiming({ current: 0, duration: 0 });

      speechService.speakScript(
        script,
        lang,
        rate,
        clampedIndex,
        {
          onSegmentChange: (idx) => {
            if (mountedRef.current) {
              setActiveSegment(idx);
            }
          },
          onStateChange: (st) => {
            if (mountedRef.current) setPlayState(st);
          },
          onEngineChange: (engine, label) => {
            if (mountedRef.current) {
              setEngineMode(engine);
              setActiveVoiceLabel(label || '');
            }
          },
          onLoadingChange: (loading) => {
            if (mountedRef.current) setIsBufferingAudio(loading);
          },
          onProgress: (ratio, curSec, durSec) => {
            if (mountedRef.current) {
              setSegmentProgress(Math.max(0, Math.min(1, ratio)));
              if (durSec > 0) {
                setSegmentTiming({ current: curSec, duration: durSec });
              }
            }
          },
          onEnd: () => {
            if (mountedRef.current) {
              setPlayState('idle');
              setActiveSegment(0);
              setSegmentProgress(0);
              setSegmentTiming({ current: 0, duration: 0 });
              setIsBufferingAudio(false);
            }
          },
          onError: (msg) => {
            if (mountedRef.current) {
              setSpeechError(msg);
            }
          },
        },
        gender
      );
    },
    [site, selectedLanguage, speechRate, voiceGender]
  );

  useEffect(() => {
    mountedRef.current = true;
    speechService.stop();
    setPlayState('idle');
    setActiveSegment(0);
    setSegmentProgress(0);
    setSegmentTiming({ current: 0, duration: 0 });
    setSpeechError(null);
    setLangMenuOpen(false);

    if (autoPlayOnOpen) {
      startSpeaking(0, selectedLanguage, speechRate);
    }

    return () => {
      mountedRef.current = false;
      speechService.stop();
    };
  }, [site.id]);

  const safeActiveSegment =
    segments.length > 0
      ? Math.max(0, Math.min(activeSegment, segments.length - 1))
      : 0;

  useEffect(() => {
    setActiveSegment((prev) =>
      segments.length > 0 ? Math.max(0, Math.min(prev, segments.length - 1)) : 0
    );
  }, [selectedLanguage, segments.length]);

  useEffect(() => {
    if (segments.length > 0) {
      speechService.prefetchScript(segments, selectedLanguage, voiceGender);
    }
  }, [site.id, selectedLanguage, voiceGender, segments]);

  const progressPercent = (() => {
    if (segments.length === 0) return 0;
    if (segmentTiming.duration > 0 && playState !== 'idle') {
      return Math.max(
        0,
        Math.min(
          100,
          Math.round((segmentTiming.current / segmentTiming.duration) * 100)
        )
      );
    }
    if (playState === 'idle' && segmentProgress === 0) return 0;
    const weights = segments.map((s) => Math.max(24, s.length));
    const totalWeight = weights.reduce((acc, w) => acc + w, 0) || 1;
    let completed = 0;
    for (let i = 0; i < safeActiveSegment; i += 1) {
      completed += weights[i];
    }
    completed += weights[safeActiveSegment] * segmentProgress;
    return Math.max(
      0,
      Math.min(100, Math.round((completed / totalWeight) * 100))
    );
  })();

  // Emit live snapshot so parent HeritageDetailModal can render persistent Mini Audio Bar across tabs
  useEffect(() => {
    onPlaybackSnapshotChange?.({
      playState,
      progressPercent,
      currentSeconds: segmentTiming.current,
      durationSeconds: segmentTiming.duration,
      activeSegment: safeActiveSegment,
      totalSegments: segments.length,
      isBuffering: isBufferingAudio,
    });
  }, [
    onPlaybackSnapshotChange,
    playState,
    progressPercent,
    segmentTiming.current,
    segmentTiming.duration,
    safeActiveSegment,
    segments.length,
    isBufferingAudio,
  ]);

  const handleTogglePlay = () => {
    if (playState === 'idle') {
      startSpeaking(safeActiveSegment, selectedLanguage, speechRate);
    } else if (playState === 'playing') {
      speechService.pause();
    } else {
      speechService.resume();
    }
  };

  const handleStop = () => {
    speechService.stop();
    setPlayState('idle');
    setActiveSegment(0);
    setSegmentProgress(0);
    setSegmentTiming({ current: 0, duration: 0 });
    setSpeechError(null);
  };

  const handleLanguageSwitch = (lang: SupportedLanguage) => {
    setLangMenuOpen(false);
    if (lang === selectedLanguage) return;
    onLanguageChange(lang);
    const nextScript = (site.translations[lang] || site.translations.vi)
      .audioScript;
    const safeIdx = Math.min(
      safeActiveSegment,
      Math.max(0, nextScript.length - 1)
    );
    setActiveSegment(safeIdx);
    if (playState === 'playing' || playState === 'paused') {
      startSpeaking(safeIdx, lang, speechRate);
    }
  };

  const handleCycleRate = () => {
    const curIdx = SPEECH_RATES.indexOf(speechRate);
    const nextRate = SPEECH_RATES[(curIdx + 1) % SPEECH_RATES.length];
    setSpeechRate(nextRate);
    if (playState === 'playing' || playState === 'paused') {
      speechService.setRate(nextRate);
    }
  };

  const handleToggleVoiceGender = () => {
    const nextGender: SpeechVoiceGender =
      voiceGender === 'female' ? 'male' : 'female';
    setVoiceGender(nextGender);
    speechService.setVoiceGender(nextGender);
  };

  const handleStepSegment = (delta: number) => {
    const nextIdx = Math.max(
      0,
      Math.min(segments.length - 1, safeActiveSegment + delta)
    );
    setActiveSegment(nextIdx);
    if (playState === 'playing') {
      speechService.jumpToSegment(nextIdx, true);
    } else if (playState === 'paused') {
      speechService.jumpToSegment(nextIdx, false);
    }
  };

  const handleSeekBySeconds = (deltaSeconds: number) => {
    if (playState === 'idle') {
      const targetIdx = deltaSeconds > 0
        ? Math.min(segments.length - 1, safeActiveSegment + 1)
        : Math.max(0, safeActiveSegment - 1);
      startSpeaking(targetIdx, selectedLanguage, speechRate);
      return;
    }
    speechService.seekBySeconds(deltaSeconds);
  };

  const handleSeekbarLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setSeekbarWidth(w);
  };

  const handleSeekbarPress = (e: GestureResponderEvent) => {
    if (segments.length === 0) return;
    let tapX = 0;
    let width = seekbarWidth;

    if (Platform.OS === 'web') {
      const target = e.currentTarget as unknown as {
        getBoundingClientRect?: () => { left: number; width: number };
      };
      const nativeEv = e.nativeEvent as unknown as {
        pageX?: number;
        clientX?: number;
        locationX?: number;
      };
      const rect = target?.getBoundingClientRect?.();
      if (rect && rect.width > 0) {
        width = rect.width;
        const clientX = nativeEv.clientX ?? nativeEv.pageX ?? 0;
        tapX = clientX - rect.left;
      } else {
        tapX = nativeEv.locationX ?? 0;
      }
    } else {
      tapX = e.nativeEvent.locationX ?? 0;
    }

    if (width <= 0) return;
    const ratio = Math.max(0, Math.min(1, tapX / width));

    if (playState === 'idle') {
      const segIdx = Math.min(
        segments.length - 1,
        Math.floor(ratio * segments.length)
      );
      startSpeaking(segIdx, selectedLanguage, speechRate);
      return;
    }

    speechService.seekToRatio(ratio);
  };

  const statusText = isBufferingAudio
    ? 'Đang chuẩn bị giọng đọc…'
    : playState === 'playing'
      ? `Đang phát · Đoạn ${safeActiveSegment + 1}/${segments.length}`
      : playState === 'paused'
        ? `Tạm dừng · Đoạn ${safeActiveSegment + 1}/${segments.length}`
        : `Sẵn sàng phát · Đoạn ${
            segments.length > 0 ? safeActiveSegment + 1 : 0
          }/${segments.length}`;

  const voiceDisplayLabel =
    LOCALIZED_VOICE_LABELS[selectedLanguage]?.[voiceGender] ||
    LOCALIZED_VOICE_LABELS.vi[voiceGender];

  return (
    <View style={styles.outerWrap}>
      {/* Main Soft Jade Audio Player Card */}
      <View style={styles.playerCard}>
        {/* Top Row: Animated Equalizer + Status + Dropdown Language Trigger */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.eqBadge,
                playState === 'playing' && styles.eqBadgePlaying,
              ]}
            >
              <Animated.View
                style={[
                  styles.eqBar,
                  {
                    height: 14,
                    transform: [{ scaleY: bar1 }],
                    backgroundColor:
                      playState === 'playing'
                        ? COLORS.white
                        : COLORS.accentDeep,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.eqBar,
                  {
                    height: 18,
                    transform: [{ scaleY: bar2 }],
                    backgroundColor:
                      playState === 'playing'
                        ? COLORS.white
                        : COLORS.accentDeep,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.eqBar,
                  {
                    height: 12,
                    transform: [{ scaleY: bar3 }],
                    backgroundColor:
                      playState === 'playing'
                        ? COLORS.white
                        : COLORS.accentDeep,
                  },
                ]}
              />
            </View>

            <View style={styles.titleCol}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Thuyết minh âm thanh
              </Text>
              <Text style={styles.statusSub} numberOfLines={1}>
                {statusText}
                {playState !== 'idle' && activeVoiceLabel
                  ? ` · ${
                      engineMode === 'neural' ? activeVoiceLabel : 'Offline'
                    }`
                  : ''}
              </Text>
            </View>
          </View>

          {/* Dropdown Language Selector Trigger */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setLangMenuOpen((prev) => !prev)}
            style={[
              styles.langTriggerBtn,
              langMenuOpen && styles.langTriggerBtnOpen,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Chọn ngôn ngữ thuyết minh"
          >
            <Globe size={13} color={COLORS.accentDeep} strokeWidth={2} />
            <Text style={styles.langTriggerText} numberOfLines={1}>
              {currentLangMeta.nativeLabel}
            </Text>
            <ChevronDown
              size={13}
              color={COLORS.accentDeep}
              strokeWidth={2}
              style={
                langMenuOpen ? { transform: [{ rotate: '180deg' }] } : undefined
              }
            />
          </TouchableOpacity>
        </View>

        {/* Expandable 5-Language Dropdown Panel */}
        {langMenuOpen && (
          <View style={styles.langDropdownCard}>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const active = selectedLanguage === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  activeOpacity={0.78}
                  onPress={() => handleLanguageSwitch(lang.code)}
                  style={[
                    styles.langOptionRow,
                    active && styles.langOptionRowActive,
                  ]}
                >
                  <View style={styles.langOptionLeft}>
                    <Text
                      style={[
                        styles.langOptionNative,
                        active && styles.langOptionNativeActive,
                      ]}
                    >
                      {lang.nativeLabel}
                    </Text>
                    <Text style={styles.langOptionCode}>
                      {lang.code.toUpperCase()}
                    </Text>
                  </View>
                  {active && (
                    <Check
                      size={15}
                      color={COLORS.accentDeep}
                      strokeWidth={2.4}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Interactive Real-time Seekbar (Tap anywhere to seek + Thumb dot) */}
        <View style={styles.progressSection}>
          <Pressable
            onLayout={handleSeekbarLayout}
            onPress={handleSeekbarPress}
            style={styles.seekbarHitArea}
            accessibilityRole="adjustable"
            accessibilityLabel="Thanh tiến độ thuyết minh, chạm để tua"
          >
            <View style={styles.progressTrack} pointerEvents="none">
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>
            <View
              pointerEvents="none"
              style={[
                styles.seekThumb,
                {
                  left: `${progressPercent}%`,
                },
              ]}
            />
          </Pressable>

          <View style={styles.progressMetaRow}>
            <Text style={styles.timeText}>
              {segmentTiming.duration > 0 && playState !== 'idle'
                ? formatAudioClock(segmentTiming.current)
                : `${progressPercent}%`}
            </Text>
            <Text style={styles.timeText}>
              {segmentTiming.duration > 0 && playState !== 'idle'
                ? formatAudioClock(segmentTiming.duration)
                : `Đoạn ${
                    segments.length > 0 ? safeActiveSegment + 1 : 0
                  }/${segments.length}`}
            </Text>
          </View>
        </View>

        {/* Centered 5-Button Transport Controls (-10s · Prev · Play 56px · Next · +10s) */}
        <View style={styles.transportRow}>
          <TouchableOpacity
            onPress={() => handleSeekBySeconds(-10)}
            style={styles.seekStepBtn}
            accessibilityLabel="Tua lùi 10 giây"
            activeOpacity={0.75}
          >
            <RotateCcw size={16} color={COLORS.accentDeep} strokeWidth={2} />
            <Text style={styles.seekStepText}>10</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleStepSegment(-1)}
            disabled={safeActiveSegment === 0}
            style={[
              styles.stepBtn,
              safeActiveSegment === 0 && styles.stepBtnDisabled,
            ]}
            accessibilityLabel="Đoạn trước"
            activeOpacity={0.75}
          >
            <SkipBack size={16} color={COLORS.ink} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleTogglePlay}
            style={[
              styles.playCircleBtn,
              playState === 'playing' && styles.playCircleBtnPlaying,
            ]}
            accessibilityLabel={
              playState === 'playing'
                ? 'Tạm dừng thuyết minh'
                : 'Phát thuyết minh'
            }
            activeOpacity={0.85}
          >
            {isBufferingAudio ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : playState === 'playing' ? (
              <Pause size={22} color={COLORS.white} fill={COLORS.white} />
            ) : (
              <Play
                size={22}
                color={COLORS.white}
                fill={COLORS.white}
                style={{ marginLeft: 2 }}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleStepSegment(1)}
            disabled={safeActiveSegment >= segments.length - 1}
            style={[
              styles.stepBtn,
              safeActiveSegment >= segments.length - 1 &&
                styles.stepBtnDisabled,
            ]}
            accessibilityLabel="Đoạn tiếp theo"
            activeOpacity={0.75}
          >
            <SkipForward size={16} color={COLORS.ink} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSeekBySeconds(10)}
            style={styles.seekStepBtn}
            accessibilityLabel="Tua tới 10 giây"
            activeOpacity={0.75}
          >
            <RotateCw size={16} color={COLORS.accentDeep} strokeWidth={2} />
            <Text style={styles.seekStepText}>10</Text>
          </TouchableOpacity>
        </View>

        {/* Compact 1-Row Utility Bar: Voice Persona + Speed Cycle + Optional Stop */}
        <View style={styles.utilityRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleToggleVoiceGender}
            style={styles.voiceTogglePill}
            accessibilityLabel="Chuyển giọng đọc Nam hoặc Nữ"
          >
            <Mic size={13} color={COLORS.accentDeep} strokeWidth={2} />
            <Text style={styles.voiceToggleText} numberOfLines={1}>
              {voiceDisplayLabel}
            </Text>
            <Repeat size={12} color={COLORS.inkMuted} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCycleRate}
            style={styles.speedCyclePill}
            accessibilityLabel={`Tốc độ đọc ${speechRate}x, chạm để thay đổi`}
          >
            <Text style={styles.speedCycleText}>{speechRate}x</Text>
          </TouchableOpacity>

          {playState !== 'idle' && (
            <TouchableOpacity
              onPress={handleStop}
              style={styles.stopMiniBtn}
              accessibilityLabel="Dừng phát hoàn toàn"
              activeOpacity={0.75}
            >
              <Square
                size={13}
                color={COLORS.accentDeep}
                fill={COLORS.accentDeep}
              />
            </TouchableOpacity>
          )}
        </View>

        {speechError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{speechError}</Text>
          </View>
        ) : null}
      </View>

      {/* Collapsible Synchronized Interactive Transcript */}
      {!compact && segments.length > 0 && (
        <View style={styles.transcriptWrap}>
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={() => setShowTranscript((prev) => !prev)}
            style={styles.transcriptToggleBar}
            accessibilityRole="button"
            accessibilityLabel={
              showTranscript
                ? 'Ẩn nội dung thuyết minh đồng bộ'
                : 'Hiện nội dung thuyết minh đồng bộ'
            }
          >
            <View style={styles.transcriptToggleLeft}>
              <FileText size={14} color={COLORS.accentDeep} strokeWidth={2} />
              <Text style={styles.transcriptHeading}>
                Nội dung đồng bộ ({segments.length} đoạn)
              </Text>
            </View>

            <View style={styles.transcriptTogglePill}>
              <Text style={styles.transcriptTogglePillText}>
                {showTranscript ? 'Ẩn' : 'Hiện'}
              </Text>
              {showTranscript ? (
                <ChevronUp size={13} color={COLORS.accentDeep} strokeWidth={2.2} />
              ) : (
                <ChevronDown
                  size={13}
                  color={COLORS.accentDeep}
                  strokeWidth={2.2}
                />
              )}
            </View>
          </TouchableOpacity>

          {showTranscript && (
            <View style={styles.transcriptList}>
              {segments.map((segment, idx) => {
                const isCurrent = idx === safeActiveSegment;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      if (playState === 'playing' || playState === 'paused') {
                        speechService.jumpToSegment(idx, true);
                      } else {
                        startSpeaking(idx, selectedLanguage, speechRate);
                      }
                    }}
                    style={[
                      styles.segmentCard,
                      isCurrent && styles.segmentCardActive,
                    ]}
                    activeOpacity={0.78}
                  >
                    <Text
                      style={[
                        styles.segmentIndex,
                        isCurrent && styles.segmentIndexActive,
                      ]}
                    >
                      {idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`}
                      {isCurrent
                        ? playState === 'playing'
                          ? ' · Đang phát'
                          : ' · Đang chọn'
                        : ''}
                    </Text>
                    <Text
                      style={[
                        styles.segmentText,
                        isCurrent && styles.segmentTextActive,
                      ]}
                    >
                      {segment}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrap: {
    gap: 12,
  },
  playerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    gap: 13,
    ...SHADOWS.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  eqBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
    paddingBottom: 9,
  },
  eqBadgePlaying: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  eqBar: {
    width: 3,
    borderRadius: 99,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  headerTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  statusSub: {
    fontSize: 11.5,
    color: COLORS.inkMuted,
  },
  langTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 11,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    maxWidth: 136,
  },
  langTriggerBtnOpen: {
    backgroundColor: COLORS.accentSoftStrong,
    borderColor: COLORS.accent,
  },
  langTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentDeep,
    flexShrink: 1,
  },
  langDropdownCard: {
    backgroundColor: COLORS.bg,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    padding: 6,
    gap: 3,
  },
  langOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: RADII.md,
  },
  langOptionRowActive: {
    backgroundColor: COLORS.accentSoft,
  },
  langOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langOptionNative: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
  },
  langOptionNativeActive: {
    fontWeight: '700',
    color: COLORS.accentDeep,
  },
  langOptionCode: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  progressSection: {
    gap: 4,
  },
  seekbarHitArea: {
    width: '100%',
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accentSoft,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
  },
  seekThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    backgroundColor: COLORS.accentDeep,
    borderWidth: 2,
    borderColor: COLORS.surface,
    ...SHADOWS.card,
  },
  progressMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 2,
  },
  seekStepBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  seekStepText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.accentDeep,
    marginTop: -2,
    fontVariant: ['tabular-nums'],
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.35,
  },
  playCircleBtn: {
    width: 56,
    height: 56,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.floating,
  },
  playCircleBtnPlaying: {
    backgroundColor: COLORS.accentDeep,
  },
  stopMiniBtn: {
    width: 38,
    height: 38,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  voiceTogglePill: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  voiceToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
    flexShrink: 1,
  },
  speedCyclePill: {
    height: 38,
    minWidth: 56,
    paddingHorizontal: 14,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedCycleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentDeep,
    fontVariant: ['tabular-nums'],
  },
  errorBox: {
    backgroundColor: COLORS.amberBg,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    borderRadius: RADII.md,
    padding: SPACING.sm,
  },
  errorText: {
    fontSize: 11.5,
    color: COLORS.ink,
  },
  transcriptWrap: {
    gap: 8,
  },
  transcriptToggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  transcriptToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  transcriptHeading: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.ink,
  },
  transcriptTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  transcriptTogglePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.accentDeep,
  },
  transcriptList: {
    gap: 8,
  },
  segmentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    paddingVertical: 11,
    gap: 4,
  },
  segmentCardActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accentBorder,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  segmentIndex: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  segmentIndexActive: {
    color: COLORS.accentDeep,
  },
  segmentText: {
    fontSize: 13.5,
    lineHeight: 20.5,
    color: COLORS.inkSecondary,
  },
  segmentTextActive: {
    color: COLORS.ink,
    fontWeight: '600',
  },
});
