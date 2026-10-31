/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  // Written by the container at start from API_URL (see docker/40-app-config.sh).
  __APP_CONFIG__?: { apiUrl?: string }
}
