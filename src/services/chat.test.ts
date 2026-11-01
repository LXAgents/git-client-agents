import { afterEach, describe, expect, it, vi } from 'vitest'
import { openChatStream, parseSse } from './chat'
import { setApiSession } from './api'

const event = (content: string) => ({ type: 'message', room: 'user:1', sessionId: 's1', sender: { id: '1', login: 'a', type: 'user' }, content, timestamp: '2026-11-01T00:00:00Z' })

describe('parseSse', () => {
  it('returns complete data events and keeps the unfinished rest', () => {
    const text = `event: ready\ndata: {"room":"user:1"}\n\n: keep-alive\n\ndata: ${JSON.stringify(event('hi'))}\n\ndata: {"type":"tok`
    const { events, rest } = parseSse(text)
    expect(events.map((e) => e.content)).toEqual(['hi'])
    expect(rest).toBe('data: {"type":"tok')
  })

  it('drops malformed events', () => {
    expect(parseSse('data: not json\n\n').events).toEqual([])
  })
})

describe('openChatStream', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setApiSession(null)
  })

  it('reads events with the session headers, never putting the token in the URL', async () => {
    setApiSession({ platform: 'github', token: 'gho_secret' })
    const encoder = new TextEncoder()
    const body = new ReadableStream({
      start(controller) {
        const raw = `data: ${JSON.stringify(event('one'))}\n\ndata: ${JSON.stringify(event('two'))}\n\n`
        controller.enqueue(encoder.encode(raw.slice(0, 30)))
        controller.enqueue(encoder.encode(raw.slice(30)))
      },
    })
    const fetchMock = vi.fn().mockResolvedValue(new Response(body, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const seen: string[] = []
    const abort = new AbortController()
    const states: boolean[] = []
    openChatStream('user:1', (e) => seen.push(e.content), abort.signal, (c) => states.push(c))
    await vi.waitFor(() => expect(seen).toEqual(['one', 'two']))
    abort.abort()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/api\/chat\/stream\?room=user%3A1$/)
    expect(url).not.toContain('gho_secret')
    expect(init.headers.Authorization).toBe('Bearer gho_secret')
    expect(init.headers['X-Platform']).toBe('github')
    expect(states[0]).toBe(true)
  })

  it('stops on a refused room instead of retrying', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"error":"no"}', { status: 403 }))
    vi.stubGlobal('fetch', fetchMock)
    const states: boolean[] = []
    openChatStream('repo:x', () => {}, new AbortController().signal, (c) => states.push(c))
    await vi.waitFor(() => expect(states).toEqual([false]))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
