import { useCallback, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../components/Button'
import { ConfirmDelete } from '../components/ConfirmDelete'
import { DataTable, type Column } from '../components/DataTable'
import { TextField } from '../components/Field'
import { Modal } from '../components/Modal'
import { PageHeader, RoleBadge } from '../components/PageHeader'
import { useAuth } from '../auth/AuthContext'
import { BrandIcon } from '../components/BrandIcon'
import { useToast } from '../components/Toast'
import { formatDate } from '../format'
import { useLoad } from '../hooks/useLoad'
import { adminApi, errorMessage } from '../services/api'
import type { Account } from '../types'

const PLATFORM_NAMES = { github: 'GitHub', gitlab: 'GitLab' } as const

// The user's avatar, name and login, as GitHub or GitLab reports them. Nothing here is stored.
function UserCell({ account }: { account: Account }) {
  return (
    <span className="flex items-center gap-3">
      {account.avatarUrl ? (
        <img src={account.avatarUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-overlay">
          <BrandIcon platform={account.platform} className="size-4" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate font-semibold">{account.name ?? account.login}</span>
        {account.name && <span className="block truncate text-xs text-fg-muted">@{account.login}</span>}
      </span>
    </span>
  )
}

function AddUserModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const toast = useToast()
  const { session } = useAuth()
  const [userId, setUserId] = useState('')
  const [busy, setBusy] = useState(false)
  const platformName = PLATFORM_NAMES[session?.platform ?? 'github']

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const added = await adminApi.createAccount({ userId: userId.trim() })
      toast.success(`Added ${added.login}`)
      onAdded()
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Add a user" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <TextField
          label={`${platformName} user ID`}
          required
          inputMode="numeric"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          hint={`Optional: anyone can log in with ${platformName} and is added as Free. Add someone here to give them keys first. Use the numeric account id, not the login: logins can be renamed and claimed by someone else.`}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" busy={busy}>
            Add user
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
      toast.success(`Removed ${a.login}`)
      await reload()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const columns: Column<Account>[] = [
    { header: 'User', cell: (a) => <UserCell account={a} /> },
    { header: 'Role', cell: (a) => <RoleBadge role={a.role} /> },
    { header: 'User ID', cell: (a) => <code className="font-mono text-xs text-fg-muted">{a.id}</code> },
    { header: 'Keys', cell: (a) => a.keyCount, className: 'tabular-nums' },
    { header: 'Orgs', cell: (a) => a.orgCount, className: 'tabular-nums' },
    { header: 'Added', cell: (a) => <span className="text-fg-muted">{formatDate(a.createdAt)}</span> },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (a) => (
        <ConfirmDelete
          label={`Remove ${a.login}`}
          title="Remove user"
          message={`Remove ${a.login}? Orgs they imported and all of their keys are deleted too. They can log in again later, as a new Free user.`}
          onConfirm={() => remove(a)}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone who has logged in with GitHub or GitLab. New users are Free; the owner is set on the server."
        actions={
          <Button variant="primary" onClick={() => setAdding(true)}>
            <Plus aria-hidden className="size-4" /> Add user
          </Button>
        }
      />
      <DataTable label="Users" columns={columns} rows={data} rowKey={(a) => `${a.platform}:${a.id}`} loading={loading} empty="Nobody has logged in yet." />
      {adding && <AddUserModal onClose={() => setAdding(false)} onAdded={reload} />}
    </>
  )
}
