/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Goong Map Tiles key — dùng để hiển thị bản đồ nền (https://account.goong.io) */
  readonly VITE_GOONG_MAPTILES_KEY?: string;
  /** Goong REST API key — dùng cho Direction API (chỉ đường dự phòng) */
  readonly VITE_GOONG_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
