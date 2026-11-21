import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
} from 'lucide-react-native';
import {
  HeritageSite,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from '../types/heritage';
import {
  SPEECH_RATES,
  SpeechPlayState,
  SpeechRate,
  speechService,
} from '../services/speechService';
import { COLORS, RADII, SPACING } from '../theme';

export interface AudioGuidePlayerProps {
  site: HeritageSite;
  selectedLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  autoPlayOnOpen?: boolean;
  compact?: boolean;
}

export const AudioGuidePlayer: React.FC<AudioGuidePlayerProps> = ({
  site,
  selectedLanguage,
  onLanguageChange,
  autoPlayOnOpen = false,
  compact = false,
}) => {
  const [playState, setPlayState] = useState<SpeechPlayState>('idle');
  const [activeSegment, setActiveSegment] = useState<number>(0);
  const [speechRate, setSpeechRate] = useState<SpeechRate>(1.0);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const localized = site.translations[selectedLanguage] || site.translations.vi;
  const segments = localized.audioScript;

  const startSpeaking = useCallback(
    (
      index: number,
      lang: SupportedLanguage = selectedLanguage,
      rate: SpeechRate = speechRate
    ) => {
      setSpeechError(null);
      const script = (site.translations[lang] || site.translations.vi)
        .audioScript;
      if (!script.length) return;

      const clampedIndex = Math.max(0, Math.min(index, script.length - 1));
      setActiveSegment(clampedIndex);

      speechService.speakScript(script, lang, rate, clampedIndex, {
        onSegmentChange: (idx) => {
          if (mountedRef.current) setActiveSegment(idx);
        },
        onStateChange: (st) => {
          if (mountedRef.current) setPlayState(st);
        },
        onEnd: () => {
          if (mountedRef.current) {
            setPlayState('idle');
            setActiveSegment(0);
          }
        },
        onError: (msg) => {
          if (mountedRef.current) {
            setSpeechError(msg);
          }
        },
      });
    },
    [site, selectedLanguage, speechRate]
  );

  useEffect(() => {
    mountedRef.current = true;
    speechService.stop();
    setPlayState('idle');
    setActiveSegment(0);
    setSpeechError(null);

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
    setSpeechError(null);
  };

  const handleLanguageSwitch = (lang: SupportedLanguage) => {
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

  const handleRateChange = (nextRate: SpeechRate) => {
    setSpeechRate(nextRate);
    if (playState === 'playing') {
      speechService.setRate(nextRate);
    }
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

  const progressPercent =
    segments.length > 0
      ? Math.min(
          100,
          Math.round(((safeActiveSegment + 1) / segments.length) * 100)
        )
      : 0;

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <View
            style={[
              styles.iconBadge,
              playState === 'playing' && styles.iconBadgePlaying,
            ]}
          >
            <Volume2
              size={16}
              color={playState === 'playing' ? COLORS.white : COLORS.ink}
            />
          </View>
          <View style={styles.titleTextWrap}>
            <View style={styles.titleTopLine}>
              <Text style={styles.headerTitle}>Thuyết minh âm thanh</Text>
              <Text style={styles.segmentCounter}>
                Đoạn {segments.length > 0 ? safeActiveSegment + 1 : 0}/
                {segments.length}
              </Text>
            </View>
            <Text style={styles.siteSubtitle} numberOfLines={1}>
              {localized.name}
            </Text>
          </View>
        </View>
      </View>

      {/* Language Selector (5 languages: VI, EN, FR, ZH, JA) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.langRow}
      >
        {SUPPORTED_LANGUAGES.map((lang) => {
          const active = selectedLanguage === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              onPress={() => handleLanguageSwitch(lang.code)}
              style={[styles.langPill, active && styles.langPillActive]}
              activeOpacity={0.75}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text
                style={[styles.langLabel, active && styles.langLabelActive]}
              >
                {lang.code.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Progress Bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercent}%`,
                backgroundColor:
                  playState === 'playing' ? COLORS.accent : COLORS.ink,
              },
            ]}
          />
        </View>
        <Text style={styles.progressPct}>{progressPercent}%</Text>
      </View>

      {/* Transport Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          onPress={handleTogglePlay}
          style={[
            styles.playPrimaryBtn,
            playState === 'playing' && styles.playPrimaryBtnActive,
          ]}
          activeOpacity={0.8}
        >
          {playState === 'playing' ? (
            <>
              <Pause size={15} color={COLORS.white} />
              <Text style={styles.playPrimaryText}>Tạm dừng</Text>
            </>
          ) : (
            <>
              <Play size={15} color={COLORS.white} fill={COLORS.white} />
              <Text style={styles.playPrimaryText}>
                {playState === 'paused' ? 'Tiếp tục' : 'Nghe thuyết minh'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.stepControls}>
          <TouchableOpacity
            onPress={() => handleStepSegment(-1)}
            disabled={safeActiveSegment === 0}
            style={[
              styles.iconControlBtn,
              safeActiveSegment === 0 && styles.iconControlBtnDisabled,
            ]}
            accessibilityLabel="Đoạn trước"
            activeOpacity={0.7}
          >
            <SkipBack size={15} color={COLORS.ink} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleStepSegment(1)}
            disabled={safeActiveSegment >= segments.length - 1}
            style={[
              styles.iconControlBtn,
              safeActiveSegment >= segments.length - 1 &&
                styles.iconControlBtnDisabled,
            ]}
            accessibilityLabel="Đoạn tiếp theo"
            activeOpacity={0.7}
          >
            <SkipForward size={15} color={COLORS.ink} />
          </TouchableOpacity>

          {playState !== 'idle' && (
            <TouchableOpacity
              onPress={handleStop}
              style={styles.iconControlBtn}
              accessibilityLabel="Dừng đọc"
              activeOpacity={0.7}
            >
              <Square size={14} color={COLORS.accent} fill={COLORS.accent} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Speed Selector: 0.75x, 1.0x, 1.25x, 1.5x */}
      <View style={styles.rateRow}>
        <Text style={styles.rateLabel}>Tốc độ đọc:</Text>
        <View style={styles.rateChips}>
          {SPEECH_RATES.map((rate) => {
            const active = speechRate === rate;
            return (
              <TouchableOpacity
                key={rate}
                onPress={() => handleRateChange(rate)}
                style={[styles.rateChip, active && styles.rateChipActive]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.rateChipText,
                    active && styles.rateChipTextActive,
                  ]}
                >
                  {rate}x
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {speechError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{speechError}</Text>
        </View>
      ) : null}

      {/* Synchronized Highlighted Transcript Segments */}
      {!compact && segments.length > 0 && (
        <View style={styles.transcriptWrap}>
          <Text style={styles.transcriptHeading}>
            Nội dung đồng bộ (chạm để nghe từ đoạn bất kỳ)
          </Text>
          <View style={styles.transcriptList}>
            {segments.map((segment, idx) => {
              const isCurrent = idx === safeActiveSegment;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => startSpeaking(idx, selectedLanguage, speechRate)}
                  style={[
                    styles.segmentCard,
                    isCurrent && styles.segmentCardActive,
                  ]}
                  activeOpacity={0.75}
                >
                  <View style={styles.segmentIndexWrap}>
                    <Text
                      style={[
                        styles.segmentIndex,
                        isCurrent && styles.segmentIndexActive,
                      ]}
                    >
                      {idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`}
                    </Text>
                  </View>
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
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm + 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
    flex: 1,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgePlaying: {
    backgroundColor: COLORS.accent,
  },
  titleTextWrap: {
    flex: 1,
    gap: 2,
  },
  titleTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  segmentCounter: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  siteSubtitle: {
    fontSize: 12,
    color: COLORS.inkSecondary,
  },
  langRow: {
    gap: 6,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  langPillActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  langFlag: {
    fontSize: 13,
  },
  langLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.inkSecondary,
  },
  langLabelActive: {
    color: COLORS.white,
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADII.pill,
  },
  progressPct: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.inkMuted,
    width: 30,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  playPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.md,
    backgroundColor: COLORS.ink,
  },
  playPrimaryBtnActive: {
    backgroundColor: COLORS.accent,
  },
  playPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  stepControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconControlBtn: {
    width: 38,
    height: 38,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconControlBtnDisabled: {
    opacity: 0.35,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  rateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  rateChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rateChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADII.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  rateChipActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  rateChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkSecondary,
    fontVariant: ['tabular-nums'],
  },
  rateChipTextActive: {
    color: COLORS.white,
  },
  errorBox: {
    backgroundColor: COLORS.amberBg,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    borderRadius: RADII.sm,
    padding: SPACING.sm,
  },
  errorText: {
    fontSize: 11,
    color: COLORS.ink,
  },
  transcriptWrap: {
    gap: SPACING.xs + 2,
    paddingTop: 2,
  },
  transcriptHeading: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  transcriptList: {
    gap: 6,
  },
  segmentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADII.md,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  segmentCardActive: {
    borderLeftColor: COLORS.accent,
    backgroundColor: COLORS.surface,
  },
  segmentIndexWrap: {
    paddingTop: 2,
  },
  segmentIndex: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.inkMuted,
    fontVariant: ['tabular-nums'],
  },
  segmentIndexActive: {
    color: COLORS.accent,
  },
  segmentText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.inkSecondary,
  },
  segmentTextActive: {
    color: COLORS.ink,
    fontWeight: '500',
  },
});
