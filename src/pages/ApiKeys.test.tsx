import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { userApi } from '../services/api'
import { renderAs } from '../test/render'
import type { ApiKey, Org } from '../types'
import { ApiKeys } from './ApiKeys'

const acme: Org = {
  id: 'org1',
  platform: 'github',
  orgName: 'acme',
  installationId: '555',
  owner: { platform: 'github', id: '1001', username: 'alice' },
  createdAt: '2026-10-31T00:00:00Z',
}
const key = (id: string, type: 'user' | 'org', name: string, last4: string, priority: number): ApiKey => ({
  id,
  owner: { type, id: type === 'org' ? 'org1' : '1001', platform: 'github', name },
  provider: 'OpenRouter',
  priority,
  isActive: true,
  last4,
  createdAt: '2026-10-31T00:00:00Z',
})

describe('API keys as a user', () => {
  beforeEach(() => {
    vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'github', id: '1001', login: 'alice', username: 'alice' })
    vi.spyOn(userApi, 'orgs').mockResolvedValue([acme])
  })

  it('shows own and owned-org keys by last four only', async () => {
    vi.spyOn(userApi, 'keys').mockResolvedValue([key('k1', 'user', 'alice', '1111', 0)])
    vi.spyOn(userApi, 'orgKeys').mockResolvedValue([key('k2', 'org', 'acme', '2222', 5)])
    renderAs({ mode: 'user', platform: 'github', token: 'ghp' }, <ApiKeys />)

    await screen.findByText('••••2222')
    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('acme')
    expect(rows[1]).toHaveTextContent('••••2222')
    expect(rows[2]).toHaveTextContent('••••1111')
  })

  it('attaches a new key to an owned org through the toggle', async () => {
    vi.spyOn(userApi, 'keys').mockResolvedValue([])
    vi.spyOn(userApi, 'orgKeys').mockResolvedValue([])
    const create = vi.spyOn(userApi, 'createOrgKey').mockResolvedValue(key('k3', 'org', 'acme', '9999', 3))
    renderAs({ mode: 'user', platform: 'github', token: 'ghp' }, <ApiKeys />)

    await screen.findByText('No API keys yet.')
    await userEvent.click(screen.getByRole('button', { name: 'Add key' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Organization' }))
    expect(within(dialog).getByLabelText('Organization')).toHaveDisplayValue('acme (github)')
    await userEvent.type(within(dialog).getByLabelText('OpenRouter API key'), 'sk-or-9999')
    await userEvent.clear(within(dialog).getByLabelText('Priority'))
    await userEvent.type(within(dialog).getByLabelText('Priority'), '3')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add key' }))

    expect(create).toHaveBeenCalledWith('org1', { apiKey: 'sk-or-9999', priority: 3 })
  })

  it('deletes an org key through the org route', async () => {
    vi.spyOn(userApi, 'keys').mockResolvedValue([])
    vi.spyOn(userApi, 'orgKeys').mockResolvedValue([key('k2', 'org', 'acme', '2222', 5)])
    const del = vi.spyOn(userApi, 'deleteOrgKey').mockResolvedValue({} as never)
    renderAs({ mode: 'user', platform: 'github', token: 'ghp' }, <ApiKeys />)

    await userEvent.click(await screen.findByRole('button', { name: /Delete key ending 2222/ }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))
    expect(del).toHaveBeenCalledWith('org1', 'k2')
  })
})
