import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '../components/Toast'
import { errorMessage } from '../services/api'
import { chatApi, openChatStream } from '../services/chat'
import type { ChatEvent, ChatSession } from '../types'

export interface AgentActivity {
  status: string
  tool?: string
  /** Text the agent is writing right now, streamed token by token. */
  text: string
  where?: string
}

// Per-session state, kept with the session it belongs to, so switching sessions shows nothing
// stale without resetting state in an effect.
interface Scoped<T> {
  sessionId: string | null
  value: T
}

function nextActivity(event: ChatEvent, a: AgentActivity | null): AgentActivity {
  if (event.type === 'token') return { status: a?.status ?? 'Writing...', tool: a?.tool, where: a?.where, text: `${a?.text ?? ''}${event.content}` }
  return { status: event.data?.status ?? event.content, tool: event.data?.tool, where: event.data?.where ?? a?.where, text: event.data?.reset ? '' : (a?.text ?? '') }
}

// One chat room: its sessions, the selected session's messages, and the agent's live activity.
// Live activity in the selected session shows under its messages; activity of answers to comments
// (no session) shows for the whole room until their report arrives. Mount it with key={room}, so
// a new room starts from empty state.
export function useChatRoom(room: string | null) {
  const toast = useToast()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [stored, setStored] = useState<Scoped<ChatEvent[]>>({ sessionId: null, value: [] })
  const [live, setLive] = useState<Scoped<AgentActivity | null>>({ sessionId: null, value: null })
  const [roomActivity, setRoomActivity] = useState<AgentActivity | null>(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(Boolean(room))
  const selected = useRef<string | null>(null)

  useEffect(() => {
    selected.current = sessionId
  }, [sessionId])

  const loadSessions = useCallback(async () => {
    if (!room) return []
    const list = await chatApi.sessions(room)
    setSessions(list)
    return list
  }, [room])

  // The room's sessions, the latest one selected.
  useEffect(() => {
    if (!room) return
    let current = true
    chatApi
      .sessions(room)
      .then((list) => {
        if (!current) return
        setSessions(list)
        setSessionId((id) => id ?? list[0]?.id ?? null)
      })
      .catch((err) => current && toast.error(errorMessage(err)))
      .finally(() => current && setLoading(false))
    return () => {
      current = false
    }
  }, [room, toast])

  // The selected session's stored messages.
  useEffect(() => {
    if (!room || !sessionId) return
    let current = true
    chatApi
      .messages(room, sessionId)
      .then((list) => current && setStored((s) => ({ sessionId, value: mergeById(list, s.sessionId === sessionId ? s.value : []) })))
      .catch((err) => current && toast.error(errorMessage(err)))
    return () => {
      current = false
    }
  }, [room, sessionId, toast])

  const append = useCallback((event: ChatEvent) => {
    setStored((s) => {
      const list = s.sessionId === event.sessionId ? s.value : []
      return { sessionId: event.sessionId, value: mergeById(list, [event]) }
    })
  }, [])

  // The live stream for the room.
  useEffect(() => {
    if (!room) return
    const abort = new AbortController()
    const known = new Set<string>()
    openChatStream(
      room,
      (event) => {
        const mine = event.sessionId !== null && event.sessionId === selected.current
        if (event.type === 'token' || event.type === 'progress') {
          if (event.sessionId === null) setRoomActivity((a) => nextActivity(event, a))
          else if (mine) setLive((l) => ({ sessionId: event.sessionId, value: nextActivity(event, l.sessionId === event.sessionId ? l.value : null) }))
          return
        }
        if (mine) append(event)
        if (event.sender.type === 'agent') {
          if (mine) setLive({ sessionId: event.sessionId, value: null })
          if (event.type === 'report') setRoomActivity(null)
        }
        // A session someone else may have just started: refresh the list once.
        if (event.sessionId && !known.has(event.sessionId)) {
          known.add(event.sessionId)
          void loadSessions().catch(() => {})
        }
      },
      abort.signal,
      setConnected,
    )
    return () => abort.abort()
  }, [room, append, loadSessions])

  const send = useCallback(
    async (content: string) => {
      if (!room) return
      const posted = await chatApi.post(room, content, selected.current)
      if (posted.sessionId !== selected.current) {
        selected.current = posted.sessionId
        setSessionId(posted.sessionId)
        await loadSessions()
      }
      append(posted.message)
      if (posted.agent === 'answering') setLive({ sessionId: posted.sessionId, value: { status: 'Thinking...', text: '' } })
    },
    [room, append, loadSessions],
  )

  const newSession = useCallback(async () => {
    if (!room) return
    const session = await chatApi.createSession(room)
    await loadSessions()
    selected.current = session.id
    setSessionId(session.id)
  }, [room, loadSessions])

  const selectSession = useCallback((id: string | null) => {
    selected.current = id
    setSessionId(id)
  }, [])

  return {
    sessions,
    sessionId,
    selectSession,
    messages: stored.sessionId === sessionId ? stored.value : [],
    activity: live.sessionId === sessionId ? live.value : null,
    roomActivity,
    connected,
    loading,
    send,
    newSession,
  }
}

// Stored events in time order, each once.
function mergeById(a: ChatEvent[], b: ChatEvent[]): ChatEvent[] {
  const seen = new Set<string>()
  const out: ChatEvent[] = []
  for (const e of [...a, ...b]) {
    if (e.id) {
      if (seen.has(e.id)) continue
      seen.add(e.id)
    }
    out.push(e)
  }
  return out.sort((x, y) => x.timestamp.localeCompare(y.timestamp))
}
