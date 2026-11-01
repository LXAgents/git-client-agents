import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { Loader2, Plus, Send, type LucideIcon } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useChatRoom, type AgentActivity } from '../../hooks/useChatRoom'
import { errorMessage } from '../../services/api'
import type { ChatRoom } from '../../types'
import { Button } from '../Button'
import { useToast } from '../Toast'
import { ChatMessage } from './ChatMessage'

const select =
  'h-9 min-w-0 flex-1 rounded-lg border border-line bg-canvas-subtle px-2.5 text-sm text-fg focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:opacity-60'

function Activity({ activity, label }: { activity: AgentActivity; label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-xs text-fg-muted">
        <Loader2 aria-hidden className="size-3.5 animate-spin text-accent" />
        <span>{activity.where ? `${activity.where}: ${activity.status}` : activity.status}</span>
      </span>
      {activity.text && (
        <div className="max-w-[92%] rounded-2xl bg-[color-mix(in_oklch,var(--color-accent)_8%,transparent)] px-3.5 py-2.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap ring-1 ring-[color-mix(in_oklch,var(--color-accent)_20%,transparent)]">
          {activity.text}
          <span aria-hidden className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-accent align-text-bottom" />
        </div>
      )}
    </div>
  )
}

interface Props {
  title: string
  icon: LucideIcon
  /** The rooms to pick from; one room means no picker. */
  rooms: ChatRoom[]
  empty: string
  hint: ReactNode
}

// One pane of the chat page: a room picker, then the room itself. The room view is keyed by the
// room, so picking another one starts from empty state.
export function ChatPane(props: Props) {
  const [room, setRoom] = useState<string | null>(props.rooms[0]?.room ?? null)
  return <RoomView key={room ?? 'none'} {...props} room={room} setRoom={setRoom} />
}

// A room's sessions, the messages, the agent's live activity, and the send box. Enter sends;
// Shift+Enter adds a line.
function RoomView({ title, icon: Icon, rooms, empty, hint, room, setRoom }: Props & { room: string | null; setRoom: (room: string) => void }) {
  const toast = useToast()
  const { me } = useAuth()
  const chat = useChatRoom(room)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const list = useRef<HTMLDivElement>(null)

  // Keeps the newest message in view.
  useEffect(() => {
    const el = list.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat.messages, chat.activity, chat.roomActivity])

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    try {
      await chat.send(content)
      setDraft('')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void submit()
    }
  }

  const headingId = `chat-${title.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <section aria-labelledby={headingId} className="flex h-[72dvh] min-h-[28rem] flex-col rounded-2xl border border-line bg-canvas-subtle shadow-card">
      <header className="space-y-3 border-b border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 id={headingId} className="flex items-center gap-2 text-base font-semibold">
            <Icon aria-hidden className="size-4 text-fg-muted" /> {title}
          </h2>
          <span className={`flex items-center gap-1.5 text-xs ${chat.connected ? 'text-success' : 'text-fg-muted'}`}>
            <span aria-hidden className={`size-1.5 rounded-full ${chat.connected ? 'bg-success' : 'bg-fg-muted'}`} />
            {chat.connected ? 'Live' : room ? 'Connecting…' : 'Offline'}
          </span>
        </div>
        {rooms.length > 1 && (
          <select aria-label={`${title} room`} className={`${select} w-full`} value={room ?? ''} onChange={(e) => setRoom(e.target.value)}>
            {rooms.map((r) => (
              <option key={r.room} value={r.room}>
                {r.name}
              </option>
            ))}
          </select>
        )}
        {room && (
          <div className="flex gap-2">
            <select aria-label={`${title} session`} className={select} value={chat.sessionId ?? ''} onChange={(e) => chat.selectSession(e.target.value || null)} disabled={chat.sessions.length === 0}>
              {chat.sessions.length === 0 && <option value="">New chat</option>}
              {chat.sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <Button size="sm" variant="ghost" aria-label={`New ${title} session`} onClick={() => void chat.newSession().catch((err) => toast.error(errorMessage(err)))}>
              <Plus aria-hidden className="size-4" /> New
            </Button>
          </div>
        )}
      </header>

      <div ref={list} className="flex-1 overflow-y-auto p-4">
        {!room ? (
          <p className="text-sm text-fg-muted">{empty}</p>
        ) : (
          <ul aria-label={`${title} messages`} className="space-y-4">
            {chat.messages.length === 0 && !chat.loading && <li className="text-sm text-fg-muted">No messages yet. {hint}</li>}
            {chat.messages.map((m) => (
              <ChatMessage key={m.id ?? `${m.timestamp}-${m.content.slice(0, 20)}`} event={m} mine={m.sender.type === 'user' && m.sender.id === me?.id} />
            ))}
            {chat.activity && (
              <li>
                <Activity activity={chat.activity} label={`${title}: agent working`} />
              </li>
            )}
            {chat.roomActivity && (
              <li>
                <Activity activity={chat.roomActivity} label={`${title}: agent answering a comment`} />
              </li>
            )}
          </ul>
        )}
      </div>

      <form onSubmit={submit} className="border-t border-line p-3">
        <div className="flex items-end gap-2">
          <textarea
            aria-label={`Message ${title}`}
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            disabled={!room}
            placeholder={room ? 'Write a message…' : ''}
            className="block max-h-40 min-h-10 flex-1 resize-y rounded-xl border border-line bg-canvas px-3 py-2 text-[15px] text-fg placeholder:text-fg-muted/70 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:opacity-60"
          />
          <Button type="submit" variant="primary" aria-label={`Send to ${title}`} busy={sending} disabled={!room || !draft.trim()}>
            <Send aria-hidden className="size-4" />
          </Button>
        </div>
        {room && <p className="mt-1.5 text-xs text-fg-muted">{hint}</p>}
      </form>
    </section>
  )
}
