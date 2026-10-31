import { useCallback, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { ConfirmDelete } from '../components/ConfirmDelete'
import { DataTable, type Column } from '../components/DataTable'
import { SearchField } from '../components/Field'
import { Modal } from '../components/Modal'
import { Badge, PageHeader, PlatformBadge } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { formatDate, platformName } from '../format'
import { useLoad } from '../hooks/useLoad'
import { adminApi, errorMessage, userApi } from '../services/api'
import type { ImportableRepo, Repo } from '../types'

// Like orgs, repositories are never typed in: the list is what the platform says you administer.
function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const toast = useToast()
  const { me } = useAuth()
  const { data, loading, reload } = useLoad(useCallback(() => userApi.importableRepos(), []))
  const [busy, setBusy] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const shown = data?.filter((x) => x.fullName.toLowerCase().includes(needle))
  const platform = me ? platformName(me.platform) : 'The platform'

  const importRepo = async (repo: ImportableRepo) => {
    setBusy(repo.externalId)
    try {
      await userApi.importRepo(repo.externalId)
      toast.success(`Imported ${repo.fullName}`)
      onImported()
      await reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Modal title="Import a repository" onClose={onClose}>
      <p className="text-sm text-fg-muted">
        {platform} lists the repositories you administer
        {me?.platform === 'gitlab' ? ' (Maintainer or Owner)' : ''}. Import the organization first.
      </p>
      <SearchField label="Search repositories" placeholder="Search by name" value={query} onChange={setQuery} />
      {loading && !data ? (
        <p className="py-6 text-center text-sm text-fg-muted">
          <Loader2 aria-hidden className="mr-2 inline size-4 animate-spin" />
          Asking {platform}…
        </p>
      ) : (
        <ul aria-label="Repositories you administer" className="max-h-96 divide-y divide-line-muted overflow-y-auto rounded-xl border border-line">
          {shown?.map((repo) => (
            <li key={repo.externalId} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <p className="min-w-0 truncate text-sm font-semibold">{repo.fullName}</p>
              {repo.importable ? (
                <Button size="sm" busy={busy === repo.externalId} disabled={busy !== null} onClick={() => importRepo(repo)}>
                  <Download aria-hidden className="size-3.5" /> Import
                </Button>
              ) : (
                <Badge tone={repo.reason === 'already imported' ? 'success' : 'default'}>{repo.reason}</Badge>
              )}
            </li>
          ))}
          {data?.length === 0 && <li className="px-3 py-6 text-center text-sm text-fg-muted">You do not administer any repositories.</li>}
          {data && data.length > 0 && shown?.length === 0 && <li className="px-3 py-6 text-center text-sm text-fg-muted">No repository matches “{query}”.</li>}
        </ul>
      )}
    </Modal>
  )
}

export function Repositories() {
  const toast = useToast()
  const { session, isAdmin } = useAuth()
  const canImport = session?.mode === 'user'
  const { data, loading, reload } = useLoad(useCallback(() => (isAdmin ? adminApi.repos() : userApi.repos()), [isAdmin]))
  const [importing, setImporting] = useState(false)

  const remove = async (repo: Repo) => {
    try {
      await (isAdmin ? adminApi.deleteRepo(repo.id) : userApi.deleteRepo(repo.id))
      toast.success(`Removed ${repo.fullName}`)
      await reload()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const columns: Column<Repo>[] = [
    { header: 'Repository', cell: (r) => <span className="font-semibold">{r.fullName}</span> },
    { header: 'Platform', className: 'text-center', cell: (r) => <PlatformBadge platform={r.platform} /> },
    { header: 'Organization', cell: (r) => r.org.name ?? '—' },
    {
      header: 'Text model',
      cell: (r) => (r.models?.text ? <code className="font-mono text-xs">{r.models.text}</code> : <span className="text-fg-muted">Org’s model</span>),
    },
    { header: 'Keys', cell: (r) => r.keyCount ?? 0, className: 'tabular-nums' },
    { header: 'Imported', cell: (r) => <span className="text-fg-muted">{formatDate(r.createdAt)}</span> },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (r) => (
        <ConfirmDelete
          label={`Remove ${r.fullName}`}
          title="Remove repository"
          message={`Remove ${r.fullName}? Its keys and model are deleted, and the agent uses the organization’s instead.`}
          onConfirm={() => remove(r)}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Repositories"
        description={
          isAdmin
            ? 'Every imported repository. Admins import their own; they cannot be added by hand.'
            : 'Repositories you administer, with their own model and keys. Set the model on the Models page and keys on the API keys page.'
        }
        actions={
          canImport && (
            <Button variant="primary" onClick={() => setImporting(true)}>
              <Download aria-hidden className="size-4" /> Import repository
            </Button>
          )
        }
      />
      <DataTable
        label="Repositories"
        columns={columns}
        rows={data}
        rowKey={(r) => r.id}
        loading={loading}
        empty={isAdmin ? 'No repositories have been imported yet.' : 'You have not imported any repositories you administer.'}
      />
      {importing && <ImportModal onClose={() => setImporting(false)} onImported={reload} />}
    </>
  )
}
