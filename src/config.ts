// The server URL. A container sets window.__APP_CONFIG__ from API_URL at start (public/config.js),
// so one image works for any server; otherwise the build-time VITE_API_URL applies.
export function apiBaseUrl(): string {
  const runtime = window.__APP_CONFIG__?.apiUrl?.trim()
  return runtime || import.meta.env.VITE_API_URL || 'http://localhost:3000'
}
