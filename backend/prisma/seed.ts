/**
 * Prisma Idempotent Database Seeder — Smart Heritage Guide Backend
 *
 * Tự động nạp toàn bộ dữ liệu chuẩn vào Supabase PostgreSQL (dùng chung backend/.env):
 * - Tất cả 50 Di sản, Di tích & Điểm tham quan TP. Hồ Chí Minh (5 ngôn ngữ: vi, en, fr, zh, ja)
 * - Toàn bộ quán ăn đặc sản quanh từng di tích
 * - Các mảnh tri thức RAG đa ngôn ngữ (summary, architecture, script, restaurant)
 * - 6 Huy hiệu thành tựu tự động
 * - 2 tài khoản mẫu (Admin & Demo Explorer) để test ngay Leaderboard & Check-in
 *
 * Chạy từ thư mục `backend/`: npm run db:seed
 */

import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { HERITAGE_SITES } from '../../mobile/src/data/heritageSites';

const prisma = new PrismaClient();

const BADGE_DEFINITIONS = [
  {
    code: 'first_step',
    titleVi: 'Bước Chân Đầu Tiên',
    titleEn: 'First Step',
    descriptionVi:
      'Hoàn thành hành trình đi bộ và check-in được xác thực GPS đầu tiên.',
    iconName: 'footprints',
    ruleConfig: { metric: 'verified_sites_count', threshold: 1 },
  },
  {
    code: 'district1_master',
    titleVi: 'Chinh Phục Quận 1',
    titleEn: 'District 1 Master',
    descriptionVi: 'Ghé thăm và check-in ít nhất 3 di tích lịch sử tại Quận 1.',
    iconName: 'landmark',
    ruleConfig: {
      metric: 'district_sites_count',
      district: 'Quận 1',
      threshold: 3,
    },
  },
  {
    code: 'museum_lover',
    titleVi: 'Người Yêu Bảo Tàng',
    titleEn: 'Museum Lover',
    descriptionVi:
      'Khám phá ít nhất 2 bảo tàng lịch sử – văn hóa – mỹ thuật tại TP.HCM.',
    iconName: 'book-open',
    ruleConfig: {
      metric: 'category_sites_count',
      category: 'museum',
      threshold: 2,
    },
  },
  {
    code: 'heritage_photographer',
    titleVi: 'Nhiếp Ảnh Gia Di Sản',
    titleEn: 'Heritage Photographer',
    descriptionVi:
      'Chụp và lưu giữ ít nhất 3 bức ảnh hành trình tại các điểm di tích.',
    iconName: 'camera',
    ruleConfig: { metric: 'photos_count', threshold: 3 },
  },
  {
    code: 'walking_marathon',
    titleVi: 'Bước Chân Bền Bỉ',
    titleEn: 'Walking Marathon',
    descriptionVi:
      'Tích lũy tối thiểu 5.000 mét (5 km) đi bộ khám phá được xác thực.',
    iconName: 'flame',
    ruleConfig: { metric: 'verified_walking_meters', threshold: 5000 },
  },
  {
    code: 'saigon_explorer',
    titleVi: 'Nhà Thám Hiểm Sài Gòn',
    titleEn: 'Saigon Explorer',
    descriptionVi:
      'Chinh phục ít nhất 5 điểm di sản TP.HCM khác nhau được xác thực GPS.',
    iconName: 'compass',
    ruleConfig: { metric: 'verified_sites_count', threshold: 5 },
  },
];

function extractDistrict(city: string): string {
  const firstPart = city.split('·')[0]?.trim();
  return firstPart || city;
}

