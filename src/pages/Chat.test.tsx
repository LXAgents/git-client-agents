import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { userApi } from '../services/api'
import { chatApi } from '../services/chat'
import { renderAs } from '../test/render'
import type { ChatEvent } from '../types'
import { Chat } from './Chat'

const encoder = new TextEncoder()
// Each room's stream: tests push events into the room they want.
const streams = new Map<string, ReadableStreamDefaultController<Uint8Array>>()
const push = (room: string, e: Partial<ChatEvent>) => streams.get(room)!.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`))
const AGENT = { id: 'lxagents', login: 'LXAgents', type: 'agent' as const }
const ts = '2026-11-01T10:00:00.000Z'

describe('Chat', () => {
  beforeEach(() => {
    streams.clear()
    vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'github', id: '1001', login: 'alice', name: null, avatarUrl: null, role: 'free' as const })
    vi.spyOn(chatApi, 'rooms').mockResolvedValue({
      user: { room: 'user:1001', name: 'alice' },
      repos: [
        { room: 'repo:r1', name: 'acme/web' },
        { room: 'repo:r2', name: 'acme/docs' },
      ],
      orgs: [],
    })
    vi.spyOn(chatApi, 'sessions').mockResolvedValue([])
    vi.spyOn(chatApi, 'messages').mockResolvedValue([])
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const room = decodeURIComponent(new URL(url).searchParams.get('room')!)
        return new Response(new ReadableStream({ start: (c) => void streams.set(room, c) }), { status: 200 })
      }),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('shows three panes and says when there is no organization to join', async () => {
    renderAs({ platform: 'github', token: 'gho' }, <Chat />)
    expect(await screen.findByRole('region', { name: /My chat/ })).toBeInTheDocument()
    const repo = screen.getByRole('region', { name: /Repository/ })
    expect(within(repo).getByLabelText('Repository room')).toHaveDisplayValue('acme/web')
    const org = screen.getByRole('region', { name: /Organization/ })
    expect(within(org).getByText('No imported organization you are in yet.')).toBeInTheDocument()
  })

  it('sends a message, streams the agent text with progress, then shows the answer', async () => {
    const post = vi.spyOn(chatApi, 'post').mockResolvedValue({
      sessionId: 's1',
      agent: 'answering',
      message: { id: 'm1', type: 'message', room: 'user:1001', sessionId: 's1', sender: { id: '1001', login: 'alice', type: 'user' }, content: 'Run the tests', timestamp: ts },
    })
    vi.spyOn(chatApi, 'sessions').mockResolvedValueOnce([]).mockResolvedValue([{ id: 's1', room: 'user:1001', title: 'Run the tests', createdBy: 'github:1001', createdAt: ts, updatedAt: ts }])
    renderAs({ platform: 'github', token: 'gho' }, <Chat />)
    const pane = await screen.findByRole('region', { name: /My chat/ })
    await vi.waitFor(() => expect(streams.has('user:1001')).toBe(true))

    await userEvent.type(within(pane).getByLabelText('Message My chat'), 'Run the tests{Enter}')
    expect(post).toHaveBeenCalledWith('user:1001', 'Run the tests', null)
    expect(await within(pane).findByText('Run the tests', { selector: 'div' })).toBeInTheDocument()

    push('user:1001', { type: 'progress', room: 'user:1001', sessionId: 's1', sender: AGENT, content: 'Creating GitHub Codespace...', data: { status: 'Creating GitHub Codespace...', tool: 'create_workspace' }, timestamp: ts })
    push('user:1001', { type: 'token', room: 'user:1001', sessionId: 's1', sender: AGENT, content: 'All ', timestamp: ts })
    push('user:1001', { type: 'token', room: 'user:1001', sessionId: 's1', sender: AGENT, content: 'green', timestamp: ts })
    const status = await within(pane).findByRole('status', { name: 'My chat: agent working' })
    expect(status).toHaveTextContent('Creating GitHub Codespace...')
    await vi.waitFor(() => expect(status).toHaveTextContent('All green'))

    push('user:1001', { id: 'm2', type: 'message', room: 'user:1001', sessionId: 's1', sender: AGENT, content: 'All green: 236 tests pass.', data: { model: 'gpt-5' }, timestamp: '2026-11-01T10:01:00.000Z' })
    expect(await within(pane).findByText('All green: 236 tests pass.')).toBeInTheDocument()
    expect(within(pane).queryByRole('status')).toBeNull()
  })

  it('shows an answer to a comment live in the repository room until its report', async () => {
    renderAs({ platform: 'github', token: 'gho' }, <Chat />)
    const pane = await screen.findByRole('region', { name: /Repository/ })
    await vi.waitFor(() => expect(streams.has('repo:r1')).toBe(true))
    push('repo:r1', { type: 'progress', room: 'repo:r1', sessionId: null, sender: AGENT, content: 'Answering @bob on acme/web#12', data: { status: 'Answering @bob on acme/web#12', where: 'acme/web#12' }, timestamp: ts })
    const status = await within(pane).findByRole('status', { name: 'Repository: agent answering a comment' })
    expect(status).toHaveTextContent('acme/web#12')
    push('repo:r1', { id: 'r1', type: 'report', room: 'repo:r1', sessionId: 'act', sender: AGENT, content: 'Done', timestamp: ts })
    await vi.waitFor(() => expect(within(pane).queryByRole('status')).toBeNull())
  })
})
