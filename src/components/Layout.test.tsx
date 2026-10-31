import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { userApi } from '../services/api'
import { renderAs } from '../test/render'
import { Layout } from './Layout'

describe('Layout', () => {
  it('shows the owner pages and an Owner badge to a user whose role is owner', async () => {
    vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'github', id: '9', login: 'owen', name: null, avatarUrl: null, role: 'owner' })
    renderAs({ mode: 'user', platform: 'github', token: 'gho' }, <Layout />)
    expect(await screen.findByRole('link', { name: 'Users' })).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('owen')).toBeInTheDocument()
  })

  it('shows the avatar, name and login the platform reports', async () => {
    vi.spyOn(userApi, 'me').mockResolvedValue({
      platform: 'gitlab',
      id: '7',
      login: 'carol',
      name: 'Carol Danvers',
      avatarUrl: 'https://gitlab.example/7.png',
      role: 'member',
    })
    const { container } = renderAs({ mode: 'user', platform: 'gitlab', token: 'glpat' }, <Layout />)
    expect(await screen.findByText('Carol Danvers')).toBeInTheDocument()
    expect(screen.getByText('@carol')).toBeInTheDocument()
    expect(container.querySelector('img[src="https://gitlab.example/7.png"]')).not.toBeNull()
  })

  it('hides the admin pages from other users', async () => {
    vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'github', id: '1', login: 'alice', name: null, avatarUrl: null, role: 'member' })
    renderAs({ mode: 'user', platform: 'github', token: 'ghp' }, <Layout />)
    expect(await screen.findByText('alice')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Users' })).toBeNull()
    expect(screen.queryByText('Owner')).toBeNull()
  })
})
