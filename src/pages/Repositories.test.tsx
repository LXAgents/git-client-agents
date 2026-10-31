import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { userApi } from '../services/api'
import { renderAs } from '../test/render'
import type { Repo } from '../types'
import { Repositories } from './Repositories'

const web: Repo = {
  id: 'repo1',
  platform: 'github',
  externalId: '301',
  fullName: 'acme/web',
  org: { id: 'org1', name: 'acme' },
  keyCount: 0,
  models: {},
  createdAt: '2026-10-31T00:00:00Z',
}

describe('Repositories as a user', () => {
  it('imports only repositories the platform says the user administers', async () => {
    vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'github', id: '1001', login: 'alice', name: null, avatarUrl: null, role: 'free' as const })
    const repos = vi.spyOn(userApi, 'repos').mockResolvedValueOnce([]).mockResolvedValue([web])
    vi.spyOn(userApi, 'importableRepos').mockResolvedValue([
      { externalId: '301', fullName: 'acme/web', org: 'acme', importable: true, reason: null },
      { externalId: '303', fullName: 'beta/app', org: 'beta', importable: false, reason: 'organization not imported' },
    ])
    const importRepo = vi.spyOn(userApi, 'importRepo').mockResolvedValue(web)

    renderAs({ platform: 'github', token: 'ghp' }, <Repositories />)
    expect(await screen.findByText('You have not imported any repositories you administer.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Import repository' }))
    const list = await screen.findByRole('list', { name: 'Repositories you administer' })
    expect(within(list).getByText('organization not imported')).toBeInTheDocument()
    await userEvent.click(within(list).getByRole('button', { name: /Import/ }))
    expect(importRepo).toHaveBeenCalledWith('301')
    expect(await screen.findByText('Imported acme/web')).toBeInTheDocument()
    expect(repos).toHaveBeenCalledTimes(2)
    // A session sees one platform only, so there is no Platform column.
    expect(screen.queryByRole('columnheader', { name: 'Platform' })).toBeNull()
  })

  it('filters the import list as you type', async () => {
    vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'gitlab', id: '7', login: 'carol', name: null, avatarUrl: null, role: 'free' as const })
    vi.spyOn(userApi, 'repos').mockResolvedValue([])
    vi.spyOn(userApi, 'importableRepos').mockResolvedValue([
      { externalId: '41', fullName: 'grp/app', org: 'grp', importable: true, reason: null },
      { externalId: '42', fullName: 'grp/docs', org: 'grp', importable: true, reason: null },
    ])
    renderAs({ platform: 'gitlab', token: 'glpat' }, <Repositories />)
    await userEvent.click(await screen.findByRole('button', { name: 'Import repository' }))
    const list = await screen.findByRole('list', { name: 'Repositories you administer' })
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search repositories' }), 'docs')
    expect(within(list).getByText('grp/docs')).toBeInTheDocument()
    expect(within(list).queryByText('grp/app')).toBeNull()
  })
})
