import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import { loadSession } from '../auth/session'
import { ToastProvider } from '../components/Toast'
import { authApi, userApi } from '../services/api'
import { SignIn } from './SignIn'

function httpError(status: number) {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError('fail', 'ERR', config, null, { status, statusText: '', headers: {}, config, data: {} })
}

const renderSignIn = () =>
  render(
    <ToastProvider>
      <AuthProvider>
        <SignIn />
      </AuthProvider>
    </ToastProvider>,
  )

describe('SignIn', () => {
  beforeEach(() => {
    vi.spyOn(authApi, 'providers').mockResolvedValue({ github: false, gitlab: false })
  })

  it('offers Continue with GitHub and GitLab when the server has client IDs', async () => {
    vi.spyOn(authApi, 'providers').mockResolvedValue({ github: true, gitlab: true })
    renderSignIn()
    const github = await screen.findByRole('link', { name: 'Continue with GitHub' })
    expect(github).toHaveAttribute('href', `http://localhost:3000/api/auth/github/start?redirect=${encodeURIComponent('http://localhost:3000/')}`)
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, origin: window.location.origin, assign })
    await userEvent.click(github)
    const nonce = sessionStorage.getItem('git-client-agents.oauth-nonce')
    expect(nonce).toMatch(/^[0-9a-f-]{36}$/)
    expect(assign).toHaveBeenCalledWith(`http://localhost:3000/api/auth/github/start?redirect=${encodeURIComponent(`http://localhost:3000/?signin=${nonce}`)}`)
    vi.unstubAllGlobals()
    expect(screen.getByRole('link', { name: 'Continue with GitLab' })).toBeInTheDocument()
  })

  it('shows only the platforms that are configured', async () => {
    vi.spyOn(authApi, 'providers').mockResolvedValue({ github: false, gitlab: true })
    renderSignIn()
    expect(await screen.findByRole('link', { name: 'Continue with GitLab' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Continue with GitHub' })).toBeNull()
  })

  it('signs in with the token the server returns after OAuth', async () => {
    const me = vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'github', id: '1', login: 'owen', name: null, avatarUrl: null, role: 'owner' })
    const exchange = vi.spyOn(authApi, 'exchange').mockResolvedValue({ platform: 'github', token: 'gho_abc' })
    sessionStorage.setItem('git-client-agents.oauth-nonce', 'n1')
    window.history.replaceState(null, '', '/?signin=n1#code=sealed-abc')
    renderSignIn()
    await vi.waitFor(() => expect(me).toHaveBeenCalled())
    expect(exchange).toHaveBeenCalledWith('sealed-abc')
    await vi.waitFor(() =>
      expect(loadSession()).toEqual({ platform: 'github', token: 'gho_abc' }),
    )
    expect(window.location.hash).toBe('')
    expect(window.location.search).toBe('')
  })

  it('refuses a sign-in link that this tab did not start, and keeps nothing', async () => {
    const me = vi.spyOn(userApi, 'me')
    const exchange = vi.spyOn(authApi, 'exchange')
    window.history.replaceState(null, '', '/#code=sealed-attacker')
    renderSignIn()
    expect(await screen.findByRole('alert')).toHaveTextContent("wasn't started from this tab")
    expect(exchange).not.toHaveBeenCalled()
    expect(me).not.toHaveBeenCalled()
    expect(loadSession()).toBeNull()
  })

  it('shows why an OAuth sign-in failed', async () => {
    sessionStorage.setItem('git-client-agents.oauth-nonce', 'n2')
    window.history.replaceState(null, '', '/?signin=n2#error=Sign-in%20was%20started%20in%20another%20browser.')
    renderSignIn()
    expect(await screen.findByRole('alert')).toHaveTextContent('started in another browser')
  })

  it('shows why the server refused a login after OAuth, and keeps nothing', async () => {
    vi.spyOn(userApi, 'me').mockRejectedValue(httpError(401))
    vi.spyOn(authApi, 'exchange').mockResolvedValue({ platform: 'github', token: 'ghu_abc' })
    sessionStorage.setItem('git-client-agents.oauth-nonce', 'n4')
    window.history.replaceState(null, '', '/?signin=n4#code=sealed-x')
    renderSignIn()
    expect(await screen.findByRole('alert')).toHaveTextContent('did not accept the sign-in')
    expect(loadSession()).toBeNull()
  })

  it('has no personal access token or operator sign-in: only GitHub and GitLab', async () => {
    vi.spyOn(authApi, 'providers').mockResolvedValue({ github: true, gitlab: true })
    renderSignIn()
    expect(await screen.findByRole('link', { name: 'Continue with GitHub' })).toBeInTheDocument()
    expect(screen.queryByText(/personal access token/i)).toBeNull()
    expect(screen.queryByLabelText('Personal access token')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Sign in' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Operator' })).toBeNull()
  })

  it('says sign-in is not set up when the server has no client IDs', async () => {
    renderSignIn()
    expect(await screen.findByText(/No sign-in is set up on the server yet/)).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })
})
