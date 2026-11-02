import { useCallback } from 'react'
import { errorMessage } from '../services/api'
import { deleteWorkspaceKeyOf, loadWorkspaceKeys } from '../services/workspaceKeys'
import { formatDate } from '../format'
import { useLoad } from '../hooks/useLoad'
import type { ApiKey } from '../types'
import { AddWorkspaceKeyModal } from './AddWorkspaceKeyModal'
import { ConfirmDelete } from './ConfirmDelete'
import { DataTable, type Column } from './DataTable'
import { Badge } from './PageHeader'
import { useToast } from './Toast'

const OWNER_LABEL: Record<ApiKey['owner']['type'], string> = { user: 'You', org: 'Organization', repo: 'Repository' }

// Workspace keys (GitHub Codespaces tokens) for the agent's workspace tools, GitHub sessions only.
// The API keys page owns the Add key button, so it says when the add dialog is open.
export function WorkspaceKeys({ adding, onAddingDone }: { adding: boolean; onAddingDone: () => void }) {
  const toast = useToast()
  const { data, loading, reload } = useLoad(useCallback(() => loadWorkspaceKeys(), []))

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
    { header: 'Platform', cell: (k) => k.provider },
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
    <>
      <DataTable label="Workspace keys" columns={columns} rows={data?.keys ?? null} rowKey={(k) => k.id} loading={loading} empty="No workspace keys yet." />
      {adding && data && <AddWorkspaceKeyModal data={data} onClose={onAddingDone} onAdded={reload} />}
    </>
  )
}
