import type { Platform } from '../types'

// Who the dashboard is calling the server as: a user signed in with Continue with GitHub or
// GitLab (OAuth). Personal access tokens are refused. Every session works on one platform: it sees only that
// platform's users, orgs, repos and keys. The platform's owner gets the owner pages.
export type Session = { platform: Platform; token: string }

// Older versions kept the session in sessionStorage under this key. It is only ever removed now.
const LEGACY_STORAGE_KEY = 'git-client-agents.session'

// A token is sent as a header, so it must be a single printable word.
const TOKEN = /^[\x21-\x7e]{1,4096}$/

// Only a well-formed session is ever kept.
export function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  if (typeof v.token !== 'string' || !TOKEN.test(v.token)) return false
  return (v.platform === 'github' || v.platform === 'gitlab') && Object.keys(v).length === 2
}

// The token lives only in this page's memory. Nothing is written to browser storage, so no
// other script or tab can plant a session. A reload after an OAuth sign-in signs back in
// through OAuth (see rememberOAuth).
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
  return current
}

// Only a checked session is kept, rebuilt field by field so nothing else rides along.
export function saveSession(session: Session | null) {
  if (session && isSession(session)) {
    current = { platform: session.platform, token: session.token }
  } else {
    current = null
  }
}

// The token itself is never stored (see above), so a reload would sign you out. After a
// "Continue with GitHub/GitLab" sign-in, this tab instead remembers which platform it used,
// as a fixed marker under a fixed key. A reload then goes back through that platform's OAuth,
// which returns at once for an app the user already authorized.
const RESUME_GITHUB = 'git-client-agents.resume.github'
const RESUME_GITLAB = 'git-client-agents.resume.gitlab'

export function forgetOAuth() {
  try {
    sessionStorage.removeItem(RESUME_GITHUB)
    sessionStorage.removeItem(RESUME_GITLAB)
  } catch {
    // Storage blocked: nothing was remembered.
  }
}

export function rememberOAuth(platform: Platform) {
  forgetOAuth()
  try {
    sessionStorage.setItem(platform === 'gitlab' ? RESUME_GITLAB : RESUME_GITHUB, '1')
  } catch {
    // Without storage a reload asks you to sign in again.
  }
}

// The platform to sign back in with after a reload, or null.
export function oauthToResume(): Platform | null {
  try {
    if (sessionStorage.getItem(RESUME_GITHUB)) return 'github'
    if (sessionStorage.getItem(RESUME_GITLAB)) return 'gitlab'
  } catch {
    // Storage blocked.
  }
  return null
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
  return { Authorization: `Bearer ${session.token}`, 'X-Platform': session.platform }
}
