import { Bot } from 'lucide-react'
import type { ChatEvent } from '../../types'

// The sender's avatar: the agent's icon, the platform avatar, or the login's first letter.
export function Avatar({ sender }: { sender: ChatEvent['sender'] }) {
  const base = 'flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full'
  if (sender.type === 'agent') {
    return (
      <span aria-hidden className={`${base} bg-[color-mix(in_oklch,var(--color-accent)_16%,transparent)] text-accent`}>
        <Bot className="size-4" />
      </span>
    )
  }
  if (sender.avatarUrl) return <img src={sender.avatarUrl} alt="" className={`${base} object-cover`} referrerPolicy="no-referrer" />
  return (
    <span aria-hidden className={`${base} bg-overlay text-xs font-semibold text-fg-muted uppercase`}>
      {(sender.login ?? '?').slice(0, 1)}
    </span>
  )
}
