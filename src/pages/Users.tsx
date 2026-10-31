import { useCallback, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../components/Button'
import { ConfirmDelete } from '../components/ConfirmDelete'
import { DataTable, type Column } from '../components/DataTable'
import { SelectField, TextField } from '../components/Field'
import { Modal } from '../components/Modal'
import { PageHeader, PlatformBadge } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { formatDate } from '../format'
import { useLoad } from '../hooks/useLoad'
import { adminApi, errorMessage } from '../services/api'
import type { Account, Platform } from '../types'

function AddUserModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const toast = useToast()
  const [platform, setPlatform] = useState<Platform>('github')
  const [userId, setUserId] = useState('')
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await adminApi.createAccount({ platform, userId: userId.trim(), username: username.trim() })
      toast.success(`Whitelisted ${username || userId}`)
      onAdded()
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Whitelist a user" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <SelectField label="Platform" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
          <option value="github">GitHub</option>
          <option value="gitlab">GitLab</option>
        </SelectField>
        <TextField
          label="User ID"
          required
          inputMode="numeric"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          hint="The numeric account id, not the login: logins can be renamed and claimed by someone else."
        />
        <TextField label="Username" required value={username} onChange={(e) => setUsername(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" busy={busy}>
            Whitelist user
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function Users() {
  const toast = useToast()
  const { data, loading, reload } = useLoad(useCallback(() => adminApi.accounts(), []))
  const [adding, setAdding] = useState(false)

  const remove = async (a: Account) => {
    try {
      await adminApi.deleteAccount(a.platform, a.id)
      toast.success(`Removed ${a.username || a.id}`)
      await reload()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const columns: Column<Account>[] = [
    { header: 'User', cell: (a) => <span className="font-semibold">{a.username || '—'}</span> },
    { header: 'Platform', cell: (a) => <PlatformBadge platform={a.platform} /> },
    { header: 'User ID', cell: (a) => <code className="font-mono text-xs text-fg-muted">{a.id}</code> },
    { header: 'Keys', cell: (a) => a.keyCount, className: 'tabular-nums' },
    { header: 'Orgs', cell: (a) => a.orgCount, className: 'tabular-nums' },
    { header: 'Added', cell: (a) => <span className="text-fg-muted">{formatDate(a.createdAt)}</span> },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (a) => (
        <ConfirmDelete
          label={`Remove ${a.username || a.id}`}
          title="Remove user"
          message={`Remove ${a.username || a.id} from the whitelist? Orgs they imported and all of their keys are deleted too.`}
          onConfirm={() => remove(a)}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Users"
        description="Only whitelisted users can trigger the agent or sign in to this dashboard."
        actions={
          <Button variant="primary" onClick={() => setAdding(true)}>
            <Plus aria-hidden className="size-4" /> Whitelist user
          </Button>
        }
      />
      <DataTable label="Whitelisted users" columns={columns} rows={data} rowKey={(a) => `${a.platform}:${a.id}`} loading={loading} empty="No users are whitelisted yet." />
      {adding && <AddUserModal onClose={() => setAdding(false)} onAdded={reload} />}
    </>
  )
}
