import React, { useEffect, useState } from 'react';
import {
  Volume2,
  Pause,
  Play,
  Square,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import {
  HeritageSite,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from '../types/heritage';
import { speechService } from '../services/speechService';

interface AudioGuidePlayerProps {
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
  const [playState, setPlayState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [activeParagraph, setActiveParagraph] = useState<number>(0);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  const localized = site.translations[selectedLanguage] || site.translations.vi;
  const paragraphs = localized.audioScript;

  useEffect(() => {
    speechService.stop();
    setPlayState('idle');
    setActiveParagraph(0);

    if (autoPlayOnOpen) {
      startSpeaking(0, selectedLanguage, speechRate);
    }

    return () => {
      speechService.stop();
    };
  }, [site.id]);

  const startSpeaking = (
    index: number,
    lang: SupportedLanguage = selectedLanguage,
    rate: number = speechRate
  ) => {
    const script = (site.translations[lang] || site.translations.vi).audioScript;
    speechService.speakScript(script, lang, rate, index, {
      onParagraphChange: (idx) => setActiveParagraph(idx),
      onStateChange: (st) => setPlayState(st),
      onComplete: () => {
        setPlayState('idle');
        setActiveParagraph(0);
      },
    });
  };

  const handleTogglePlay = () => {
    if (playState === 'idle') {
      startSpeaking(activeParagraph);
    } else if (playState === 'playing') {
      speechService.pause();
    } else {
      speechService.resume();
    }
  };

  const handleStop = () => {
    speechService.stop();
    setPlayState('idle');
    setActiveParagraph(0);
  };

  const handleLanguageSwitch = (lang: SupportedLanguage) => {
    onLanguageChange(lang);
    if (playState === 'playing' || playState === 'paused') {
      startSpeaking(activeParagraph, lang, speechRate);
    }
  };

  const handleRateChange = (nextRate: number) => {
    setSpeechRate(nextRate);
    if (playState === 'playing') {
      startSpeaking(activeParagraph, selectedLanguage, nextRate);
    }
  };

  const handleStepParagraph = (delta: number) => {
    const nextIdx = Math.max(0, Math.min(paragraphs.length - 1, activeParagraph + delta));
    setActiveParagraph(nextIdx);
    if (playState === 'playing') {
      startSpeaking(nextIdx);
    }
  };

  return (
    <div className="rounded-xl border border-[#E6E4DD] bg-[#FAF9F6] p-4">
      {/* Header & Language Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E4DD] pb-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              playState === 'playing'
                ? 'bg-[#B93815] text-white'
                : 'bg-[#E6E4DD]/70 text-[#141413]'
            }`}
          >
            <Volume2 className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-tight text-[#141413]">
                Thuyết minh âm thanh
              </span>
              <span className="text-[11px] text-[#8A877F] tabular-nums">
                Đoạn {activeParagraph + 1}/{paragraphs.length}
              </span>
            </div>
            <p className="text-xs text-[#57554F] line-clamp-1">{localized.name}</p>
          </div>
        </div>

        {/* Language Segmented Control */}
        <div
          className="inline-flex items-center rounded-lg border border-[#E6E4DD] bg-white p-0.5"
          role="group"
          aria-label="Chọn ngôn ngữ thuyết minh"
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const active = selectedLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageSwitch(lang.code)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[#141413] text-white'
                    : 'text-[#57554F] hover:text-[#141413]'
                }`}
              >
                {lang.nativeLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transport & Rate Controls */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium text-white transition-colors ${
              playState === 'playing'
                ? 'bg-[#B93815] hover:bg-[#9E2F11]'
                : 'bg-[#141413] hover:bg-[#2C2B29]'
            }`}
          >
            {playState === 'playing' ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>
                  {playState === 'paused' ? 'Tiếp tục' : 'Nghe thuyết minh'}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleStepParagraph(-1)}
            disabled={activeParagraph === 0}
            className="rounded-lg border border-[#E6E4DD] bg-white p-2 text-[#141413] hover:bg-[#F3F1EC] disabled:opacity-35"
            aria-label="Đoạn trước"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleStepParagraph(1)}
            disabled={activeParagraph >= paragraphs.length - 1}
            className="rounded-lg border border-[#E6E4DD] bg-white p-2 text-[#141413] hover:bg-[#F3F1EC] disabled:opacity-35"
            aria-label="Đoạn tiếp theo"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>

          {playState !== 'idle' && (
            <button
              type="button"
              onClick={handleStop}
              className="rounded-lg border border-[#E6E4DD] bg-white p-2 text-[#57554F] hover:bg-[#F3F1EC] hover:text-[#141413]"
              aria-label="Dừng đọc"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-[#8A877F] mr-1">Tốc độ</span>
          {[0.85, 1.0, 1.25].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRateChange(r)}
              className={`rounded-md px-2 py-1 font-medium tabular-nums transition-colors ${
                speechRate === r
                  ? 'bg-[#141413] text-white'
                  : 'bg-white text-[#57554F] border border-[#E6E4DD] hover:text-[#141413]'
              }`}
            >
              {r}x
            </button>
          ))}
        </div>
      </div>

      {/* Synchronized Transcript */}
      {!compact && (
        <div className="mt-3.5 space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {paragraphs.map((para, idx) => {
            const isCurrent = idx === activeParagraph;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveParagraph(idx);
                  startSpeaking(idx);
                }}
                className={`w-full text-left rounded-lg border-l-2 px-3 py-2.5 text-sm leading-relaxed transition-colors ${
                  isCurrent
                    ? 'border-[#B93815] bg-white font-medium text-[#141413] shadow-2xs'
                    : 'border-transparent text-[#57554F] hover:bg-white/60 hover:text-[#141413]'
                }`}
              >
                <span className="mr-2 text-[11px] font-semibold text-[#8A877F] tabular-nums">
                  0{idx + 1}
                </span>
                {para}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
