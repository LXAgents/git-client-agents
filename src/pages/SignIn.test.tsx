import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import { loadSession } from '../auth/session'
import { ToastProvider } from '../components/Toast'
import { adminApi, authApi, userApi } from '../services/api'
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

  it('offers Continue with GitHub and GitLab when the server has client IDs, and keeps the token form behind a toggle', async () => {
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
    expect(screen.queryByLabelText('Personal access token')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /personal access token instead/ }))
    expect(screen.getByLabelText('Personal access token')).toBeInTheDocument()
  })

  it('shows only the platforms that are configured', async () => {
    vi.spyOn(authApi, 'providers').mockResolvedValue({ github: false, gitlab: true })
    renderSignIn()
    expect(await screen.findByRole('link', { name: 'Continue with GitLab' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Continue with GitHub' })).toBeNull()
  })

  it('signs in with the token the server returns after OAuth', async () => {
    const me = vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'github', id: '1', login: 'owen', username: 'owen', isAdmin: true })
    const exchange = vi.spyOn(authApi, 'exchange').mockResolvedValue({ platform: 'github', token: 'gho_abc' })
    sessionStorage.setItem('git-client-agents.oauth-nonce', 'n1')
    window.history.replaceState(null, '', '/?signin=n1#code=sealed-abc')
    renderSignIn()
    await vi.waitFor(() => expect(me).toHaveBeenCalled())
    expect(exchange).toHaveBeenCalledWith('sealed-abc')
    await vi.waitFor(() =>
      expect(loadSession()).toEqual({ mode: 'user', platform: 'github', token: 'gho_abc' }),
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

  it('signs a user in with their platform token and keeps it for the page', async () => {
    const me = vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'gitlab', id: '7', login: 'carol', username: 'carol' })
    renderSignIn()
    await userEvent.selectOptions(await screen.findByLabelText('Platform'), 'gitlab')
    await userEvent.type(screen.getByLabelText('Personal access token'), 'glpat-x')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(me).toHaveBeenCalled()
    expect(loadSession()).toEqual({ mode: 'user', platform: 'gitlab', token: 'glpat-x' })
  })

  it('explains a user who is not whitelisted', async () => {
    vi.spyOn(userApi, 'me').mockRejectedValue(httpError(403))
    renderSignIn()
    await userEvent.type(await screen.findByLabelText('Personal access token'), 'ghp')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('not whitelisted')
    expect(loadSession()).toBeNull()
  })

  it('rejects a wrong operator token', async () => {
    vi.spyOn(adminApi, 'accounts').mockRejectedValue(httpError(401))
    renderSignIn()
    await userEvent.click(screen.getByRole('button', { name: 'Operator' }))
    await userEvent.type(screen.getByLabelText('Admin token'), 'nope')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('admin token was rejected')
  })
})
