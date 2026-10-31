import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { adminApi } from '../services/api'
import { renderAs } from '../test/render'
import type { Account } from '../types'
import { Users } from './Users'

const owen: Account = {
  platform: 'github',
  id: '9',
  login: 'owen',
  name: 'Owen',
  avatarUrl: 'https://avatars.example/9',
  role: 'owner',
  keyCount: 1,
  orgCount: 2,
  createdAt: '2026-10-31T00:00:00Z',
}
const ghost: Account = { ...owen, id: '404', login: '404', name: null, avatarUrl: null, role: 'free' }

describe('Users', () => {
  it('lists users with their platform profile and role, and no Platform column', async () => {
    vi.spyOn(adminApi, 'accounts').mockResolvedValue([owen, ghost])
    renderAs({ platform: 'github', token: 'gho' }, <Users />)
    const table = await screen.findByRole('table', { name: 'Users' })
    const [, first, second] = within(table).getAllByRole('row')
    expect(first).toHaveTextContent('Owen')
    expect(first).toHaveTextContent('@owen')
    expect(within(first).getByText('Owner')).toBeInTheDocument()
    expect(second).toHaveTextContent('404')
    expect(within(second).getByText('Free')).toBeInTheDocument()
    expect(within(table).queryByRole('columnheader', { name: 'Platform' })).toBeNull()
  })

  it('adds a user of the session platform by ID alone', async () => {
    vi.spyOn(adminApi, 'accounts').mockResolvedValue([])
    const create = vi.spyOn(adminApi, 'createAccount').mockResolvedValue({ ...ghost, platform: 'gitlab', id: '7', login: 'carol' })
    renderAs({ platform: 'gitlab', token: 'glpat' }, <Users />)
    await userEvent.click(await screen.findByRole('button', { name: 'Add user' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).queryByLabelText('Platform')).toBeNull()
    expect(within(dialog).queryByLabelText(/Username/)).toBeNull()
    await userEvent.type(within(dialog).getByLabelText(/GitLab user ID/), '7')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add user' }))
    expect(create).toHaveBeenCalledWith({ userId: '7' })
    expect(await screen.findByText('Added carol')).toBeInTheDocument()
  })
})
