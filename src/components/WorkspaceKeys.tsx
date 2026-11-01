import { useCallback, useState } from 'react'
import { Plus } from 'lucide-react'
import { errorMessage } from '../services/api'
import { deleteWorkspaceKeyOf, loadWorkspaceKeys } from '../services/workspaceKeys'
import { formatDate } from '../format'
import { useLoad } from '../hooks/useLoad'
import type { ApiKey } from '../types'
import { AddWorkspaceKeyModal } from './AddWorkspaceKeyModal'
import { Button } from './Button'
import { ConfirmDelete } from './ConfirmDelete'
import { DataTable, type Column } from './DataTable'
import { Badge } from './PageHeader'
import { useToast } from './Toast'

const OWNER_LABEL: Record<ApiKey['owner']['type'], string> = { user: 'You', org: 'Organization', repo: 'Repository' }

// GitHub Codespaces tokens, for the agent's workspace tools (GitHub sessions only).
export function WorkspaceKeys() {
  const toast = useToast()
  const { data, loading, reload } = useLoad(useCallback(() => loadWorkspaceKeys(), []))
  const [adding, setAdding] = useState(false)

  const remove = async (key: ApiKey) => {
    try {
      await deleteWorkspaceKeyOf(key)
      toast.success('Workspace key deleted')
      await reload()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const columns: Column<ApiKey>[] = [
    {
      header: 'Owner',
      cell: (k) => (
        <span className="inline-flex items-center gap-2">
          <span className="font-semibold">{k.owner.name}</span>
          <Badge tone={k.owner.type === 'user' ? 'default' : 'accent'}>{OWNER_LABEL[k.owner.type]}</Badge>
        </span>
      ),
    },
    { header: 'Token', cell: (k) => <code className="font-mono text-xs text-fg-muted">{k.last4 ? `••••${k.last4}` : 'unreadable'}</code> },
    { header: 'Priority', cell: (k) => k.priority, className: 'tabular-nums' },
    { header: 'Status', cell: (k) => (k.isActive ? <Badge tone="success">Active</Badge> : <Badge>Disabled</Badge>) },
    { header: 'Added', cell: (k) => <span className="text-fg-muted">{formatDate(k.createdAt)}</span> },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (k) => (
        <ConfirmDelete
          label={`Delete workspace key ending ${k.last4 ?? ''} of ${k.owner.name}`}
          title="Delete workspace key"
          message={`Delete the workspace key ending in ${k.last4 ?? '?'} from ${k.owner.name}? The agent stops using it at once.`}
          onConfirm={() => remove(k)}
        />
      ),
    },
  ]

  return (
    <section aria-labelledby="workspace-keys" className="mt-12">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="workspace-keys" className="text-xl font-semibold tracking-tight">
            Workspace keys
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">
            GitHub personal access tokens with the codespace scope. With one, the agent can start a GitHub Codespace, run commands and push a branch for commenters with write access. It tries repository keys, then organization keys, then the commenter’s own.
          </p>
        </div>
        <Button onClick={() => setAdding(true)} disabled={!data}>
          <Plus aria-hidden className="size-4" /> Add workspace key
        </Button>
      </div>
      <DataTable label="Workspace keys" columns={columns} rows={data?.keys ?? null} rowKey={(k) => k.id} loading={loading} empty="No workspace keys yet." />
      {adding && data && <AddWorkspaceKeyModal data={data} onClose={() => setAdding(false)} onAdded={reload} />}
    </section>
  )
}
