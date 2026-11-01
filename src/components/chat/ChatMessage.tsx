import { Bot } from 'lucide-react'
import type { ChatEvent } from '../../types'

function time(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

// One stored message or report. Content is shown as plain text, never as HTML.
export function ChatMessage({ event, mine }: { event: ChatEvent; mine: boolean }) {
  const agent = event.sender.type === 'agent'
  const error = Boolean(event.data?.error)
  const tone = error
    ? 'bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] ring-1 ring-[color-mix(in_oklch,var(--color-danger)_30%,transparent)]'
    : agent
      ? 'bg-[color-mix(in_oklch,var(--color-accent)_8%,transparent)] ring-1 ring-[color-mix(in_oklch,var(--color-accent)_20%,transparent)]'
      : mine
        ? 'bg-overlay'
        : 'bg-canvas ring-1 ring-line'
  return (
    <li className={`flex flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
      <span className="flex items-center gap-1.5 text-xs text-fg-muted">
        {agent && <Bot aria-hidden className="size-3.5 text-accent" />}
        <span className="font-medium text-fg">{agent ? 'LXAgents' : `@${event.sender.login ?? 'someone'}`}</span>
        {event.type === 'report' && <span className="rounded-full bg-overlay px-1.5">report</span>}
        {error && <span className="text-danger">error</span>}
        <time dateTime={event.timestamp}>{time(event.timestamp)}</time>
      </span>
      <div className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap ${tone}`}>{event.content}</div>
      {agent && event.data?.model && (
        <span className="text-xs text-fg-muted">
          {String(event.data.model)}
          {event.data.cost ? ` · ${String(event.data.cost)}` : ''}
        </span>
      )}
    </li>
  )
}
