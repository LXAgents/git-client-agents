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
  owner: { platform: 'github', id: '1001', username: 'alice' },
  keyCount: 1,
  createdAt: '2026-10-31T00:00:00Z',
}

describe('Organizations as a user', () => {
  beforeEach(() => {
    vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'github', id: '1001', login: 'alice', username: 'alice' })
  })

  it('imports only from the orgs the platform says the user owns', async () => {
    const orgs = vi.spyOn(userApi, 'orgs').mockResolvedValueOnce([]).mockResolvedValue([acme])
    vi.spyOn(userApi, 'importable').mockResolvedValue([
      { name: 'acme', kind: 'org', importable: true, reason: null, appInstallationId: null },
      { name: 'no-app', kind: 'org', importable: false, reason: 'GitHub App is not installed', appInstallationId: null },
    ])
    const importOrg = vi.spyOn(userApi, 'importOrg').mockResolvedValue(acme)

    renderAs({ mode: 'user', platform: 'github', token: 'ghp' }, <Organizations />)
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
})

describe('Organizations as the operator', () => {
  it('lists and deletes orgs but offers no way to add one', async () => {
    vi.spyOn(adminApi, 'accounts').mockResolvedValue([])
    vi.spyOn(adminApi, 'orgs').mockResolvedValueOnce([acme]).mockResolvedValue([])
    const del = vi.spyOn(adminApi, 'deleteOrg').mockResolvedValue({} as never)

    renderAs({ mode: 'admin', token: 'admin' }, <Organizations />)
    expect(await screen.findByRole('cell', { name: 'acme' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Import/ })).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Remove acme' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))
    expect(del).toHaveBeenCalledWith('org1')
    expect(await screen.findByText('No organizations have been imported yet.')).toBeInTheDocument()
  })
})
