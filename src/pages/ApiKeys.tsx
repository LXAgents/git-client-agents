import { useCallback, useState, type FormEvent } from 'react'
import { Building2, Plus, User } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { ConfirmDelete } from '../components/ConfirmDelete'
import { DataTable, type Column } from '../components/DataTable'
import { Segmented, SelectField, TextField } from '../components/Field'
import { Modal } from '../components/Modal'
import { Badge, PageHeader, PlatformBadge } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { formatDate } from '../format'
import { useLoad } from '../hooks/useLoad'
import { adminApi, errorMessage, userApi } from '../services/api'
import type { Account, ApiKey, Org } from '../types'

type Target = 'user' | 'org'

interface KeysData {
  keys: ApiKey[]
  orgs: Org[]
  accounts: Account[]
}

async function loadAdmin(): Promise<KeysData> {
  const [keys, orgs, accounts] = await Promise.all([adminApi.keys(), adminApi.orgs(), adminApi.accounts()])
  return { keys, orgs, accounts }
}

// A user sees their own keys and the keys of each org they own; the server checks
// ownership again for every org request.
async function loadUser(): Promise<KeysData> {
  const [own, orgs] = await Promise.all([userApi.keys(), userApi.orgs()])
  const orgKeys = await Promise.all(orgs.map((o) => userApi.orgKeys(o.id)))
  const keys = [...own, ...orgKeys.flat()].sort((a, b) => b.priority - a.priority)
  return { keys, orgs, accounts: [] }
}

function AddKeyModal({ data, onClose, onAdded }: { data: KeysData; onClose: () => void; onAdded: () => void }) {
  const toast = useToast()
  const { session, me } = useAuth()
  const isAdmin = session?.mode === 'admin'
  const [target, setTarget] = useState<Target>('user')
  const [accountKey, setAccountKey] = useState(data.accounts[0] ? `${data.accounts[0].platform}:${data.accounts[0].id}` : '')
  const [orgId, setOrgId] = useState(data.orgs[0]?.id ?? '')
  const [apiKey, setApiKey] = useState('')
  const [priority, setPriority] = useState('0')
  const [busy, setBusy] = useState(false)

  const noOrgs = target === 'org' && data.orgs.length === 0
  const noUsers = isAdmin && target === 'user' && data.accounts.length === 0

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const key = { apiKey: apiKey.trim(), priority: Number(priority) || 0 }
    setBusy(true)
    try {
      if (isAdmin && target === 'user') {
        const [platform, ...rest] = accountKey.split(':')
        await adminApi.createUserKey(platform as Account['platform'], rest.join(':'), key)
      } else if (isAdmin) {
        await adminApi.createOrgKey(orgId, key)
      } else if (target === 'user') {
        await userApi.createKey(key)
      } else {
        await userApi.createOrgKey(orgId, key)
      }
      toast.success('API key added')
      onAdded()
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Add an API key" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Segmented
          label="Attach to"
          value={target}
          onChange={setTarget}
          options={[
            { value: 'user', label: 'User' },
            { value: 'org', label: 'Organization' },
          ]}
        />
        {target === 'user' &&
          (isAdmin ? (
            <SelectField label="User" required value={accountKey} onChange={(e) => setAccountKey(e.target.value)} hint={noUsers ? 'Whitelist a user first.' : undefined}>
              {data.accounts.map((a) => (
                <option key={`${a.platform}:${a.id}`} value={`${a.platform}:${a.id}`}>
                  {a.username || a.id} ({a.platform}, {a.id})
                </option>
              ))}
            </SelectField>
          ) : (
            <p className="rounded-md border border-line bg-canvas px-3 py-2 text-sm">
              Your key{me ? <> as <span className="font-semibold">{me.login}</span></> : null}. Used first when you trigger the agent.
            </p>
          ))}
        {target === 'org' && (
          <SelectField
            label="Organization"
            required
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            hint={noOrgs ? (isAdmin ? 'No organizations have been imported yet.' : 'Import an organization you own first.') : 'Used after the triggering user’s own keys.'}
          >
            {data.orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orgName} ({o.platform})
              </option>
            ))}
          </SelectField>
        )}
        <TextField label="OpenRouter API key" type="password" autoComplete="off" required value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-or-…" />
        <TextField
          label="Priority"
          type="number"
          step={1}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          hint="Higher is tried first. If a key fails (quota, rate limit, revoked), the next one is used."
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" busy={busy} disabled={noOrgs || noUsers}>
            Add key
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function ApiKeys() {
  const toast = useToast()
  const { session } = useAuth()
  const isAdmin = session?.mode === 'admin'
  const { data, loading, reload } = useLoad(useCallback(() => (isAdmin ? loadAdmin() : loadUser()), [isAdmin]))
  const [adding, setAdding] = useState(false)

  const remove = async (key: ApiKey) => {
    try {
      if (isAdmin) await adminApi.deleteKey(key.id)
      else if (key.owner.type === 'org') await userApi.deleteOrgKey(key.owner.id, key.id)
      else await userApi.deleteKey(key.id)
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
          {k.owner.type === 'org' ? <Building2 aria-hidden className="size-4 text-fg-muted" /> : <User aria-hidden className="size-4 text-fg-muted" />}
          <span className="font-semibold">{k.owner.name}</span>
          <Badge tone={k.owner.type === 'org' ? 'accent' : 'default'}>{k.owner.type === 'org' ? 'Organization' : 'User'}</Badge>
        </span>
      ),
    },
    { header: 'Platform', cell: (k) => <PlatformBadge platform={k.owner.platform} /> },
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
        description={
          isAdmin
            ? 'Every OpenRouter key on the server. Keys are shown by their last four characters only.'
            : 'Your own keys, and the keys of organizations you own. Only owners can change organization keys.'
        }
        actions={
          <Button variant="primary" onClick={() => setAdding(true)} disabled={!data}>
            <Plus aria-hidden className="size-4" /> Add key
          </Button>
        }
      />
      <DataTable label="API keys" columns={columns} rows={data?.keys ?? null} rowKey={(k) => k.id} loading={loading} empty="No API keys yet." />
      {adding && data && <AddKeyModal data={data} onClose={() => setAdding(false)} onAdded={reload} />}
    </>
  )
}
