import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { userApi } from '../services/api'
import { chatApi } from '../services/chat'
import { renderAs } from '../test/render'
import type { ChatEvent, ChatSession, ChatSummary } from '../types'
import { Chat } from './Chat'

const encoder = new TextEncoder()
// Each room's stream: tests push events into the room they want.
const streams = new Map<string, ReadableStreamDefaultController<Uint8Array>>()
const opened: string[] = []
const push = (room: string, e: Partial<ChatEvent>) => streams.get(room)!.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`))
const AGENT = { id: 'lxagents', login: 'LXAgents', type: 'agent' as const }
const ALICE = { id: '1001', login: 'alice', type: 'user' as const }
const BOB = { id: '1002', login: 'bob', type: 'user' as const, avatarUrl: 'https://avatars.example/bob' }
const ts = '2026-11-01T10:00:00.000Z'
const later = '2026-11-01T10:05:00.000Z'

const session = (id: string, title: string, activity = false): ChatSession => ({ id, room: 'repo:r1', title, createdBy: activity ? null : 'github:1002', activity, createdAt: ts, updatedAt: ts })
const event = (fields: Partial<ChatEvent>): ChatEvent => ({ type: 'message', room: 'repo:r1', sessionId: 's1', sender: ALICE, content: '', timestamp: ts, ...fields })

const summary: ChatSummary = {
  room: { room: 'repo:r1', kind: 'repo', name: 'acme/web', platform: 'github' },
  model: { provider: 'anthropic', providerName: 'Anthropic', model: 'claude-x', source: 'repo' },
  keys: { ai: { repo: 1, org: 0, user: 1, total: 2 }, workspace: { provider: 'github_codespaces', providerName: 'GitHub Codespaces', repo: 0, org: 0, user: 0, total: 0 } },
  stats: { answers: 3, inputTokens: 1200, outputTokens: 34, costUsd: 0.0123, costComplete: false, tokensComplete: true, answersWithoutUsage: 1, capped: false },
}

const pane = (name: RegExp) => screen.findByRole('region', { name })

describe('Chat', () => {
  beforeEach(() => {
    streams.clear()
    opened.length = 0
    vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'github', id: '1001', login: 'alice', name: null, avatarUrl: null, role: 'free' as const })
    vi.spyOn(chatApi, 'rooms').mockResolvedValue({
      user: { room: 'user:1001', name: 'alice' },
      repos: [
        { room: 'repo:r1', name: 'acme/web' },
        { room: 'repo:r2', name: 'acme/docs' },
      ],
      orgs: [{ room: 'org:o1', name: 'acme' }],
    })
    vi.spyOn(chatApi, 'summary').mockResolvedValue(summary)
    vi.spyOn(chatApi, 'sessions').mockResolvedValue([session('s1', 'Release talk'), session('act', 'Agent activity', true)])
    vi.spyOn(chatApi, 'messages').mockImplementation(async (_room, sessionId) =>
      sessionId === 'act'
        ? [event({ id: 'a1', type: 'report', sessionId: 'act', sender: AGENT, content: 'Fixed **two** tests. <img src=x onerror="alert(1)">', data: { model: 'claude-x', cost: '$0.01' } })]
        : [event({ id: 'm1', sender: BOB, content: 'Ship it today?' }), event({ id: 'm2', content: 'Yes', timestamp: later })],
    )
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const room = decodeURIComponent(new URL(url).searchParams.get('room')!)
        opened.push(room)
        expect(new Headers(init?.headers).get('authorization')).toBe('Bearer gho')
        expect(new Headers(init?.headers).get('x-platform')).toBe('github')
        return new Response(new ReadableStream({ start: (c) => void streams.set(room, c) }), { status: 200 })
      }),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('picks the first repository and shows its details from the summary', async () => {
    renderAs({ platform: 'github', token: 'gho' }, <Chat />)
    const picker = await screen.findByLabelText('Room')
    expect(picker).toHaveDisplayValue('acme/web')
    expect(within(picker).getAllByRole('option').map((o) => o.textContent)).toEqual(['My chat (@alice)', 'acme/web', 'acme/docs', 'acme'])
    const details = await pane(/Room details/)
    expect(await within(details).findByText('claude-x')).toBeInTheDocument()
    expect(within(details).getByText('from the repository setting')).toBeInTheDocument()
    expect(within(details).getByRole('group', { name: 'Keys' })).toHaveTextContent('2 active')
    expect(within(details).getByRole('group', { name: 'Keys' })).toHaveTextContent('No key')
    expect(within(details).getByText((1234).toLocaleString())).toBeInTheDocument()
    expect(within(details).getByText('at least $0.0123')).toBeInTheDocument()
    expect(within(details).getByText('1 without usage data')).toBeInTheDocument()
    await vi.waitFor(() => expect(opened).toEqual(['repo:r1']))
  })

  it('splits the panes 10/45/45: details, agent work, team chat', async () => {
    renderAs({ platform: 'github', token: 'gho' }, <Chat />)
    const details = await pane(/Room details/)
    const grid = details.parentElement!
    expect(grid.className).toContain('lg:grid-cols-[1fr_4.5fr_4.5fr]')
    expect([...grid.children].map((c) => c.getAttribute('aria-labelledby'))).toEqual(['chat-details', 'chat-agent-work', 'chat-team'])
  })

  it('opens one stream per room and a new one when the room changes', async () => {
    renderAs({ platform: 'github', token: 'gho' }, <Chat />)
    await vi.waitFor(() => expect(opened).toEqual(['repo:r1']))
    await userEvent.selectOptions(screen.getByLabelText('Room'), 'org:o1')
    await vi.waitFor(() => expect(opened).toEqual(['repo:r1', 'org:o1']))
    expect(chatApi.summary).toHaveBeenLastCalledWith('org:o1')
  })

  it('shows the agent work in Markdown, asks in the activity session and streams progress', async () => {
    const post = vi.spyOn(chatApi, 'post').mockResolvedValue({ sessionId: 'act', agent: 'answering', message: event({ id: 'q1', sessionId: 'act', content: 'Run the tests', timestamp: later }) })
    renderAs({ platform: 'github', token: 'gho' }, <Chat />)
    const work = await pane(/Agent work/)
    const bold = await within(work).findByText('two')
    expect(bold.tagName).toBe('STRONG')
    // Raw HTML in an answer is text, never an element.
    expect(work.querySelector('img[src="x"]')).toBeNull()
    await vi.waitFor(() => expect(streams.has('repo:r1')).toBe(true))

    await userEvent.type(within(work).getByLabelText('Ask the agent'), 'Run the tests{Enter}')
    expect(post).toHaveBeenCalledWith('repo:r1', 'Run the tests', 'activity')
    expect(await within(work).findByText('Run the tests')).toBeInTheDocument()

    push('repo:r1', { type: 'progress', room: 'repo:r1', sessionId: 'act', sender: AGENT, content: 'Creating GitHub Codespace...', data: { status: 'Creating GitHub Codespace...', tool: 'create_workspace' }, timestamp: later })
    push('repo:r1', { type: 'token', room: 'repo:r1', sessionId: 'act', sender: AGENT, content: 'All ', timestamp: later })
    push('repo:r1', { type: 'token', room: 'repo:r1', sessionId: 'act', sender: AGENT, content: 'green', timestamp: later })
    const status = await within(work).findByRole('status', { name: 'Agent working' })
    expect(status).toHaveTextContent('Creating GitHub Codespace...')
    await vi.waitFor(() => expect(status).toHaveTextContent('All green'))

    push('repo:r1', { id: 'a2', type: 'message', room: 'repo:r1', sessionId: 'act', sender: AGENT, content: 'All green: `236` tests pass.', data: { model: 'claude-x' }, timestamp: '2026-11-01T10:06:00.000Z' })
    expect((await within(work).findByText('236')).tagName).toBe('CODE')
    expect(within(work).queryByRole('status')).toBeNull()
  })

  it('shows an answer to a comment live until its report', async () => {
    renderAs({ platform: 'github', token: 'gho' }, <Chat />)
    const work = await pane(/Agent work/)
    await vi.waitFor(() => expect(streams.has('repo:r1')).toBe(true))
    push('repo:r1', { type: 'progress', room: 'repo:r1', sessionId: null, sender: AGENT, content: 'Answering @bob on acme/web#12', data: { status: 'Answering @bob on acme/web#12', where: 'acme/web#12' }, timestamp: ts })
    expect(await within(work).findByRole('status', { name: 'Agent answering a comment' })).toHaveTextContent('acme/web#12')
    push('repo:r1', { id: 'r9', type: 'report', room: 'repo:r1', sessionId: 'act', sender: AGENT, content: 'Done with #12', timestamp: later })
    expect(await within(work).findByText('Done with #12')).toBeInTheDocument()
    expect(within(work).queryByRole('status')).toBeNull()
  })

  it('the team chat shows messages only, tells senders apart and reminds about @lxagents', async () => {
    const post = vi.spyOn(chatApi, 'post').mockResolvedValue({ sessionId: 's1', agent: 'idle', message: event({ id: 'm3', content: 'Merging now', timestamp: '2026-11-01T10:07:00.000Z' }) })
    renderAs({ platform: 'github', token: 'gho' }, <Chat />)
    const team = await pane(/Team chat/)
    await vi.waitFor(() => expect(within(team).getByLabelText('Chat session')).toHaveDisplayValue('Release talk'))
    // The activity session is not a team chat session.
    expect(within(within(team).getByLabelText('Chat session')).queryByText('Agent activity')).toBeNull()
    const bob = (await within(team).findByText('Ship it today?')).closest('li')!
    expect(bob).toHaveAttribute('data-sender', 'other')
    expect(within(bob).getByText('@bob')).toBeInTheDocument()
    expect(bob.querySelector('img')).toHaveAttribute('src', 'https://avatars.example/bob')
    expect(within(team).getByText('Yes').closest('li')).toHaveAttribute('data-sender', 'me')

    await vi.waitFor(() => expect(streams.has('repo:r1')).toBe(true))
    push('repo:r1', { type: 'progress', room: 'repo:r1', sessionId: 's1', sender: AGENT, content: 'Reading files', timestamp: later })
    push('repo:r1', { id: 'm4', type: 'message', room: 'repo:r1', sessionId: 's1', sender: AGENT, content: 'Looks **good**', timestamp: '2026-11-01T10:06:00.000Z' })
    expect((await within(team).findByText('good')).closest('li')).toHaveAttribute('data-sender', 'agent')
    expect(within(team).queryByText('Reading files')).toBeNull()

    const box = within(team).getByLabelText('Message the room')
    expect(box).toHaveAttribute('placeholder', expect.stringContaining('@lxagents'))
    await userEvent.type(box, 'Merging now{Enter}')
    expect(post).toHaveBeenCalledWith('repo:r1', 'Merging now', 's1')
    expect(await within(team).findByText('Merging now')).toBeInTheDocument()
  })
})
