import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { adminApi, errorStatus, setApiSession, userApi } from '../services/api'
import type { Me } from '../types'
import { loadSession, saveSession, type Session } from './session'

interface AuthState {
  session: Session | null
  me: Me | null
  checking: boolean
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
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [me, setMe] = useState<Me | null>(null)
  const [checking, setChecking] = useState(() => session !== null)

  const signOut = useCallback(() => {
    saveSession(null)
    setApiSession(null)
    setSession(null)
    setMe(null)
  }, [])

  useEffect(() => {
    const initial = loadSession()
    if (!initial) return
    verify(initial)
      .then(setMe)
      .catch((err) => {
        if (errorStatus(err) === 401 || errorStatus(err) === 403) signOut()
      })
      .finally(() => setChecking(false))
  }, [signOut])

  const signIn = useCallback(async (next: Session) => {
    try {
      const who = await verify(next)
      saveSession(next)
      setSession(next)
      setMe(who)
    } catch (err) {
      setApiSession(session)
      throw err
    }
  }, [session])

  const value = useMemo(() => ({ session, me, checking, signIn, signOut }), [session, me, checking, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react/only-export-components -- hook lives beside its provider
export function useAuth(): AuthState {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
