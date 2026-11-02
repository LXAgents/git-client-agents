import { useCallback, type ReactNode } from 'react'
import { Info, Loader2 } from 'lucide-react'
import { platformName } from '../../format'
import { useLoad } from '../../hooks/useLoad'
import { chatApi } from '../../services/chat'
import type { ChatKeyCounts } from '../../types'
import { formatCost } from '../../utils/chatEvents'
import { Pane } from './Pane'
import { useRoomEvents, type PickableRoom } from './ChatRoomContext'

const KIND = { user: 'Personal chat', repo: 'Repository', org: 'Organization' }
const SOURCE = { repo: 'repository setting', org: 'organization setting', user: 'your setting', default: 'server default' }

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="text-sm break-words text-fg">{children}</dd>
    </div>
  )
}

function KeyStatus({ counts }: { counts: ChatKeyCounts }) {
  const parts = [
    counts.repo ? `${counts.repo} repository` : null,
    counts.org ? `${counts.org} organization` : null,
    counts.user ? `${counts.user} yours` : null,
  ].filter(Boolean)
  return (
    <span className="flex flex-col gap-0.5">
      <span className={`flex items-center gap-1.5 font-medium ${counts.total ? 'text-success' : 'text-danger'}`}>
        <span aria-hidden className={`size-1.5 rounded-full ${counts.total ? 'bg-success' : 'bg-danger'}`} />
        {counts.total ? `${counts.total} active` : 'No key'}
      </span>
      {parts.length > 0 && <span className="text-xs text-fg-muted">{parts.join(' · ')}</span>}
    </span>
  )
}

// The left pane, read only: which room this is, the model and keys the agent would use for you
// here, and what the agent's answers in the room have used so far. Refreshed when an answer or
// report arrives. Mounted with key={room}.
export function RoomDetailsPane({ room }: { room: PickableRoom }) {
  const { data, loading, reload } = useLoad(useCallback(() => chatApi.summary(room.room), [room.room]))
  useRoomEvents((event) => {
    if (event.sender.type === 'agent' && (event.type === 'message' || event.type === 'report')) void reload()
  })

  return (
    <Pane id="chat-details" title="Room details" icon={Info}>
      {!data ? (
        loading && (
          <p className="flex items-center text-sm text-fg-muted">
            <Loader2 aria-hidden className="mr-2 size-4 animate-spin text-accent" /> Loading…
          </p>
        )
      ) : (
        <dl className="space-y-5">
          <div role="group" aria-label="This room" className="space-y-3">
            <Row label={KIND[data.room.kind]}>{data.room.name}</Row>
            <Row label="Platform">{platformName(data.room.platform)}</Row>
          </div>
          <div role="group" aria-label="Model" className="space-y-3 border-t border-line pt-4">
            <Row label="Model">
              <span className="font-mono text-[13px]">{data.model.model}</span>
            </Row>
            <Row label="Provider">
              {data.model.providerName}
              {data.model.source && <span className="block text-xs text-fg-muted">from the {SOURCE[data.model.source]}</span>}
            </Row>
          </div>
          <div role="group" aria-label="Keys" className="space-y-3 border-t border-line pt-4">
            <Row label={`${data.model.providerName} keys`}>
              <KeyStatus counts={data.keys.ai} />
            </Row>
            {data.keys.workspace && (
              <Row label={`${data.keys.workspace.providerName} keys`}>
                <KeyStatus counts={data.keys.workspace} />
              </Row>
            )}
          </div>
          <div role="group" aria-label="Usage" className="space-y-3 border-t border-line pt-4">
            <Row label="Total tokens">
              {(data.stats.inputTokens + data.stats.outputTokens).toLocaleString()}
              <span className="block text-xs text-fg-muted">
                {data.stats.inputTokens.toLocaleString()} in · {data.stats.outputTokens.toLocaleString()} out
              </span>
            </Row>
            <Row label="Estimated cost">{formatCost(data.stats)}</Row>
            <Row label="Agent answers">
              {data.stats.answers.toLocaleString()}
              {data.stats.answersWithoutUsage > 0 && <span className="block text-xs text-fg-muted">{data.stats.answersWithoutUsage} without usage data</span>}
              {data.stats.capped && <span className="block text-xs text-fg-muted">Newest answers only</span>}
            </Row>
          </div>
        </dl>
      )}
    </Pane>
  )
}
