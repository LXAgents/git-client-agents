import { useEffect, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { errorMessage } from '../../services/api'
import { chatApi } from '../../services/chat'
import type { ChatEvent } from '../../types'
import { mergeById, nextActivity, type AgentActivity } from '../../utils/chatEvents'
import { useToast } from '../Toast'
import { ChatMessage } from './ChatMessage'
import { Composer } from './Composer'
import { Markdown } from './Markdown'
import { Pane } from './Pane'
import { useRoomEvents, type PickableRoom } from './ChatRoomContext'

// Live work without a session is an answer to a comment.
const COMMENTS = 'comments'

function ActivityCard({ activity, label }: { activity: AgentActivity; label: string }) {
  return (
    <li role="status" aria-label={label} className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs text-fg-muted">
        <Loader2 aria-hidden className="size-3.5 animate-spin text-accent" />
        <span>{activity.where ? `${activity.where}: ${activity.status}` : activity.status}</span>
      </span>
      {activity.text && (
        <div className="rounded-2xl bg-[color-mix(in_oklch,var(--color-accent)_8%,transparent)] px-3.5 py-2.5 text-[15px] leading-relaxed ring-1 ring-[color-mix(in_oklch,var(--color-accent)_20%,transparent)]">
          <Markdown>{activity.text}</Markdown>
          <span aria-hidden className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-accent align-text-bottom" />
        </div>
      )}
    </li>
  )
}

function activityLabel(key: string, activityId: string | null) {
  if (key === COMMENTS) return 'Agent answering a comment'
  return key === activityId ? 'Agent working' : 'Agent answering in the team chat'
}

// The middle pane: what the agent does in the room. It shows the room's Agent activity session
// (questions asked here, the agent's answers and the reports of answers to comments, in
// Markdown) and, live, the progress and text of every answer the agent is writing in the room.
// Questions typed here go to the activity session, so the agent always answers them.
// Mounted with key={room}, so another room starts from empty state.
export function AgentWorkPane({ room, me }: { room: PickableRoom; me: string | null }) {
  const toast = useToast()
  const [activityId, setActivityId] = useState<string | null>(null)
  const [stored, setStored] = useState<ChatEvent[]>([])
  const [live, setLive] = useState<Record<string, AgentActivity>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let current = true
    chatApi
      .sessions(room.room)
      .then(async (sessions) => {
        const activity = sessions.find((s) => s.activity)
        if (!current || !activity) return
        setActivityId(activity.id)
        const history = await chatApi.messages(room.room, activity.id)
        if (current) setStored((s) => mergeById(history, s))
      })
      .catch((err) => current && toast.error(errorMessage(err)))
      .finally(() => current && setLoading(false))
    return () => {
      current = false
    }
  }, [room.room, toast])

  useRoomEvents((event) => {
    const key = event.sessionId ?? COMMENTS
    if (event.type === 'token' || event.type === 'progress') {
      setLive((l) => ({ ...l, [key]: nextActivity(event, l[key] ?? null) }))
      return
    }
    if (event.sender.type === 'agent') {
      setLive((l) => {
        const next = { ...l }
        delete next[key]
        if (event.type === 'report') delete next[COMMENTS]
        return next
      })
    }
    // Reports always land in the activity session, so the first one names it.
    const inActivity = event.sessionId !== null && (event.sessionId === activityId || (activityId === null && event.type === 'report'))
    if (!inActivity) return
    if (activityId === null) setActivityId(event.sessionId)
    setStored((s) => mergeById(s, [event]))
  })

  const ask = async (content: string) => {
    const posted = await chatApi.post(room.room, content, 'activity')
    setActivityId(posted.sessionId)
    setStored((s) => mergeById(s, [posted.message]))
    if (posted.agent === 'answering') setLive((l) => ({ ...l, [posted.sessionId]: { status: 'Thinking...', text: '' } }))
  }

  const working = Object.entries(live)
  return (
    <Pane
      id="chat-agent-work"
      title="Agent work"
      icon={Sparkles}
      scrollKey={`${stored.length}:${working.map(([, a]) => a.text.length).join(',')}`}
      footer={<Composer label="Ask the agent" placeholder="Ask the agent to do something in this room…" hint="Goes to the room’s Agent activity session. The agent answers every message here." onSend={ask} />}
    >
      <ul aria-label="Agent work" className="space-y-4">
        {stored.length === 0 && working.length === 0 && !loading && (
          <li className="text-sm text-fg-muted">Nothing yet. Answers to comments and questions asked here show up as the agent works.</li>
        )}
        {stored.map((m) => (
          <ChatMessage key={m.id ?? `${m.timestamp}-${m.content.slice(0, 20)}`} event={m} mine={m.sender.type === 'user' && m.sender.id === me} />
        ))}
        {working.map(([key, activity]) => (
          <ActivityCard key={key} activity={activity} label={activityLabel(key, activityId)} />
        ))}
      </ul>
    </Pane>
  )
}
