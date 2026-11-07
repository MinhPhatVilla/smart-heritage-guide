import React, { useEffect, useState } from 'react';
import {
  Volume2,
  Pause,
  Play,
  Square,
  SkipBack,
  SkipForward,
  Globe,
  Sparkles,
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
    <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/60 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-3">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              playState === 'playing'
                ? 'animate-pulse bg-red-700 text-white'
                : 'bg-amber-100 text-red-800'
            }`}
          >
            <Volume2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-wider text-red-800 uppercase">
                Thuyết minh Giọng nói Đa ngôn ngữ
              </span>
              {playState === 'playing' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                  <Sparkles className="h-3 w-3" /> Đang đọc
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600">{localized.name}</p>
          </div>
        </div>

        {/* Bộ chọn 5 ngôn ngữ */}
        <div className="flex flex-wrap items-center gap-1">
          <Globe className="mr-1 h-4 w-4 text-stone-500" />
          {SUPPORTED_LANGUAGES.map((lang) => {
            const active = selectedLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageSwitch(lang.code)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  active
                    ? 'bg-red-800 text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-amber-100 border border-stone-200'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Điều khiển phát âm thanh */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleStepParagraph(-1)}
            disabled={activeParagraph === 0}
            className="rounded-lg border border-stone-200 bg-white p-2 text-stone-700 hover:bg-stone-100 disabled:opacity-40"
            title="Đoạn trước"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-900 transition"
          >
            {playState === 'playing' ? (
              <>
                <Pause className="h-4 w-4" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>
                  {playState === 'paused' ? 'Tiếp tục nghe' : 'Phát thuyết minh'}
                </span>
              </>
            )}
          </button>

          {playState !== 'idle' && (
            <button
              type="button"
              onClick={handleStop}
              className="rounded-lg border border-stone-200 bg-white p-2 text-stone-700 hover:bg-stone-100"
              title="Dừng hẳn"
            >
              <Square className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleStepParagraph(1)}
            disabled={activeParagraph >= paragraphs.length - 1}
            className="rounded-lg border border-stone-200 bg-white p-2 text-stone-700 hover:bg-stone-100 disabled:opacity-40"
            title="Đoạn tiếp theo"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        {/* Tốc độ giọng đọc */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-stone-500">Tốc độ:</span>
          {[0.85, 1.0, 1.25].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRateChange(r)}
              className={`rounded-md px-2 py-0.5 font-medium ${
                speechRate === r
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              {r}x
            </button>
          ))}
        </div>
      </div>

      {/* Phụ đề đồng bộ theo từng câu thuyết minh */}
      {!compact && (
        <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
          {paragraphs.map((para, idx) => {
            const isCurrent = idx === activeParagraph;
            return (
              <div
                key={idx}
                onClick={() => {
                  setActiveParagraph(idx);
                  startSpeaking(idx);
                }}
                className={`cursor-pointer rounded-xl p-2.5 text-sm leading-relaxed transition ${
                  isCurrent
                    ? 'border border-amber-400 bg-amber-100/80 font-medium text-stone-900 shadow-2xs'
                    : 'bg-white/70 text-stone-600 hover:bg-white'
                }`}
              >
                <span className="mr-2 inline-block rounded-md bg-stone-200/80 px-1.5 py-0.5 text-[11px] font-bold text-stone-700">
                  #{idx + 1}
                </span>
                {para}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
