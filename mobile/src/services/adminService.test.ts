import { describe, expect, it } from 'vitest';
import {
  buildHeritageSiteFromForm,
  buildLocalFallbackTranslations,
  countCompleteLanguages,
  createEmptyLocalizedDrafts,
  extractLocalizedDraftsFromSite,
  getLanguageCompleteness,
} from './adminService';

describe('adminService 5-language site text helpers', () => {
  it('builds a full 5-language HeritageSite preserving every edited locale', () => {
    const drafts = createEmptyLocalizedDrafts();
    drafts.vi = {
      name: 'Bảo tàng Áo Dài',
      shortSummary: 'Không gian tôn vinh tà áo dài Việt Nam.',
      historicalEra: 'Thế kỷ XX – Hiện đại',
      openingHours: '08:30 – 17:30 Hàng ngày',
      architecturalHighlightsText: 'Nhà gỗ cổ\nHồ sen rộng',
      audioScriptText: 'Chào mừng đến Bảo tàng Áo Dài.\nKhám phá 300 năm lịch sử.',
    };
    drafts.en = {
      name: 'Ao Dai Museum',
      shortSummary: 'A museum celebrating Vietnam traditional dress.',
      historicalEra: '20th Century – Present',
      openingHours: '08:30 – 17:30 Daily',
      architecturalHighlightsText: 'Wooden house\nLotus pond',
      audioScriptText: 'Welcome to the Ao Dai Museum.',
    };
    drafts.fr = {
      name: "Musée de l'Áo Dài",
      shortSummary: 'Un musée dédié à la tunique traditionnelle.',
      historicalEra: 'XXe siècle',
      openingHours: '08h30 – 17h30 Tous les jours',
      architecturalHighlightsText: 'Maison en bois',
      audioScriptText: "Bienvenue au Musée de l'Áo Dài.",
    };
    drafts.zh = {
      name: '奥黛博物馆',
      shortSummary: '展示越南传统奥黛文化的博物馆。',
      historicalEra: '20世纪至今',
      openingHours: '08:30 – 17:30 每日开放',
      architecturalHighlightsText: '传统木屋',
      audioScriptText: '欢迎来到奥黛博物馆。',
    };
    drafts.ja = {
      name: 'アオザイ博物館',
      shortSummary: 'ベトナムの伝統衣装アオザイを紹介する博物館。',
      historicalEra: '20世紀〜現代',
      openingHours: '08:30 – 17:30 毎日',
      architecturalHighlightsText: '伝統的な木造建築',
      audioScriptText: 'アオザイ博物館へようこそ。',
    };

    expect(countCompleteLanguages(drafts)).toBe(5);

    const site = buildHeritageSiteFromForm({
      id: 'bao-tang-ao-dai',
      city: 'TP. Thủ Đức · TP.HCM',
      district: 'TP. Thủ Đức',
      address: '206/19/30 Long Thuận',
      lat: 10.808,
      lng: 106.84,
      category: 'museum',
      ticketPrice: '100.000đ',
      coverImage: 'https://example.com/aodai.jpg',
      rating: 4.8,
      nationalSpecialMonument: false,
      unescoRecognized: false,
      translations: drafts,
    });

    expect(site.translations.vi.name).toBe('Bảo tàng Áo Dài');
    expect(site.translations.en.name).toBe('Ao Dai Museum');
    expect(site.translations.fr.name).toBe("Musée de l'Áo Dài");
    expect(site.translations.zh.name).toBe('奥黛博物馆');
    expect(site.translations.ja.name).toBe('アオザイ博物館');
    expect(site.translations.vi.audioScript).toHaveLength(2);
    expect(site.mediaGallery[0].caption.ja).toBe('アオザイ博物館');
    expect(site.mediaGallery[0].caption.zh).toBe('奥黛博物馆');

    const roundTrip = extractLocalizedDraftsFromSite(site);
    expect(roundTrip.fr.name).toBe("Musée de l'Áo Dài");
    expect(roundTrip.ja.audioScriptText).toContain('アオザイ博物館');
  });

  it('tracks empty, partial, and complete statuses accurately', () => {
    const drafts = createEmptyLocalizedDrafts();
    expect(getLanguageCompleteness(drafts.fr)).toBe('empty');

    drafts.fr.name = 'Palais';
    expect(getLanguageCompleteness(drafts.fr)).toBe('partial');

    drafts.fr.shortSummary = 'Résumé historique.';
    drafts.fr.audioScriptText = 'Bienvenue au Palais.';
    expect(getLanguageCompleteness(drafts.fr)).toBe('complete');
  });

  it('creates clean offline fallback translations for all 4 remaining locales', () => {
    const drafts = createEmptyLocalizedDrafts();
    drafts.vi = {
      name: 'Chùa Bửu Long',
      shortSummary: 'Ngôi chùa nổi tiếng với bảo tháp vàng rực rỡ.',
      historicalEra: 'Thế kỷ XX – Hiện đại',
      openingHours: '08:00 – 18:00 Hàng ngày',
      architecturalHighlightsText: 'Bảo tháp Gotama Cetiya',
      audioScriptText: 'Chào mừng đến Chùa Bửu Long.',
    };

    const generated = buildLocalFallbackTranslations(
      'vi',
      drafts.vi,
      'TP. Thủ Đức · TP.HCM',
      '81 Nguyễn Xiển'
    );
    expect(Object.keys(generated).sort()).toEqual(['en', 'fr', 'ja', 'zh']);
    expect(generated.en?.openingHours).toContain('Daily');
    expect(generated.fr?.openingHours).toContain('Tous les jours');
    expect(generated.zh?.openingHours).toContain('每日开放');
    expect(generated.ja?.openingHours).toContain('毎日');
  });
});
