/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_AUTH_STORAGE_KEY: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_NOTIFICATIONS: string;
  readonly VITE_DEFAULT_THEME: string;
  readonly VITE_ITEMS_PER_PAGE: string;
  readonly VITE_DEV_MOCK_API: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}