import { useCallback, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { ConfirmDelete } from '../components/ConfirmDelete'
import { DataTable, type Column } from '../components/DataTable'
import { SearchField } from '../components/Field'
import { Modal } from '../components/Modal'
import { Badge, PageHeader } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { formatDate, platformName } from '../format'
import { useLoad } from '../hooks/useLoad'
import { adminApi, errorMessage, userApi } from '../services/api'
import type { ImportableOrg, Org } from '../types'

// Orgs are never typed in: the user picks from the orgs the platform says they own.
function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const toast = useToast()
  const { me } = useAuth()
  const { data, loading, reload } = useLoad(useCallback(() => userApi.importable(), []))
  const [busy, setBusy] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const shown = data?.filter((x) => x.name.toLowerCase().includes(needle))

  const importOrg = async (org: ImportableOrg) => {
    setBusy(org.name)
    try {
      await userApi.importOrg(org.name)
      toast.success(`Imported ${org.name}`)
      onImported()
      await reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Modal title="Import an organization" onClose={onClose}>
      <p className="text-sm text-fg-muted">
        {me ? platformName(me.platform) : 'The platform'} lists the organizations you own.
        {me?.platform === 'github' && ' The GitHub App must be installed on an organization before it can be imported.'}
      </p>
      <SearchField label="Search organizations" placeholder="Search by name" value={query} onChange={setQuery} />
      {loading && !data ? (
        <p className="py-6 text-center text-sm text-fg-muted">
          <Loader2 aria-hidden className="mr-2 inline size-4 animate-spin" />
          Asking {me ? platformName(me.platform) : 'the platform'}…
        </p>
      ) : (
        <ul aria-label="Organizations you own" className="divide-y divide-line-muted overflow-hidden rounded-xl border border-line">
          {shown?.map((org) => (
            <li key={org.name} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{org.name}</p>
                <p className="text-xs text-fg-muted">{org.kind === 'user' ? 'Your personal account' : 'Organization'}</p>
              </div>
              {org.importable ? (
                <Button size="sm" busy={busy === org.name} disabled={busy !== null} onClick={() => importOrg(org)}>
                  <Download aria-hidden className="size-3.5" /> Import
                </Button>
              ) : (
                <Badge tone={org.reason === 'already imported' ? 'success' : 'default'}>{org.reason}</Badge>
              )}
            </li>
          ))}
          {data?.length === 0 && <li className="px-3 py-6 text-center text-sm text-fg-muted">You do not own any organizations.</li>}
          {data && data.length > 0 && shown?.length === 0 && <li className="px-3 py-6 text-center text-sm text-fg-muted">No organization matches “{query}”.</li>}
        </ul>
      )}
    </Modal>
  )
}

export function Organizations() {
  const toast = useToast()
  const { session, isOwner } = useAuth()
  // An admin user is still a platform user, so they can import orgs they own.
  const canImport = session?.mode === 'user'
  const { data, loading, reload } = useLoad(useCallback(() => (isOwner ? adminApi.orgs() : userApi.orgs()), [isOwner]))
  const [importing, setImporting] = useState(false)

  const remove = async (org: Org) => {
    try {
      await (isOwner ? adminApi.deleteOrg(org.id) : userApi.deleteOrg(org.id))
      toast.success(`Removed ${org.orgName}`)
      await reload()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const columns: Column<Org>[] = [
    { header: 'Organization', cell: (o) => <span className="font-semibold">{o.orgName}</span> },
    {
      header: 'Installation',
      cell: (o) => (o.installationId ? <code className="font-mono text-xs text-fg-muted">{o.installationId}</code> : <span className="text-fg-muted">—</span>),
    },
    { header: 'Imported by', cell: (o) => o.owner.login },
    { header: 'Keys', cell: (o) => o.keyCount ?? 0, className: 'tabular-nums' },
    { header: 'Imported', cell: (o) => <span className="text-fg-muted">{formatDate(o.createdAt)}</span> },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (o) => (
        <ConfirmDelete
          label={`Remove ${o.orgName}`}
          title="Remove organization"
          message={`Remove ${o.orgName}? The agent stops answering there, and the organization's keys are deleted.`}
          onConfirm={() => remove(o)}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Organizations"
        description={
          isOwner
            ? 'Every organization the agent serves. Owners import their own organizations; they cannot be added by hand.'
            : 'Imported organizations you own. Ownership is checked with the platform on every change.'
        }
        actions={
          canImport && (
            <Button variant="primary" onClick={() => setImporting(true)}>
              <Download aria-hidden className="size-4" /> Import organization
            </Button>
          )
        }
      />
      <DataTable
        label="Organizations"
        columns={columns}
        rows={data}
        rowKey={(o) => o.id}
        loading={loading}
        empty={isOwner ? 'No organizations have been imported yet.' : 'You have not imported any organizations you own.'}
      />
      {importing && <ImportModal onClose={() => setImporting(false)} onImported={reload} />}
    </>
  )
}
