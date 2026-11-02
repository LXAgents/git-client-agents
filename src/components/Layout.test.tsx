import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { userApi } from '../services/api'
import { renderAs } from '../test/render'
import { Layout } from './Layout'

describe('Layout', () => {
  it('shows the owner pages and an Owner badge to a user whose role is owner', async () => {
    vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'github', id: '9', login: 'owen', name: null, avatarUrl: null, role: 'owner' })
    renderAs({ platform: 'github', token: 'gho' }, <Layout />)
    expect(await screen.findByRole('link', { name: 'Users' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Logs' })).toBeInTheDocument()
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
      role: 'free',
    })
    const { container } = renderAs({ platform: 'gitlab', token: 'glpat' }, <Layout />)
    expect(await screen.findByText('Carol Danvers')).toBeInTheDocument()
    expect(screen.getByText('@carol')).toBeInTheDocument()
    expect(container.querySelector('img[src="https://gitlab.example/7.png"]')).not.toBeNull()
  })

  it('hides the admin pages from other users and shows them a Free badge', async () => {
    vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'github', id: '1', login: 'alice', name: null, avatarUrl: null, role: 'free' })
    renderAs({ platform: 'github', token: 'ghp' }, <Layout />)
    expect(await screen.findByText('alice')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Users' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Logs' })).toBeNull()
    expect(screen.queryByText('Owner')).toBeNull()
    const free = screen.getByText('Free')
    expect(free.className).toContain('--color-free')
  })

  it('gives the Chat page the full width and keeps other pages in a column', async () => {
    vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'github', id: '1', login: 'alice', name: null, avatarUrl: null, role: 'free' })
    const chat = renderAs({ platform: 'github', token: 'ghp' }, <Layout />, '/chat')
    expect(await screen.findByText('alice')).toBeInTheDocument()
    expect(chat.container.querySelector('main > div')).toHaveAttribute('data-width', 'full')
    chat.unmount()
    const keys = renderAs({ platform: 'github', token: 'ghp' }, <Layout />, '/keys')
    expect(await screen.findByText('alice')).toBeInTheDocument()
    expect(keys.container.querySelector('main > div')).toHaveAttribute('data-width', 'column')
  })
})
