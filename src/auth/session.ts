import type { Platform } from '../types'

// Who the dashboard is calling the server as. The operator uses the server's ADMIN_TOKEN;
// a user signs in with GitHub or GitLab (OAuth) or pastes a personal access token.
export type Session = { mode: 'admin'; token: string } | { mode: 'user'; platform: Platform; token: string }

const STORAGE_KEY = 'git-client-agents.session'

// A token is sent as a header, so it must be a single printable word.
const TOKEN = /^[\x21-\x7e]{1,4096}$/

// Whatever is in storage may have been written by someone else; only a well-formed session is used.
export function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  if (typeof v.token !== 'string' || !TOKEN.test(v.token)) return false
  if (v.mode === 'admin') return Object.keys(v).length === 2
  return v.mode === 'user' && (v.platform === 'github' || v.platform === 'gitlab') && Object.keys(v).length === 3
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// sessionStorage keeps the token for this tab only and drops it when the tab closes.
export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = parseJson(raw)
      if (isSession(parsed)) return parsed
      sessionStorage.removeItem(STORAGE_KEY)
    }
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

export type OAuthReturn = { session: Session } | { error: string }

// After "Continue with GitHub/GitLab" the server sends the browser back with
// #platform=…&token=… or #error=… in the URL fragment. Returns null for any other hash.
export function readOAuthReturn(hash: string): OAuthReturn | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const error = params.get('error')
  if (error) return { error }
  const platform = params.get('platform')
  const token = params.get('token')
  if ((platform === 'github' || platform === 'gitlab') && token) return { session: { mode: 'user', platform, token } }
  return null
}

// Takes the OAuth result out of the address bar, so the token is not left in history or bookmarks.
export function takeOAuthReturn(): OAuthReturn | null {
  const result = readOAuthReturn(window.location.hash)
  if (result) window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
  return result
}

export function authHeaders(session: Session | null): Record<string, string> {
  if (!session) return {}
  const headers: Record<string, string> = { Authorization: `Bearer ${session.token}` }
  if (session.mode === 'user') headers['X-Platform'] = session.platform
  return headers
}
