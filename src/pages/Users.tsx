import { useCallback, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../components/Button'
import { ConfirmDelete } from '../components/ConfirmDelete'
import { DataTable, type Column } from '../components/DataTable'
import { TextField } from '../components/Field'
import { Modal } from '../components/Modal'
import { Badge, PageHeader } from '../components/PageHeader'
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
      toast.success(`Whitelisted ${added.login}`)
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
        <TextField
          label={`${platformName} user ID`}
          required
          inputMode="numeric"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          hint={`The numeric account id, not the login: logins can be renamed and claimed by someone else. Their name and avatar are read from ${platformName}.`}
        />
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
      toast.success(`Removed ${a.login}`)
      await reload()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const columns: Column<Account>[] = [
    { header: 'User', cell: (a) => <UserCell account={a} /> },
    { header: 'Role', cell: (a) => (a.role === 'owner' ? <Badge tone="accent">Owner</Badge> : <Badge>Member</Badge>) },
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
          message={`Remove ${a.login} from the whitelist? Orgs they imported and all of their keys are deleted too.`}
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
