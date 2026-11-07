import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Upload,
  Check,
  X,
  Footprints,
  MapPin,
  Stamp,
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
    `Check-in tại ${site.translations.vi.name}`
  );
  const [userNote, setUserNote] = useState<string>(
    `Đi bộ khám phá và lưu ảnh tại ${site.translations.vi.name}.`
  );
  const [customMinutes, setCustomMinutes] = useState<number>(
    Math.max(5, Math.round(walkingDurationSeconds / 60))
  );
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
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
        'Thiết bị hiện không mở được Camera trực tiếp. Bạn có thể tải ảnh từ máy hoặc đóng dấu tem bưu thiếp.'
      );
    }
  };

  const stampCanvasOverlay = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.fillStyle = 'rgba(20, 20, 19, 0.78)';
    ctx.fillRect(0, height - 80, width, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 20px Inter, sans-serif';
    ctx.fillText(site.translations.vi.name, 24, height - 46);

    ctx.fillStyle = '#d6d3cd';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(
      `Đi bộ ${customMinutes} phút · ${site.lat.toFixed(4)}°N, ${site.lng.toFixed(4)}°E · ${new Date().toLocaleDateString('vi-VN')}`,
      24,
      height - 20
    );
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
    setPreviewDataUrl(canvas.toDataURL('image/jpeg', 0.88));
    stopCamera();
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
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#141413';
    ctx.fillRect(0, 0, 800, 480);

    ctx.strokeStyle = '#57554f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(24, 24, 752, 432);

    ctx.fillStyle = '#8a877f';
    ctx.font = '600 13px Inter, sans-serif';
    ctx.fillText('SMART HERITAGE GUIDE · DẤU MỘC HÀNH TRÌNH', 52, 76);

    ctx.fillStyle = '#faf9f6';
    ctx.font = '600 32px Georgia, serif';
    ctx.fillText(site.translations.vi.name, 52, 136);

    ctx.fillStyle = '#d6d3cd';
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText(
      `Thời gian đi bộ: ${customMinutes} phút (~${Math.max(walkingDistanceMeters, customMinutes * 75)}m)`,
      52,
      200
    );
    ctx.fillText(
      `Tọa độ: ${site.lat.toFixed(4)}°N, ${site.lng.toFixed(4)}°E`,
      52,
      236
    );
    ctx.fillText(
      `Ghi nhận: ${new Date().toLocaleString('vi-VN')}`,
      52,
      272
    );

    stampCanvasOverlay(ctx, 800, 480);
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
      userRating: 5,
      walkingDurationSeconds: finalSeconds,
      walkingDistanceMeters: Math.max(100, Math.round(finalSeconds * 1.25)),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E6E4DD] bg-white p-5 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#E6E4DD] pb-3.5">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A877F]">
              Lưu ảnh & Ghi nhận Hành trình
            </span>
            <h3 className="mt-0.5 font-serif-editorial text-xl font-semibold text-[#141413]">
              {site.translations.vi.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8A877F] hover:bg-[#F3F1EC] hover:text-[#141413]"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Camera / Image Preview */}
        <div className="mt-4">
          {cameraActive ? (
            <div className="relative overflow-hidden rounded-xl bg-[#141413]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-56 w-full object-cover"
              />
              <div className="absolute bottom-3 inset-x-0 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={captureFromWebcam}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#141413] shadow-md"
                >
                  <Camera className="h-3.5 w-3.5" /> Chụp ảnh
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="rounded-lg bg-[#141413]/80 px-3 py-2 text-xs font-medium text-white"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-[#E6E4DD] bg-[#F3F1EC]">
              <img
                src={previewDataUrl}
                alt={site.translations.vi.name}
                className="h-52 w-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#141413]/85 via-[#141413]/40 to-transparent p-3 text-white">
                <div className="flex items-center justify-between text-xs tabular-nums">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <MapPin className="h-3.5 w-3.5" /> {site.translations.vi.name}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Footprints className="h-3.5 w-3.5" />
                    {formatWalkingDuration(customMinutes * 60)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {cameraError && (
            <p className="mt-2 rounded-lg border border-[#E6E4DD] bg-[#FAF9F6] p-2.5 text-xs text-[#57554F]">
              {cameraError}
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startCamera}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6E4DD] bg-white px-3 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#FAF9F6]"
            >
              <Camera className="h-3.5 w-3.5" /> Mở Camera
            </button>

            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E6E4DD] bg-white px-3 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#FAF9F6]">
              <Upload className="h-3.5 w-3.5" /> Chọn ảnh từ máy
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E6E4DD] bg-[#FAF9F6] px-3 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#F3F1EC]"
            >
              <Stamp className="h-3.5 w-3.5" /> Đóng dấu bưu thiếp
            </button>
          </div>
        </div>

        {/* Walking Duration & Note Inputs */}
        <div className="mt-4 space-y-3.5">
          <div className="rounded-xl border border-[#E6E4DD] bg-[#FAF9F6] p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#141413]">
                Thời gian đi bộ tới điểm di tích
              </span>
              <span className="font-semibold text-[#141413] tabular-nums">
                {customMinutes} phút (~{Math.round(customMinutes * 75)}m)
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={60}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Number(e.target.value))}
              className="mt-2 w-full accent-[#141413]"
            />
            <p className="mt-1 text-[11px] text-[#8A877F]">
              Dùng để xếp hạng các điểm đã đi trong Sổ tay Hành trình của bạn.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#57554F]">
              Chú thích ảnh
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E6E4DD] bg-white px-3 py-2 text-sm text-[#141413] focus:border-[#141413] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#57554F]">
              Ghi chú cảm nhận
            </label>
            <textarea
              rows={2}
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E6E4DD] bg-white px-3 py-2 text-sm text-[#141413] focus:border-[#141413] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#E6E4DD] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3.5 py-2 text-xs font-medium text-[#57554F] hover:bg-[#F3F1EC]"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirmSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#141413] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2C2B29]"
          >
            <Check className="h-3.5 w-3.5" />
            Lưu ảnh & Xếp hạng
          </button>
        </div>
      </div>
    </div>
  );
};
