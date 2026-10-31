import type { Platform } from '../types'

// Who the dashboard is calling the server as. The operator uses the server's ADMIN_TOKEN;
// a user signs in with their own GitHub or GitLab personal access token.
export type Session = { mode: 'admin'; token: string } | { mode: 'user'; platform: Platform; token: string }

const STORAGE_KEY = 'git-client-agents.session'

// sessionStorage keeps the token for this tab only and drops it when the tab closes.
export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Session
  } catch {
    // Storage blocked or corrupt: fall through to the dev default.
  }
  const devToken = import.meta.env.VITE_ADMIN_TOKEN
  return devToken ? { mode: 'admin', token: devToken } : null
}

export function saveSession(session: Session | null) {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // The session still lives in memory for this page load.
  }
}

export function authHeaders(session: Session | null): Record<string, string> {
  if (!session) return {}
  const headers: Record<string, string> = { Authorization: `Bearer ${session.token}` }
  if (session.mode === 'user') headers['X-Platform'] = session.platform
  return headers
}
