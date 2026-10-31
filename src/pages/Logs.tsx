import { useCallback, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '../components/Button'
import { DataTable, type Column } from '../components/DataTable'
import { SelectField } from '../components/Field'
import { Badge, PageHeader, type Tone } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { useLoad } from '../hooks/useLoad'
import { adminApi, errorMessage } from '../services/api'
import type { LogLevel, LogLine } from '../types'

const LEVELS: { value: LogLevel; label: string }[] = [
  { value: 'info', label: 'All' },
  { value: 'warn', label: 'Warnings and errors' },
  { value: 'error', label: 'Errors' },
]

// The server's log sources: webhooks received, the worker's tasks, the agent's model calls,
// the start-up check, the server and request errors, and unreadable keys.
const SOURCES = ['webhook', 'worker', 'agent', 'setup', 'server', 'app', 'keys']

const LEVEL_BADGES: Record<LogLevel, { label: string; tone: Tone }> = {
  info: { label: 'Info', tone: 'default' },
  warn: { label: 'Warning', tone: 'attention' },
  error: { label: 'Error', tone: 'danger' },
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const columns: Column<LogLine>[] = [
  { header: 'Time', cell: (l) => <span className="whitespace-nowrap text-fg-muted tabular-nums">{formatTime(l.createdAt)}</span> },
  {
    header: 'Level',
    cell: (l) => {
      const { label, tone } = LEVEL_BADGES[l.level] ?? LEVEL_BADGES.info
      return <Badge tone={tone}>{label}</Badge>
    },
  },
  { header: 'Source', cell: (l) => <code className="font-mono text-xs">{l.source}</code> },
  { header: 'Message', cell: (l) => <span className="font-mono text-xs break-words whitespace-pre-wrap">{l.message}</span> },
]

interface More {
  filter: string
  logs: LogLine[]
  next: string | null
}

// Owner only. The server's log lines for the owner's platform and for the server itself.
export function Logs() {
  const toast = useToast()
  const [level, setLevel] = useState<LogLevel>('info')
  const [source, setSource] = useState('')
  const filter = `${level}:${source}`
  const { data, loading, reload } = useLoad(useCallback(() => adminApi.logs({ level, source: source || undefined }), [level, source]))
  // Pages after the first, kept only while the filter they were loaded with is selected.
  const [more, setMore] = useState<More | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const extra = more && more.filter === filter ? more : null
  const rows = data ? [...data.logs, ...(extra?.logs ?? [])] : null
  const next = extra ? extra.next : (data?.next ?? null)

  const loadMore = async (before: string) => {
    setLoadingMore(true)
    try {
      const page = await adminApi.logs({ level, source: source || undefined, before })
      setMore({ filter, logs: [...(extra?.logs ?? []), ...page.logs], next: page.next })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoadingMore(false)
    }
  }

  const refresh = () => {
    setMore(null)
    void reload()
  }

  return (
    <>
      <PageHeader
        title="Logs"
        description="What the server did, newest first: webhooks received, answers, model calls and errors. Lines are kept for 14 days by default."
        actions={
          <Button onClick={refresh} busy={loading}>
            <RefreshCw aria-hidden className="size-4" /> Refresh
          </Button>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
        <SelectField label="Level" value={level} onChange={(e) => setLevel(e.target.value as LogLevel)}>
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </SelectField>
        <SelectField label="Source" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">All</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectField>
      </div>
      <DataTable label="Logs" columns={columns} rows={rows} rowKey={(l) => l.id} loading={loading} empty="No log lines yet." />
      {next && (
        <div className="mt-4 flex justify-center">
          <Button onClick={() => void loadMore(next)} busy={loadingMore}>
            Load more
          </Button>
        </div>
      )}
    </>
  )
}
