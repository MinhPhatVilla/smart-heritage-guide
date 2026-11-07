import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  X,
  Footprints,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { CapturedPhoto, HeritageSite } from '../types/heritage';
import { formatWalkingDuration } from '../utils/geoUtils';

interface PhotoCaptureModalProps {
  site: HeritageSite;
  walkingDurationSeconds: number;
  walkingDistanceMeters: number;
  onClose: () => void;
  onSaveCheckIn: (data: {
    photo: CapturedPhoto;
    userNote: string;
    userRating: number;
    walkingDurationSeconds: number;
    walkingDistanceMeters: number;
  }) => void;
}

export const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({
  site,
  walkingDurationSeconds,
  walkingDistanceMeters,
  onClose,
  onSaveCheckIn,
}) => {
  const [previewDataUrl, setPreviewDataUrl] = useState<string>(site.coverImage);
  const [caption, setCaption] = useState<string>(
    `Check-in kỷ niệm tại ${site.translations.vi.name}`
  );
  const [userNote, setUserNote] = useState<string>(
    `Hành trình đi bộ tuyệt vời đến ${site.translations.vi.name}!`
  );
  const [userRating, setUserRating] = useState<number>(5);
  const [customMinutes, setCustomMinutes] = useState<number>(
    Math.max(5, Math.round(walkingDurationSeconds / 60))
  );
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      setCameraError(
        'Không thể truy cập Camera trực tiếp trên thiết bị này. Bạn có thể tải ảnh từ máy hoặc tạo ảnh đóng dấu tem di sản!'
      );
    }
  };

  const captureFromWebcam = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 800;
    canvas.height = videoRef.current.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    stampCanvasOverlay(ctx, canvas.width, canvas.height);
    setPreviewDataUrl(canvas.toDataURL('image/jpeg', 0.85));
    stopCamera();
  };

  const stampCanvasOverlay = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.fillStyle = 'rgba(28, 25, 23, 0.72)';
    ctx.fillRect(0, height - 88, width, 88);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`🏛️ ${site.translations.vi.name}`, 20, height - 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = '15px sans-serif';
    ctx.fillText(
      `🚶 Đi bộ: ${customMinutes} phút • 📍 GPS: ${site.lat.toFixed(4)}, ${site.lng.toFixed(4)} • 📅 ${new Date().toLocaleDateString('vi-VN')}`,
      20,
      height - 22
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const generateStampedPostcard = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 800, 500);
    grad.addColorStop(0, '#7f1d1d');
    grad.addColorStop(0.6, '#991b1b');
    grad.addColorStop(1, '#b45309');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 500);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, 752, 452);

    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('CHỨNG NHẬN CHECK-IN DI SẢN VIỆT NAM', 60, 95);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(site.translations.vi.name, 60, 165);

    ctx.fillStyle = '#fde68a';
    ctx.font = '20px sans-serif';
    ctx.fillText(
      `Thời gian đi bộ chinh phục: ${customMinutes} phút (${walkingDistanceMeters}m)`,
      60,
      235
    );
    ctx.fillText(
      `Tọa độ Di tích: ${site.lat.toFixed(4)}°N, ${site.lng.toFixed(4)}°E`,
      60,
      280
    );
    ctx.fillText(
      `Thời điểm lưu dấu: ${new Date().toLocaleString('vi-VN')}`,
      60,
      325
    );

    stampCanvasOverlay(ctx, 800, 500);
    setPreviewDataUrl(canvas.toDataURL('image/jpeg', 0.9));
  };

  const handleConfirmSave = () => {
    const finalSeconds = Math.max(60, customMinutes * 60);
    const photo: CapturedPhoto = {
      id: `photo-${Date.now()}`,
      siteId: site.id,
      siteName: site.translations.vi.name,
      dataUrl: previewDataUrl,
      takenAt: new Date().toISOString(),
      caption,
      lat: site.lat,
      lng: site.lng,
      walkingDurationSecondsAtCapture: finalSeconds,
    };

    onSaveCheckIn({
      photo,
      userNote,
      userRating,
      walkingDurationSeconds: finalSeconds,
      walkingDistanceMeters: Math.max(100, Math.round(finalSeconds * 1.25)),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs">
      <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
              <Camera className="h-3.5 w-3.5" /> Lưu ảnh tại Di tích & Xếp hạng Đi bộ
            </span>
            <h3 className="mt-1 text-lg font-bold text-stone-900">
              {site.translations.vi.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-500 hover:bg-stone-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Khung Camera hoặc Ảnh xem trước */}
        <div className="mt-4">
          {cameraActive ? (
            <div className="relative overflow-hidden rounded-2xl bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-64 w-full object-cover"
              />
              <div className="absolute bottom-3 inset-x-0 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={captureFromWebcam}
                  className="inline-flex items-center gap-2 rounded-full bg-red-700 px-5 py-2 text-sm font-bold text-white shadow-lg hover:bg-red-800"
                >
                  <Camera className="h-4 w-4" /> Chụp ngay
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="rounded-full bg-stone-800/80 px-4 py-2 text-xs font-medium text-white"
                >
                  Hủy Camera
                </button>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
              <img
                src={previewDataUrl}
                alt={site.translations.vi.name}
                className="h-56 w-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                    <MapPin className="h-3.5 w-3.5" /> {site.translations.vi.name}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Footprints className="h-3.5 w-3.5 text-emerald-300" />
                    {formatWalkingDuration(customMinutes * 60)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {cameraError && (
            <p className="mt-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200">
              {cameraError}
            </p>
          )}

          {/* Các nút chọn nguồn ảnh */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startCamera}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              <Camera className="h-4 w-4 text-red-700" /> Mở Camera Chụp ảnh
            </button>

            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50">
              <Upload className="h-4 w-4 text-amber-700" /> Tải ảnh từ thiết bị
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={generateStampedPostcard}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
            >
              <Sparkles className="h-4 w-4 text-amber-700" /> Tạo Thẻ Dấu Mộc Di Sản
            </button>
          </div>
        </div>

        {/* Thông số thời gian đi bộ & ghi chú */}
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-3.5">
            <label className="flex items-center justify-between text-xs font-bold text-emerald-900">
              <span className="inline-flex items-center gap-1.5">
                <Footprints className="h-4 w-4 text-emerald-700" />
                Thời gian đi bộ tới danh lam thắng cảnh (phút):
              </span>
              <span className="rounded-lg bg-emerald-700 px-2 py-0.5 text-white">
                {customMinutes} phút (~{Math.round(customMinutes * 75)}m)
              </span>
            </label>
            <input
              type="range"
              min={2}
              max={60}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-700"
            />
            <p className="mt-1 text-[11px] text-emerald-700">
              * Thời gian đi bộ này được dùng để xếp hạng mức độ chinh phục di tích trong Nhật ký Hành trình của bạn.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700">
              Chú thích bức ảnh tại di tích
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700">
              Nhật ký cảm nhận hành trình
            </label>
            <textarea
              rows={2}
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-stone-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleConfirmSave}
            className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-900"
          >
            <CheckCircle2 className="h-4 w-4" />
            Lưu Ảnh & Ghi Nhận Xếp Hạng Đi Bộ
          </button>
        </div>
      </div>
    </div>
  );
};
