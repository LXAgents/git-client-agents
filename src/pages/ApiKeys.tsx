import { useCallback, useState } from 'react'
import { Building2, FolderGit2, Plus, User } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { ConfirmDelete } from '../components/ConfirmDelete'
import { DataTable, type Column } from '../components/DataTable'
import { AddKeyModal } from '../components/AddKeyModal'
import { WorkspaceKeys } from '../components/WorkspaceKeys'
import { Segmented } from '../components/Field'
import { Badge, PageHeader } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { formatDate } from '../format'
import { useLoad } from '../hooks/useLoad'
import { errorMessage } from '../services/api'
import { deleteKeyOf, loadKeys } from '../services/keys'
import type { ApiKey } from '../types'

const OWNER_LABEL: Record<ApiKey['owner']['type'], string> = { user: 'User', org: 'Organization', repo: 'Repository' }

function OwnerIcon({ type }: { type: ApiKey['owner']['type'] }) {
  const Icon = type === 'org' ? Building2 : type === 'repo' ? FolderGit2 : User
  return <Icon aria-hidden className="size-4 text-fg-muted" />
}

function describe(workspace: boolean, isOwner: boolean): string {
  if (workspace)
    return 'GitHub personal access tokens with the codespace scope. With one, the agent can start a GitHub Codespace, run commands and push a branch for commenters with write access. It tries repository keys, then organization keys, then the commenter’s own.'
  if (isOwner) return 'Every AI provider key on the server, each brought by a user, organization or repository. Keys are shown by their last four characters only.'
  return 'Bring your own key for each AI provider you use: yours, and those of organizations you own and repositories you administer. For the chosen provider the agent tries repository keys, then organization keys, then the commenter’s own.'
}

export function ApiKeys() {
  const toast = useToast()
  const { isOwner, session } = useAuth()
  const { data, loading, reload } = useLoad(useCallback(() => loadKeys(isOwner), [isOwner]))
  const [adding, setAdding] = useState(false)
  // Workspace keys are GitHub Codespaces tokens, so GitLab sessions only have AI keys.
  const workspaces = session?.platform === 'github'
  const [kind, setKind] = useState<'ai' | 'workspace'>('ai')
  const showWorkspace = workspaces && kind === 'workspace'

  const remove = async (key: ApiKey) => {
    try {
      await deleteKeyOf(isOwner, key)
      toast.success('API key deleted')
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
          <OwnerIcon type={k.owner.type} />
          <span className="font-semibold">{k.owner.name}</span>
          <Badge tone={k.owner.type === 'user' ? 'default' : 'accent'}>{OWNER_LABEL[k.owner.type]}</Badge>
        </span>
      ),
    },
    { header: 'Key', cell: (k) => <code className="font-mono text-xs text-fg-muted">{k.last4 ? `••••${k.last4}` : 'unreadable'}</code> },
    { header: 'Provider', cell: (k) => k.provider },
    { header: 'Priority', cell: (k) => k.priority, className: 'tabular-nums' },
    { header: 'Status', cell: (k) => (k.isActive ? <Badge tone="success">Active</Badge> : <Badge>Disabled</Badge>) },
    { header: 'Added', cell: (k) => <span className="text-fg-muted">{formatDate(k.createdAt)}</span> },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (k) => (
        <ConfirmDelete
          label={`Delete key ending ${k.last4 ?? ''} of ${k.owner.name}`}
          title="Delete API key"
          message={`Delete the key ending in ${k.last4 ?? '?'} from ${k.owner.name}? It can't be recovered.`}
          onConfirm={() => remove(k)}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="API keys"
        description={describe(showWorkspace, isOwner)}
        actions={
          <>
            {workspaces && (
              <Segmented
                label="Key type"
                hideLabel
                value={kind}
                onChange={(next) => {
                  setAdding(false)
                  setKind(next)
                }}
                options={[
                  { value: 'ai', label: 'AI keys' },
                  { value: 'workspace', label: 'Workspace keys' },
                ]}
              />
            )}
            <Button variant="primary" onClick={() => setAdding(true)} disabled={!showWorkspace && !data}>
              <Plus aria-hidden className="size-4" /> Add key
            </Button>
          </>
        }
      />
      {showWorkspace ? (
        <WorkspaceKeys adding={adding} onAddingDone={() => setAdding(false)} />
      ) : (
        <>
          <DataTable label="API keys" columns={columns} rows={data?.keys ?? null} rowKey={(k) => k.id} loading={loading} empty="No API keys yet." />
          {adding && data && <AddKeyModal data={data} onClose={() => setAdding(false)} onAdded={reload} />}
        </>
      )}
    </>
  )
}
