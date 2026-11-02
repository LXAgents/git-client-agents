import type { ChatEvent } from '../../types'
import { messageTime } from '../../utils/chatEvents'
import { Avatar } from './Avatar'
import { Markdown } from './Markdown'

const TONES = {
  error: 'bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] ring-1 ring-[color-mix(in_oklch,var(--color-danger)_30%,transparent)]',
  agent: 'bg-[color-mix(in_oklch,var(--color-accent)_8%,transparent)] ring-1 ring-[color-mix(in_oklch,var(--color-accent)_20%,transparent)]',
  mine: 'bg-[color-mix(in_oklch,var(--color-accent-2)_10%,transparent)] ring-1 ring-[color-mix(in_oklch,var(--color-accent-2)_22%,transparent)]',
  other: 'bg-canvas ring-1 ring-line',
}

function tone(event: ChatEvent, mine: boolean) {
  if (event.data?.error) return TONES.error
  if (event.sender.type === 'agent') return TONES.agent
  return mine ? TONES.mine : TONES.other
}

// One stored message or report, with the sender's avatar and name. Yours sit on the right, other
// people's on the left, and the agent's are tinted and rendered as Markdown. People's messages
// are plain text.
export function ChatMessage({ event, mine }: { event: ChatEvent; mine: boolean }) {
  const agent = event.sender.type === 'agent'
  const name = agent ? 'LXAgents' : mine ? 'You' : `@${event.sender.login ?? 'someone'}`
  return (
    <li className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`} data-sender={agent ? 'agent' : mine ? 'me' : 'other'}>
      <Avatar sender={event.sender} />
      <div className={`flex min-w-0 max-w-[92%] flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
        <span className="flex items-center gap-1.5 text-xs text-fg-muted">
          <span className="font-medium text-fg">{name}</span>
          {event.type === 'report' && <span className="rounded-full bg-overlay px-1.5">report</span>}
          {event.data?.error && <span className="text-danger">error</span>}
          <time dateTime={event.timestamp}>{messageTime(event.timestamp)}</time>
        </span>
        <div className={`max-w-full rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed ${tone(event, mine)}`}>
          {agent ? <Markdown>{event.content}</Markdown> : <p className="break-words whitespace-pre-wrap">{event.content}</p>}
        </div>
        {agent && event.data?.model && (
          <span className="text-xs text-fg-muted">
            {String(event.data.model)}
            {event.data.cost ? ` · ${String(event.data.cost)}` : ''}
          </span>
        )}
      </div>
    </li>
  )
}