async function seedSitesAndRestaurants() {
  let restaurantCount = 0;
  let chunkCount = 0;

  for (const site of HERITAGE_SITES) {
    const district = extractDistrict(site.city);

    await prisma.heritageSite.upsert({
      where: { id: site.id },
      create: {
        id: site.id,
        city: site.city,
        district,
        lat: site.lat,
        lng: site.lng,
        category: site.category,
        unescoRecognized: Boolean(site.unescoRecognized),
        nationalSpecialMonument: Boolean(site.nationalSpecialMonument),
        rating: site.rating,
        reviewCount: site.reviewCount,
        ticketPrice: site.ticketPrice,
        address: site.address ?? null,
        coverImage: site.coverImage,
        recommendedVisitMinutes: 45,
        translations: site.translations as unknown as Prisma.InputJsonValue,
        mediaGallery: site.mediaGallery as unknown as Prisma.InputJsonValue,
      },
      update: {
        city: site.city,
        district,
        lat: site.lat,
        lng: site.lng,
        category: site.category,
        unescoRecognized: Boolean(site.unescoRecognized),
        nationalSpecialMonument: Boolean(site.nationalSpecialMonument),
        rating: site.rating,
        reviewCount: site.reviewCount,
        ticketPrice: site.ticketPrice,
        address: site.address ?? null,
        coverImage: site.coverImage,
        translations: site.translations as unknown as Prisma.InputJsonValue,
        mediaGallery: site.mediaGallery as unknown as Prisma.InputJsonValue,
      },
    });

    for (const res of site.nearbyRestaurants) {
      await prisma.restaurant.upsert({
        where: { id: res.id },
        create: {
          id: res.id,
          siteId: site.id,
          name: res.name,
          cuisine: res.cuisine,
          specialtyDishes: res.specialtyDishes as unknown as Prisma.InputJsonValue,
          rating: res.rating,
          reviewCount: res.reviewCount,
          priceRange: res.priceRange,
          lat: res.lat,
          lng: res.lng,
          address: res.address,
          openHours: res.openHours,
          mealSlots: ['lunch', 'dinner'],
          imageUrl: res.imageUrl,
        },
        update: {
          siteId: site.id,
          name: res.name,
          cuisine: res.cuisine,
          specialtyDishes: res.specialtyDishes as unknown as Prisma.InputJsonValue,
          rating: res.rating,
          reviewCount: res.reviewCount,
          priceRange: res.priceRange,
          lat: res.lat,
          lng: res.lng,
          address: res.address,
          openHours: res.openHours,
          imageUrl: res.imageUrl,
        },
      });
      restaurantCount += 1;
    }

    await prisma.heritageKnowledgeChunk.deleteMany({ where: { siteId: site.id } });

    const chunksToInsert: Prisma.HeritageKnowledgeChunkCreateManyInput[] = [];

    for (const [lang, t] of Object.entries(site.translations)) {
      if (!t) continue;

      chunksToInsert.push({
        siteId: site.id,
        language: lang,
        sourceType: 'summary',
        content: `${t.name} (${site.city}, ${t.historicalEra}). ${t.shortSummary} Giờ mở cửa: ${t.openingHours}. Giá vé: ${site.ticketPrice}.`,
      });

      if (t.architecturalHighlights.length > 0) {
        chunksToInsert.push({
          siteId: site.id,
          language: lang,
          sourceType: 'architecture',
          content: `Điểm nổi bật kiến trúc tại ${t.name}: ${t.architecturalHighlights.join('; ')}.`,
        });
      }

      if (t.audioScript.length > 0) {
        chunksToInsert.push({
          siteId: site.id,
          language: lang,
          sourceType: 'script',
          content: t.audioScript.join(' '),
        });
      }
    }

    if (site.nearbyRestaurants.length > 0) {
      const foodSummary = site.nearbyRestaurants
        .map(
          (r) =>
            `${r.name} (${r.cuisine}, ★${r.rating.toFixed(1)}, ${r.priceRange}) — món nổi bật: ${r.specialtyDishes.join(', ')}`
        )
        .join(' | ');
      chunksToInsert.push({
        siteId: site.id,
        language: 'vi',
        sourceType: 'restaurant',
        content: `Ẩm thực gần ${site.translations.vi.name}: ${foodSummary}`,
      });
    }

    if (chunksToInsert.length > 0) {
      await prisma.heritageKnowledgeChunk.createMany({ data: chunksToInsert });
      chunkCount += chunksToInsert.length;
    }
  }

  return {
    sitesCount: HERITAGE_SITES.length,
    restaurantCount,
    chunkCount,
  };
}

async function seedBadges() {
  for (const badge of BADGE_DEFINITIONS) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      create: {
        code: badge.code,
        titleVi: badge.titleVi,
        titleEn: badge.titleEn,
        descriptionVi: badge.descriptionVi,
        iconName: badge.iconName,
        ruleConfig: badge.ruleConfig as unknown as Prisma.InputJsonValue,
      },
      update: {
        titleVi: badge.titleVi,
        titleEn: badge.titleEn,
        descriptionVi: badge.descriptionVi,
        iconName: badge.iconName,
        ruleConfig: badge.ruleConfig as unknown as Prisma.InputJsonValue,
      },
    });
  }
  return BADGE_DEFINITIONS.length;
}

async function seedDemoProfiles() {
  const admin = await prisma.profile.upsert({
    where: { email: 'admin@smartheritage.vn' },
    create: {
      email: 'admin@smartheritage.vn',
      displayName: 'Quản trị Di sản TP.HCM',
      role: 'admin',
      preferredLanguage: 'vi',
      preferredCategories: ['monument', 'museum'],
    },
    update: {
      displayName: 'Quản trị Di sản TP.HCM',
      role: 'admin',
    },
  });

  const demo = await prisma.profile.upsert({
    where: { email: 'demo@smartheritage.vn' },
    create: {
      email: 'demo@smartheritage.vn',
      displayName: 'Nhà Thám Hiểm Sài Gòn',
      role: 'user',
      preferredLanguage: 'vi',
      preferredCategories: ['monument', 'museum', 'temple'],
      totalVerifiedWalkingSeconds: 1860,
      totalVerifiedWalkingMeters: 2350,
      verifiedSitesCount: 2,
    },
    update: {},
  });

  await prisma.userBadge.upsert({
    where: {
      userId_badgeCode: {
        userId: demo.id,
        badgeCode: 'first_step',
      },
    },
    create: {
      userId: demo.id,
      badgeCode: 'first_step',
    },
    update: {},
  });

  return { adminEmail: admin.email, demoEmail: demo.email };
}

async function main() {
  console.log('🏛️  Đang nạp dữ liệu Smart Heritage Guide bằng Prisma...');
  const { sitesCount, restaurantCount, chunkCount } =
    await seedSitesAndRestaurants();
  const badgesCount = await seedBadges();
  const profiles = await seedDemoProfiles();

  console.log(
    `✅ Hoàn tất seed Prisma: ${sitesCount} di sản, ${restaurantCount} quán ăn, ${chunkCount} mảnh RAG, ${badgesCount} huy hiệu, profiles: ${profiles.adminEmail}, ${profiles.demoEmail}`
  );
}

main()
  .catch((err) => {
    console.error('❌ Lỗi khi seed Prisma DB:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
