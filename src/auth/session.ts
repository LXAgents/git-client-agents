import type { Platform } from '../types'

// Who the dashboard is calling the server as. The operator uses the server's ADMIN_TOKEN;
// a user signs in with GitHub or GitLab (OAuth) or pastes a personal access token.
export type Session = { mode: 'admin'; token: string } | { mode: 'user'; platform: Platform; token: string }

// Older versions kept the session in sessionStorage under this key. It is only ever removed now.
const LEGACY_STORAGE_KEY = 'git-client-agents.session'

// A token is sent as a header, so it must be a single printable word.
const TOKEN = /^[\x21-\x7e]{1,4096}$/

// Only a well-formed session is ever kept.
export function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  if (typeof v.token !== 'string' || !TOKEN.test(v.token)) return false
  if (v.mode === 'admin') return Object.keys(v).length === 2
  return v.mode === 'user' && (v.platform === 'github' || v.platform === 'gitlab') && Object.keys(v).length === 3
}

// The token lives only in this page's memory. Nothing is written to browser storage, so no
// other script or tab can plant a session, and a reload asks you to sign in again.
let current: Session | null = null

function forgetLegacy() {
  try {
    sessionStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Storage blocked: nothing to clean up.
  }
}

forgetLegacy()

export function loadSession(): Session | null {
  if (current) return current
  const devToken = import.meta.env.VITE_ADMIN_TOKEN
  return devToken ? { mode: 'admin', token: devToken } : null
}

// Only a checked session is kept, rebuilt field by field so nothing else rides along.
export function saveSession(session: Session | null) {
  if (session && isSession(session)) {
    current = session.mode === 'admin' ? { mode: 'admin', token: session.token } : { mode: 'user', platform: session.platform, token: session.token }
  } else {
    current = null
  }
}

export type OAuthReturn = { code: string } | { error: string }

// After "Continue with GitHub/GitLab" the server sends the browser back with #code=… (a sealed,
// one-time code that is swapped for the token by POST /api/auth/exchange; the token itself is
// never in the URL) or #error=…. Returns null for any other hash.
export function readOAuthReturn(hash: string): OAuthReturn | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const error = params.get('error')
  if (error) return { error }
  const code = params.get('code')
  return code ? { code } : null
}

const NONCE_KEY = 'git-client-agents.oauth-nonce'
export const SIGNIN_PARAM = 'signin'
export const FOREIGN_SIGNIN = "Sign-in wasn't started from this tab. Try again."

// "Continue with GitHub/GitLab" stores a one-time nonce and sends it out in the redirect
// (?signin=…). Only a return that brings the same nonce back is accepted, so a link someone
// else made (#platform=…&token=<their token>) can't sign this tab in as their account.
export function beginOAuth(): string {
  const nonce = crypto.randomUUID()
  try {
    sessionStorage.setItem(NONCE_KEY, nonce)
  } catch {
    // Without storage the return can't be matched and is refused.
  }
  return nonce
}

function takeNonce(): string | null {
  try {
    const nonce = sessionStorage.getItem(NONCE_KEY)
    sessionStorage.removeItem(NONCE_KEY)
    return nonce
  } catch {
    return null
  }
}

// Takes the OAuth result (and the nonce) out of the address bar, so the one-time code is not
// left in history or bookmarks.
export function takeOAuthReturn(): OAuthReturn | null {
  const result = readOAuthReturn(window.location.hash)
  if (!result) return null
  const query = new URLSearchParams(window.location.search)
  const given = query.get(SIGNIN_PARAM)
  query.delete(SIGNIN_PARAM)
  const search = query.size ? `?${query}` : ''
  window.history.replaceState(window.history.state, '', window.location.pathname + search)
  const expected = takeNonce()
  if (!given || !expected || given !== expected) return { error: FOREIGN_SIGNIN }
  return result
}

export function authHeaders(session: Session | null): Record<string, string> {
  if (!session) return {}
  const headers: Record<string, string> = { Authorization: `Bearer ${session.token}` }
  if (session.mode === 'user') headers['X-Platform'] = session.platform
  return headers
}
