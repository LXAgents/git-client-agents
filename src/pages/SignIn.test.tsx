import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthContext'
import { ToastProvider } from '../components/Toast'
import { adminApi, userApi } from '../services/api'
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
  it('signs a user in with their platform token and keeps it for the tab', async () => {
    const me = vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'gitlab', id: '7', login: 'carol', username: 'carol' })
    renderSignIn()
    await userEvent.selectOptions(screen.getByLabelText('Platform'), 'gitlab')
    await userEvent.type(screen.getByLabelText('Personal access token'), 'glpat-x')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(me).toHaveBeenCalled()
    expect(JSON.parse(sessionStorage.getItem('git-client-agents.session')!)).toEqual({ mode: 'user', platform: 'gitlab', token: 'glpat-x' })
  })

  it('explains a user who is not whitelisted', async () => {
    vi.spyOn(userApi, 'me').mockRejectedValue(httpError(403))
    renderSignIn()
    await userEvent.type(screen.getByLabelText('Personal access token'), 'ghp')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('not whitelisted')
    expect(sessionStorage.getItem('git-client-agents.session')).toBeNull()
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
