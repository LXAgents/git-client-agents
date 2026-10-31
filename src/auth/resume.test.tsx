import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../components/Toast'
import { authApi, userApi } from '../services/api'
import { AuthProvider, useAuth } from './AuthContext'
import { browser } from './browser'
import { oauthToResume, rememberOAuth } from './session'

function Probe() {
  const { session, checking, signOut } = useAuth()
  return (
    <div>
      <p>{checking ? 'checking' : session ? `signed in with ${session.platform}` : 'signed out'}</p>
      <button type="button" onClick={signOut}>
        sign out
      </button>
    </div>
  )
}

const renderApp = () =>
  render(
    <ToastProvider>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </ToastProvider>,
  )

const me = { platform: 'github' as const, id: '1', login: 'alice', name: null, avatarUrl: null, role: 'free' as const }

describe('staying signed in across a reload', () => {
  it('remembers only the platform after an OAuth sign-in, never the token', async () => {
    vi.spyOn(userApi, 'me').mockResolvedValue(me)
    vi.spyOn(authApi, 'exchange').mockResolvedValue({ platform: 'github', token: 'gho_secret' })
    sessionStorage.setItem('git-client-agents.oauth-nonce', 'n1')
    window.history.replaceState(null, '', '/?signin=n1#code=sealed')
    renderApp()
    expect(await screen.findByText('signed in with github')).toBeInTheDocument()
    expect(oauthToResume()).toBe('github')
    const stored = Object.keys(sessionStorage).map((k) => sessionStorage.getItem(k))
    expect(stored.join(' ')).not.toContain('gho_secret')
  })

  it('on reload goes straight back through OAuth for that platform', () => {
    const go = vi.spyOn(browser, 'go').mockImplementation(() => {})
    rememberOAuth('gitlab')
    window.history.replaceState(null, '', '/repos')
    renderApp()
    expect(screen.getByText('checking')).toBeInTheDocument()
    expect(go).toHaveBeenCalledTimes(1)
    const url = new URL(go.mock.calls[0][0])
    expect(url.pathname).toBe('/api/auth/gitlab/start')
    const back = new URL(url.searchParams.get('redirect')!)
    expect(back.searchParams.get('signin')).toBe(sessionStorage.getItem('git-client-agents.oauth-nonce'))
  })

  it('does nothing on a fresh tab', () => {
    const go = vi.spyOn(browser, 'go').mockImplementation(() => {})
    window.history.replaceState(null, '', '/')
    renderApp()
    expect(screen.getByText('signed out')).toBeInTheDocument()
    expect(go).not.toHaveBeenCalled()
  })

  it('stops resuming after an OAuth error, so it never loops', async () => {
    const go = vi.spyOn(browser, 'go').mockImplementation(() => {})
    rememberOAuth('github')
    sessionStorage.setItem('git-client-agents.oauth-nonce', 'n2')
    window.history.replaceState(null, '', '/?signin=n2#error=denied')
    renderApp()
    expect(await screen.findByText('signed out')).toBeInTheDocument()
    expect(go).not.toHaveBeenCalled()
    expect(oauthToResume()).toBeNull()
  })

  it('forgets it on sign-out', async () => {
    vi.spyOn(userApi, 'me').mockResolvedValue(me)
    vi.spyOn(authApi, 'exchange').mockResolvedValue({ platform: 'github', token: 'gho' })
    sessionStorage.setItem('git-client-agents.oauth-nonce', 'n3')
    window.history.replaceState(null, '', '/?signin=n3#code=sealed')
    renderApp()
    await screen.findByText('signed in with github')
    expect(oauthToResume()).toBe('github')
    await userEvent.click(screen.getByRole('button', { name: 'sign out' }))
    expect(oauthToResume()).toBeNull()
  })
})
