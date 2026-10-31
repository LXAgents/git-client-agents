import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { userApi } from '../services/api'
import { renderAs } from '../test/render'
import { Layout } from './Layout'

describe('Layout', () => {
  it('shows the admin pages and an Admin badge to a user listed in GITHUB_ADMIN_ID', async () => {
    vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'github', id: '9', login: 'owen', username: 'owen', isAdmin: true })
    renderAs({ mode: 'user', platform: 'github', token: 'gho' }, <Layout />)
    expect(await screen.findByRole('link', { name: 'Users' })).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('owen')).toBeInTheDocument()
  })

  it('hides the admin pages from other users', async () => {
    vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'github', id: '1', login: 'alice', username: 'alice', isAdmin: false })
    renderAs({ mode: 'user', platform: 'github', token: 'ghp' }, <Layout />)
    expect(await screen.findByText('alice')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Users' })).toBeNull()
    expect(screen.queryByText('Admin')).toBeNull()
  })
})
