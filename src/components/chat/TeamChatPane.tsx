import { useCallback, useEffect, useState } from 'react'
import { MessagesSquare, Plus } from 'lucide-react'
import { errorMessage } from '../../services/api'
import { chatApi } from '../../services/chat'
import type { ChatEvent, ChatSession } from '../../types'
import { mergeById } from '../../utils/chatEvents'
import { Button } from '../Button'
import { useToast } from '../Toast'
import { ChatMessage } from './ChatMessage'
import { Composer } from './Composer'
import { Pane } from './Pane'
import { useRoomEvents, type PickableRoom } from './ChatRoomContext'

const select =
  'h-9 min-w-0 flex-1 rounded-lg border border-line bg-canvas-subtle px-2.5 text-sm text-fg focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:opacity-60'

// Messages of one session, kept with the session they belong to, so switching sessions never
// shows another session's messages for a moment.
interface Scoped {
  sessionId: string | null
  messages: ChatEvent[]
}

// The right pane: people talking in the room's sessions (not the Agent activity session). Only
// `message` events show here; the agent's progress is in the middle pane. In repository and
// organization rooms the agent answers messages that start with @lxagents.
// Mounted with key={room}, so another room starts from empty state.
export function TeamChatPane({ room, me }: { room: PickableRoom; me: string | null }) {
  const toast = useToast()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [stored, setStored] = useState<Scoped>({ sessionId: null, messages: [] })
  const [loading, setLoading] = useState(true)

  const loadSessions = useCallback(async () => {
    const list = (await chatApi.sessions(room.room)).filter((s) => !s.activity)
    setSessions(list)
    return list
  }, [room.room])

  useEffect(() => {
    let current = true
    chatApi
      .sessions(room.room)
      .then((all) => {
        if (!current) return
        const list = all.filter((s) => !s.activity)
        setSessions(list)
        setSessionId((id) => id ?? list[0]?.id ?? null)
      })
      .catch((err) => current && toast.error(errorMessage(err)))
      .finally(() => current && setLoading(false))
    return () => {
      current = false
    }
  }, [room.room, toast])

  useEffect(() => {
    if (!sessionId) return
    let current = true
    chatApi
      .messages(room.room, sessionId)
      .then((list) => current && setStored((s) => ({ sessionId, messages: mergeById(list.filter((m) => m.type === 'message'), s.sessionId === sessionId ? s.messages : []) })))
      .catch((err) => current && toast.error(errorMessage(err)))
    return () => {
      current = false
    }
  }, [room.room, sessionId, toast])

  const append = (event: ChatEvent) => setStored((s) => (s.sessionId === event.sessionId ? { sessionId: s.sessionId, messages: mergeById(s.messages, [event]) } : s))

  useRoomEvents((event) => {
    if (event.type !== 'message' || !event.sessionId) return
    if (event.sessionId === sessionId) append(event)
    // A session someone else just started: refresh the list.
    else if (!sessions.some((s) => s.id === event.sessionId)) void loadSessions().catch(() => {})
  })

  const send = async (content: string) => {
    const posted = await chatApi.post(room.room, content, sessionId)
    if (posted.sessionId !== sessionId) {
      setStored({ sessionId: posted.sessionId, messages: [posted.message] })
      setSessionId(posted.sessionId)
      await loadSessions()
    } else append(posted.message)
  }

  const newSession = async () => {
    try {
      const session = await chatApi.createSession(room.room)
      await loadSessions()
      setSessionId(session.id)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const messages = stored.sessionId === sessionId ? stored.messages : []
  const personal = room.kind === 'user'
  return (
    <Pane
      id="chat-team"
      title={personal ? 'Chat' : 'Team chat'}
      icon={MessagesSquare}
      scrollKey={messages.length}
      toolbar={
        <div className="flex gap-2">
          <select aria-label="Chat session" className={select} value={sessionId ?? ''} onChange={(e) => setSessionId(e.target.value || null)} disabled={sessions.length === 0}>
            {sessions.length === 0 && <option value="">New chat</option>}
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <Button size="sm" variant="ghost" aria-label="New chat session" onClick={() => void newSession()}>
            <Plus aria-hidden className="size-4" /> New
          </Button>
        </div>
      }
      footer={
        <Composer
          label="Message the room"
          placeholder={personal ? 'Message the agent…' : 'Message your team. Start with @lxagents to ask the agent…'}
          hint={personal ? 'Every message in your own chat goes to the agent.' : 'Start a message with @lxagents to ask the agent.'}
          onSend={send}
        />
      }
    >
      <ul aria-label="Team chat messages" className="space-y-4">
        {messages.length === 0 && !loading && <li className="text-sm text-fg-muted">No messages yet.</li>}
        {messages.map((m) => (
          <ChatMessage key={m.id ?? `${m.timestamp}-${m.content.slice(0, 20)}`} event={m} mine={m.sender.type === 'user' && m.sender.id === me} />
        ))}
      </ul>
    </Pane>
  )
}
