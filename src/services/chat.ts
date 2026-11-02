import { api, sessionHeaders } from './api'
import { apiBaseUrl } from '../config'
import { trimTrailingSlashes } from '../utils/strings'
import type { ChatEvent, ChatRooms, ChatSession, ChatSummary, PostedChatMessage } from '../types'

const data = <T>(p: Promise<{ data: T }>) => p.then((r) => r.data)

// The chat API (/api/chat). The server checks the room on the platform for every call.
export const chatApi = {
  rooms: () => data(api.get<ChatRooms>('/api/chat/rooms')),
  summary: (room: string) => data(api.get<ChatSummary>('/api/chat/summary', { params: { room } })),
  sessions: (room: string) => data(api.get<ChatSession[]>('/api/chat/sessions', { params: { room } })),
  createSession: (room: string, title?: string) => data(api.post<ChatSession>('/api/chat/sessions', { room, title })),
  renameSession: (room: string, id: string, title: string) => data(api.patch<ChatSession>(`/api/chat/sessions/${id}`, { room, title })),
  deleteSession: (room: string, id: string) => api.delete(`/api/chat/sessions/${id}`, { params: { room } }),
  messages: (room: string, sessionId: string) => data(api.get<ChatEvent[]>('/api/chat/messages', { params: { room, sessionId } })),
  /** sessionId "activity" posts to the room's Agent activity session, always for the agent. */
  post: (room: string, content: string, sessionId?: string | null) => data(api.post<PostedChatMessage>('/api/chat/messages', { room, content, sessionId: sessionId ?? undefined })),
}

// Splits Server-Sent Events text into complete events. Returns the events and what is left over
// (an event not finished yet). Comments (": keep-alive") and named events other than the default
// one are skipped.
export function parseSse(buffer: string): { events: ChatEvent[]; rest: string } {
  const events: ChatEvent[] = []
  const blocks = buffer.replace(/\r\n/g, '\n').split('\n\n')
  const rest = blocks.pop() ?? ''
  for (const block of blocks) {
    const lines = block.split('\n')
    if (lines.some((l) => l.startsWith('event:'))) continue
    const payload = lines
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trimStart())
      .join('\n')
    if (!payload) continue
    try {
      events.push(JSON.parse(payload) as ChatEvent)
    } catch {
      // A malformed event is dropped; the next one still arrives.
    }
  }
  return { events, rest }
}

// Opens the room's event stream with fetch, so the token stays in the Authorization header (an
// EventSource can't send headers, and the token must never go in a URL). Reconnects after a drop,
// waiting longer each time, until `signal` aborts. `onState` hears whether it is connected.
export function openChatStream(room: string, onEvent: (event: ChatEvent) => void, signal: AbortSignal, onState: (connected: boolean) => void = () => {}): void {
  const url = `${trimTrailingSlashes(apiBaseUrl())}/api/chat/stream?room=${encodeURIComponent(room)}`
  let delay = 1000
  const connect = async () => {
    while (!signal.aborted) {
      try {
        const res = await fetch(url, { headers: { ...sessionHeaders(), Accept: 'text/event-stream' }, signal })
        // 4xx means this room is not ours (or no longer): retrying will not help.
        if (res.status >= 400 && res.status < 500) {
          onState(false)
          return
        }
        if (!res.ok || !res.body) throw new Error(`stream answered ${res.status}`)
        onState(true)
        delay = 1000
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          const parsed = parseSse(buffer + decoder.decode(value, { stream: true }))
          buffer = parsed.rest
          for (const event of parsed.events) onEvent(event)
        }
      } catch {
        if (signal.aborted) return
      }
      onState(false)
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay = Math.min(delay * 2, 30_000)
    }
  }
  void connect()
}
