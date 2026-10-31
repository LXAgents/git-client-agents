import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { adminApi, userApi } from '../services/api'
import { renderAs } from '../test/render'
import type { Org } from '../types'
import { Organizations } from './Organizations'

const acme: Org = {
  id: 'org1',
  platform: 'github',
  orgName: 'acme',
  installationId: '555',
  owner: { platform: 'github', id: '1001', login: 'alice', name: null, avatarUrl: null },
  keyCount: 1,
  createdAt: '2026-10-31T00:00:00Z',
}

describe('Organizations as a user', () => {
  beforeEach(() => {
    vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'github', id: '1001', login: 'alice', name: null, avatarUrl: null, role: 'member' as const })
  })

  it('imports only from the orgs the platform says the user owns', async () => {
    const orgs = vi.spyOn(userApi, 'orgs').mockResolvedValueOnce([]).mockResolvedValue([acme])
    vi.spyOn(userApi, 'importable').mockResolvedValue([
      { name: 'acme', kind: 'org', importable: true, reason: null, appInstallationId: null },
      { name: 'no-app', kind: 'org', importable: false, reason: 'GitHub App is not installed', appInstallationId: null },
    ])
    const importOrg = vi.spyOn(userApi, 'importOrg').mockResolvedValue(acme)

    renderAs({ platform: 'github', token: 'ghp' }, <Organizations />)
    expect(await screen.findByText('You have not imported any organizations you own.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Import organization' }))

    const list = await screen.findByRole('list', { name: 'Organizations you own' })
    expect(within(list).getByText('GitHub App is not installed')).toBeInTheDocument()
    expect(within(list).queryByRole('textbox')).toBeNull()
    expect(within(list).getAllByRole('button', { name: /Import/ })).toHaveLength(1)

    await userEvent.click(within(list).getByRole('button', { name: /Import/ }))
    expect(importOrg).toHaveBeenCalledWith('acme')
    expect(await screen.findByText('Imported acme')).toBeInTheDocument()
    expect(orgs).toHaveBeenCalledTimes(2)
  })

  it('shows who imported an org, and no Platform column since a session sees one platform', async () => {
    vi.spyOn(userApi, 'orgs').mockResolvedValue([acme])
    renderAs({ platform: 'github', token: 'ghp' }, <Organizations />)
    const row = (await screen.findByText('acme')).closest('tr')!
    expect(row).toHaveTextContent('alice')
    expect(screen.queryByRole('columnheader', { name: 'Platform' })).toBeNull()
  })

  it('filters the import list as you type', async () => {
    vi.spyOn(userApi, 'orgs').mockResolvedValue([])
    vi.spyOn(userApi, 'importable').mockResolvedValue([
      { name: 'acme', kind: 'org', importable: true, reason: null, appInstallationId: null },
      { name: 'beta-labs', kind: 'org', importable: true, reason: null, appInstallationId: null },
    ])
    renderAs({ platform: 'github', token: 'ghp' }, <Organizations />)
    await userEvent.click(await screen.findByRole('button', { name: 'Import organization' }))
    const list = await screen.findByRole('list', { name: 'Organizations you own' })
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search organizations' }), 'BETA')
    expect(within(list).getByText('beta-labs')).toBeInTheDocument()
    expect(within(list).queryByText('acme')).toBeNull()
    await userEvent.type(screen.getByRole('searchbox'), 'zzz')
    expect(within(list).getByText('No organization matches “BETAzzz”.')).toBeInTheDocument()
  })
})

describe('Organizations as the platform owner', () => {
  it('lists every org through the admin API, imports their own and deletes any', async () => {
    vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'github', id: '9', login: 'owen', name: null, avatarUrl: null, role: 'owner' })
    vi.spyOn(userApi, 'orgs').mockResolvedValue([])
    const adminOrgs = vi.spyOn(adminApi, 'orgs').mockResolvedValue([acme])

    renderAs({ platform: 'github', token: 'gho' }, <Organizations />)
    expect(await screen.findByRole('cell', { name: 'acme' })).toBeInTheDocument()
    expect(adminOrgs).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Import organization/ })).toBeInTheDocument()

    const del = vi.spyOn(adminApi, 'deleteOrg').mockResolvedValue({} as never)
    adminOrgs.mockResolvedValue([])
    await userEvent.click(screen.getByRole('button', { name: 'Remove acme' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))
    expect(del).toHaveBeenCalledWith('org1')
    expect(await screen.findByText('No organizations have been imported yet.')).toBeInTheDocument()
  })
})
