import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiKeys } from '../pages/ApiKeys'
import { userApi } from '../services/api'
import { renderAs } from '../test/render'
import type { ApiKey, Org, Repo } from '../types'

const acme: Org = { id: 'org1', platform: 'github', orgName: 'acme', installationId: '555', owner: { platform: 'github', id: '1001', login: 'alice', name: null, avatarUrl: null }, createdAt: '2026-11-01T00:00:00Z' }
const web: Repo = { id: 'repo1', platform: 'github', externalId: '301', fullName: 'acme/web', org: { id: 'org1', name: 'acme' }, createdAt: '2026-11-01T00:00:00Z' }
const wsKey = (id: string, type: 'user' | 'org' | 'repo', name: string, last4: string, priority = 0): ApiKey => ({
  id,
  owner: { type, id: { user: '1001', org: 'org1', repo: 'repo1' }[type], platform: 'github', name },
  provider: 'GitHub Codespaces',
  providerSlug: null,
  priority,
  isActive: true,
  last4,
  createdAt: '2026-11-01T00:00:00Z',
})

describe('Workspace keys', () => {
  beforeEach(() => {
    vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'github', id: '1001', login: 'alice', name: null, avatarUrl: null, role: 'free' as const })
    vi.spyOn(userApi, 'orgs').mockResolvedValue([acme])
    vi.spyOn(userApi, 'repos').mockResolvedValue([web])
    vi.spyOn(userApi, 'keys').mockResolvedValue([])
    vi.spyOn(userApi, 'orgKeys').mockResolvedValue([])
    vi.spyOn(userApi, 'repoKeys').mockResolvedValue([])
    vi.spyOn(userApi, 'providers').mockResolvedValue([])
  })

  it('lists keys in the order the agent tries them: repository, organization, yours', async () => {
    vi.spyOn(userApi, 'workspaceKeys').mockResolvedValue([wsKey('w1', 'user', 'alice', 'USR1', 9)])
    vi.spyOn(userApi, 'orgWorkspaceKeys').mockResolvedValue([wsKey('w2', 'org', 'acme', 'ORG1')])
    vi.spyOn(userApi, 'repoWorkspaceKeys').mockResolvedValue([wsKey('w3', 'repo', 'acme/web', 'REP1')])
    renderAs({ platform: 'github', token: 'gho' }, <ApiKeys />)
    const table = await screen.findByRole('table', { name: 'Workspace keys' })
    await within(table).findByText('••••USR1')
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows.map((r) => r.textContent?.match(/••••([A-Z]{3}\d)/)?.[1])).toEqual(['REP1', 'ORG1', 'USR1'])
  })

  it('adds a token to a repository and deletes it through the repository route', async () => {
    vi.spyOn(userApi, 'workspaceKeys').mockResolvedValue([])
    vi.spyOn(userApi, 'orgWorkspaceKeys').mockResolvedValue([])
    const list = vi.spyOn(userApi, 'repoWorkspaceKeys').mockResolvedValue([])
    const create = vi.spyOn(userApi, 'createRepoWorkspaceKey').mockResolvedValue(wsKey('w4', 'repo', 'acme/web', 'abcd'))
    renderAs({ platform: 'github', token: 'gho' }, <ApiKeys />)

    await screen.findByText('No workspace keys yet.')
    await userEvent.click(screen.getByRole('button', { name: 'Add workspace key' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Repository' }))
    await userEvent.type(within(dialog).getByLabelText('GitHub personal access token'), 'ghp_abcd')
    list.mockResolvedValue([wsKey('w4', 'repo', 'acme/web', 'abcd')])
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add workspace key' }))
    expect(create).toHaveBeenCalledWith('repo1', { token: 'ghp_abcd', priority: 0 })

    const row = (await screen.findByText('••••abcd')).closest('tr')!
    const remove = vi.spyOn(userApi, 'deleteRepoWorkspaceKey').mockResolvedValue({} as never)
    await userEvent.click(within(row).getByRole('button', { name: /Delete workspace key ending abcd/ }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Delete/ }))
    expect(remove).toHaveBeenCalledWith('repo1', 'w4')
  })

  it('is not shown on GitLab, which has no Codespaces', async () => {
    vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'gitlab', id: '7', login: 'carol', name: null, avatarUrl: null, role: 'free' as const })
    const ws = vi.spyOn(userApi, 'workspaceKeys').mockResolvedValue([])
    renderAs({ platform: 'gitlab', token: 'glo' }, <ApiKeys />)
    await screen.findByText('No API keys yet.')
    expect(screen.queryByRole('heading', { name: 'Workspace keys' })).toBeNull()
    expect(ws).not.toHaveBeenCalled()
  })
})
