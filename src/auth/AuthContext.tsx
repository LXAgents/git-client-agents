import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { adminApi, authApi, errorStatus, setApiSession, userApi } from '../services/api'
import type { Me } from '../types'
import { loadSession, saveSession, takeOAuthReturn, type OAuthReturn, type Session } from './session'

interface AuthState {
  session: Session | null
  me: Me | null
  /** The operator token, or a user whose ID the server lists in GITHUB_ADMIN_ID / GITLAB_ADMIN_ID. */
  isAdmin: boolean
  checking: boolean
  /** Why the last "Continue with GitHub/GitLab" failed, for the sign-in page. */
  oauthError: unknown
  signIn: (session: Session) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)

// Proves a session works before keeping it: the admin token must open /api/admin, and a
// platform token must belong to a whitelisted user.
async function verify(session: Session): Promise<Me | null> {
  setApiSession(session)
  if (session.mode === 'admin') {
    await adminApi.accounts()
    return null
  }
  return userApi.me()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Read once, before the first render, so the token leaves the address bar straight away.
  const [oauthReturn] = useState<OAuthReturn | null>(() => takeOAuthReturn())
  const [session, setSession] = useState<Session | null>(() => (oauthReturn && 'code' in oauthReturn ? null : loadSession()))
  const [me, setMe] = useState<Me | null>(null)
  const [checking, setChecking] = useState(() => session !== null || (oauthReturn !== null && 'code' in oauthReturn))
  const [oauthError, setOauthError] = useState<unknown>(() => (oauthReturn && 'error' in oauthReturn ? new Error(oauthReturn.error) : null))

  const signOut = useCallback(() => {
    saveSession(null)
    setApiSession(null)
    setSession(null)
    setMe(null)
  }, [])

  useEffect(() => {
    if (oauthReturn && 'code' in oauthReturn) {
      let next: Session
      authApi
        .exchange(oauthReturn.code)
        .then(({ platform, token }) => {
          next = { mode: 'user', platform, token }
          return verify(next)
        })
        .then((who) => {
          saveSession(next)
          setSession(next)
          setMe(who)
        })
        .catch((err) => {
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
  }, [oauthReturn, signOut])

  const signIn = useCallback(
    async (next: Session) => {
      try {
        const who = await verify(next)
        saveSession(next)
        setSession(next)
        setMe(who)
        setOauthError(null)
      } catch (err) {
        setApiSession(session)
        throw err
      }
    },
    [session],
  )

  const isAdmin = session?.mode === 'admin' || Boolean(me?.isAdmin)
  const value = useMemo(
    () => ({ session, me, isAdmin, checking, oauthError, signIn, signOut }),
    [session, me, isAdmin, checking, oauthError, signIn, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react/only-export-components -- hook lives beside its provider
export function useAuth(): AuthState {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
