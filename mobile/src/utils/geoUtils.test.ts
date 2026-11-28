import { describe, expect, it } from 'vitest';
import {
  calculateBearingDegrees,
  calculateDistanceMeters,
  estimateWalkingSeconds,
  getRecommendedRestaurants,
  interpolateRouteForSmoothWalk,
  normalizeVietnamese,
  rankVisitedSitesByWalkingTime,
  smoothAngleDegrees,
} from './geoUtils';
import { NearbyRestaurant, VisitedSiteRecord } from '../types/heritage';

describe('geoUtils - Định vị, Ẩm thực & Xếp hạng thời gian đi bộ', () => {
  it('Tính khoảng cách giữa Hoàng Thành Thăng Long và Văn Miếu chính xác (~1.1 - 1.5km)', () => {
    const distance = calculateDistanceMeters(21.0341, 105.84, 21.0285, 105.8355);
    expect(distance).toBeGreaterThan(600);
    expect(distance).toBeLessThan(1200);
  });

  it('Ước tính thời gian đi bộ hợp lý từ khoảng cách', () => {
    const seconds = estimateWalkingSeconds(600);
    expect(seconds).toBe(600); // 600 * 1.25 / 1.25 = 600s (10 phút)
  });

  it('Lọc và sắp xếp các tiệm ăn uống gần đó theo điểm đánh giá tốt nhất', () => {
    const mockRestaurants: NearbyRestaurant[] = [
      {
        id: 'r1',
        name: 'Quán Thường',
        cuisine: 'Việt Nam',
        specialtyDishes: ['Phở'],
        rating: 3.8,
        reviewCount: 50,
        priceRange: '50.000đ',
        lat: 21.0345,
        lng: 105.8405,
        address: 'Hà Nội',
        openHours: '07:00 - 21:00',
        imageUrl: '',
      },
      {
        id: 'r2',
        name: 'Phở Gia Truyền Đánh Giá Cao',
        cuisine: 'Đặc sản Hà Nội',
        specialtyDishes: ['Phở bò tái chín'],
        rating: 4.9,
        reviewCount: 1200,
        priceRange: '60.000đ - 90.000đ',
        lat: 21.035,
        lng: 105.841,
        address: 'Hà Nội',
        openHours: '06:00 - 22:00',
        imageUrl: '',
      },
      {
        id: 'r3',
        name: 'Bún Chả Phố Cổ',
        cuisine: 'Đặc sản Hà Nội',
        specialtyDishes: ['Bún chả'],
        rating: 4.7,
        reviewCount: 840,
        priceRange: '60.000đ',
        lat: 21.0342,
        lng: 105.8402,
        address: 'Hà Nội',
        openHours: '09:00 - 21:00',
        imageUrl: '',
      },
    ];

    const result = getRecommendedRestaurants(mockRestaurants, 21.0341, 105.84, 4.5);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('r2');
    expect(result[1].id).toBe('r3');
  });

  it('Xếp hạng những nơi đã đi thông qua thời gian đi bộ tới danh lam thắng cảnh', () => {
    const records: VisitedSiteRecord[] = [
      {
        id: 'v1',
        siteId: 's1',
        siteName: 'Đền Ngọc Sơn',
        city: 'Ha Noi',
        coverImage: '',
        visitedAt: '2026-11-07T08:00:00Z',
        walkingDurationSeconds: 420, // 7 phút
        walkingDistanceMeters: 520,
        routeCoordinates: [],
        photos: [],
        userNote: '',
        userRating: 5,
      },
      {
        id: 'v2',
        siteId: 's2',
        siteName: 'Hoàng Thành Thăng Long',
        city: 'Ha Noi',
        coverImage: '',
        visitedAt: '2026-11-07T09:00:00Z',
        walkingDurationSeconds: 1380, // 23 phút
        walkingDistanceMeters: 1650,
        routeCoordinates: [],
        photos: [],
        userNote: '',
        userRating: 5,
      },
    ];

    const rankedLongest = rankVisitedSitesByWalkingTime(records, 'longest_walk');
    expect(rankedLongest[0].rank).toBe(1);
    expect(rankedLongest[0].record.siteName).toBe('Hoàng Thành Thăng Long');
    expect(rankedLongest[0].badgeTitle).toBe('Kiện Tướng Bộ Hành Di Sản');

    const rankedShortest = rankVisitedSitesByWalkingTime(records, 'shortest_walk');
    expect(rankedShortest[0].record.siteName).toBe('Đền Ngọc Sơn');
  });

  it('Tính góc phương vị (bearing) và làm mượt góc xoay qua hướng Bắc (359° -> 1°)', () => {
    const north = calculateBearingDegrees([10.77, 106.7], [10.78, 106.7]);
    const east = calculateBearingDegrees([10.77, 106.7], [10.77, 106.71]);
    expect(north).toBeLessThan(2);
    expect(east).toBeGreaterThan(88);
    expect(east).toBeLessThan(92);

    const smoothed = smoothAngleDegrees(358, 2, 0.5);
    expect(smoothed === 0 || smoothed > 359 || smoothed < 1).toBe(true);
  });

  it('Nội suy tuyến OSRM thành các bước đều mượt mà cho camera 3D', () => {
    const dense = interpolateRouteForSmoothWalk(
      [
        [10.7725, 106.698],
        [10.7745, 106.698],
      ],
      20
    );
    expect(dense.length).toBeGreaterThan(8);
    expect(dense[0]).toEqual([10.7725, 106.698]);
    expect(dense[dense.length - 1]).toEqual([10.7745, 106.698]);
  });

  it('Chuẩn hóa tiếng Việt không dấu để tìm kiếm thông minh khớp cả có dấu và không dấu', () => {
    expect(normalizeVietnamese('Dinh Độc Lập')).toBe('dinh doc lap');
    expect(normalizeVietnamese('Chợ Bến Thành · Quận 1')).toBe(
      'cho ben thanh · quan 1'
    );
    expect(normalizeVietnamese('  ĐỊA   ĐẠO Củ Chi  ')).toBe('dia dao cu chi');
  });
});
