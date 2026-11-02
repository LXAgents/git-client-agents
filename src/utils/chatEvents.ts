import type { ChatEvent, ChatSummary } from '../types'

/** What the agent is doing right now, from `progress` and `token` events. */
export interface AgentActivity {
  status: string
  tool?: string
  /** Text the agent is writing right now, streamed token by token. */
  text: string
  where?: string
}

// The activity after `event`. A token adds to the text; progress sets the status, and a
// progress event with data.reset starts a new model call, so the streamed text is cleared.
export function nextActivity(event: ChatEvent, a: AgentActivity | null): AgentActivity {
  if (event.type === 'token') return { status: a?.status ?? 'Writing...', tool: a?.tool, where: a?.where, text: `${a?.text ?? ''}${event.content}` }
  return { status: event.data?.status ?? event.content, tool: event.data?.tool, where: event.data?.where ?? a?.where, text: event.data?.reset ? '' : (a?.text ?? '') }
}

// Stored events in time order, each once.
export function mergeById(a: ChatEvent[], b: ChatEvent[]): ChatEvent[] {
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

export function messageTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

// The room's estimated cost: unknown when no answer reported one, "at least" when some did not.
export function formatCost(stats: ChatSummary['stats']): string {
  if (stats.costUsd === 0 && !stats.costComplete) return 'Unknown'
  const value = `$${stats.costUsd.toFixed(stats.costUsd >= 1 ? 2 : 4)}`
  return stats.costComplete ? value : `at least ${value}`
}

