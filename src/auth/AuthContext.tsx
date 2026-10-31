import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, errorStatus, setApiSession, userApi } from '../services/api'
import type { Me, Platform } from '../types'
import { browser } from './browser'
import { beginOAuth, forgetOAuth, loadSession, oauthToResume, rememberOAuth, saveSession, takeOAuthReturn, type OAuthReturn, type Session } from './session'

interface AuthState {
  session: Session | null
  me: Me | null
  /** The platform's owner: the user whose ID the server has in GITHUB_ADMIN_ID / GITLAB_ADMIN_ID. */
  isOwner: boolean
  checking: boolean
  /** Why the last "Continue with GitHub/GitLab" failed, for the sign-in page. */
  oauthError: unknown
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)

// Proves a session works before keeping it: the platform token must belong to a whitelisted user.
async function verify(session: Session): Promise<Me> {
  setApiSession(session)
  return userApi.me()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Read once, before the first render, so the token leaves the address bar straight away.
  const [oauthReturn] = useState<OAuthReturn | null>(() => takeOAuthReturn())
  const [session, setSession] = useState<Session | null>(() => (oauthReturn && 'code' in oauthReturn ? null : loadSession()))
  // A reload after an OAuth sign-in: go back through OAuth instead of showing the sign-in page.
  const [resume] = useState<Platform | null>(() => (oauthReturn || session ? null : oauthToResume()))
  const [me, setMe] = useState<Me | null>(null)
  const [checking, setChecking] = useState(() => session !== null || resume !== null || (oauthReturn !== null && 'code' in oauthReturn))
  const [oauthError, setOauthError] = useState<unknown>(() => (oauthReturn && 'error' in oauthReturn ? new Error(oauthReturn.error) : null))

  const signOut = useCallback(() => {
    forgetOAuth()
    saveSession(null)
    setApiSession(null)
    setSession(null)
    setMe(null)
  }, [])

  useEffect(() => {
    if (resume) {
      browser.go(authApi.startUrl(resume, beginOAuth()))
      return
    }
    if (oauthReturn && 'error' in oauthReturn) forgetOAuth()
    if (oauthReturn && 'code' in oauthReturn) {
      let next: Session
      authApi
        .exchange(oauthReturn.code)
        .then(({ platform, token }) => {
          next = { platform, token }
          return verify(next)
        })
        .then((who) => {
          saveSession(next)
          rememberOAuth(next.platform)
          setSession(next)
          setMe(who)
        })
        .catch((err) => {
          forgetOAuth()
          setApiSession(null)
          setOauthError(err)
        })
        .finally(() => setChecking(false))
      return
    }
    const initial = loadSession()
    if (!initial) return
    verify(initial)
      .then(setMe)
      .catch((err) => {
        if (errorStatus(err) === 401 || errorStatus(err) === 403) signOut()
      })
      .finally(() => setChecking(false))
  }, [oauthReturn, resume, signOut])

  const isOwner = me?.role === 'owner'
  const value = useMemo(
    () => ({ session, me, isOwner, checking, oauthError, signOut }),
    [session, me, isOwner, checking, oauthError, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react/only-export-components -- hook lives beside its provider
export function useAuth(): AuthState {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
