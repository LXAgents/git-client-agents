import { useCallback, useState, type FormEvent } from 'react'
import { Building2, FolderGit2, Plus, User } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { ConfirmDelete } from '../components/ConfirmDelete'
import { DataTable, type Column } from '../components/DataTable'
import { Segmented, SelectField, TextField } from '../components/Field'
import { Modal } from '../components/Modal'
import { Badge, PageHeader } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { formatDate } from '../format'
import { useLoad } from '../hooks/useLoad'
import { adminApi, errorMessage, userApi } from '../services/api'
import type { Account, ApiKey, Org, Repo } from '../types'

type Target = 'user' | 'org' | 'repo'

interface KeysData {
  keys: ApiKey[]
  orgs: Org[]
  repos: Repo[]
  accounts: Account[]
}

async function loadAdmin(): Promise<KeysData> {
  const [keys, orgs, accounts] = await Promise.all([adminApi.keys(), adminApi.orgs(), adminApi.accounts()])
  return { keys, orgs, repos: [], accounts }
}

// A user sees their own keys and the keys of each org they own and each repository they
// administer; the server checks ownership again for every org and repository request.
async function loadUser(): Promise<KeysData> {
  const [own, orgs, repos] = await Promise.all([userApi.keys(), userApi.orgs(), userApi.repos()])
  const [orgKeys, repoKeys] = await Promise.all([
    Promise.all(orgs.map((o) => userApi.orgKeys(o.id))),
    Promise.all(repos.map((r) => userApi.repoKeys(r.id))),
  ])
  const keys = [...own, ...orgKeys.flat(), ...repoKeys.flat()].sort((a, b) => b.priority - a.priority)
  return { keys, orgs, repos, accounts: [] }
}

function AddKeyModal({ data, onClose, onAdded }: { data: KeysData; onClose: () => void; onAdded: () => void }) {
  const toast = useToast()
  const { me, isOwner } = useAuth()
  const [target, setTarget] = useState<Target>('user')
  const [accountId, setAccountId] = useState(data.accounts[0]?.id ?? '')
  const [orgId, setOrgId] = useState(data.orgs[0]?.id ?? '')
  const [repoId, setRepoId] = useState(data.repos[0]?.id ?? '')
  const [apiKey, setApiKey] = useState('')
  const [priority, setPriority] = useState('0')
  const [busy, setBusy] = useState(false)

  const noOrgs = target === 'org' && data.orgs.length === 0
  const noRepos = target === 'repo' && data.repos.length === 0
  const noUsers = isOwner && target === 'user' && data.accounts.length === 0

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const key = { apiKey: apiKey.trim(), priority: Number(priority) || 0 }
    setBusy(true)
    try {
      if (isOwner && target === 'user') {
        await adminApi.createUserKey(accountId, key)
      } else if (isOwner) {
        await adminApi.createOrgKey(orgId, key)
      } else if (target === 'user') {
        await userApi.createKey(key)
      } else if (target === 'org') {
        await userApi.createOrgKey(orgId, key)
      } else {
        await userApi.createRepoKey(repoId, key)
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
            ...(isOwner ? [] : [{ value: 'repo' as const, label: 'Repository' }]),
          ]}
        />
        {target === 'user' &&
          (isOwner ? (
            <SelectField label="User" required value={accountId} onChange={(e) => setAccountId(e.target.value)} hint={noUsers ? 'Nobody has logged in yet.' : undefined}>
              {data.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.login} ({a.id})
                </option>
              ))}
            </SelectField>
          ) : (
            <p className="rounded-xl bg-overlay px-3.5 py-2.5 text-sm">
              Your key{me ? <> as <span className="font-semibold">{me.login}</span></> : null}. Used after any repository and organization keys you may use.
            </p>
          ))}
        {target === 'org' && (
          <SelectField
            label="Organization"
            required
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            hint={noOrgs ? (isOwner ? 'No organizations have been imported yet.' : 'Import an organization you own first.') : 'Used for members of the organization, after repository keys.'}
          >
            {data.orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orgName}
              </option>
            ))}
          </SelectField>
        )}
        {target === 'repo' && (
          <SelectField
            label="Repository"
            required
            value={repoId}
            onChange={(e) => setRepoId(e.target.value)}
            hint={noRepos ? 'Import a repository you administer first.' : 'Used first, for collaborators on the repository and members of its organization.'}
          >
            {data.repos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.fullName}
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
          <Button type="submit" variant="primary" busy={busy} disabled={noOrgs || noRepos || noUsers}>
            Add key
          </Button>
        </div>
      </form>
    </Modal>
  )
}

const OWNER_LABEL: Record<ApiKey['owner']['type'], string> = { user: 'User', org: 'Organization', repo: 'Repository' }

function OwnerIcon({ type }: { type: ApiKey['owner']['type'] }) {
  const Icon = type === 'org' ? Building2 : type === 'repo' ? FolderGit2 : User
  return <Icon aria-hidden className="size-4 text-fg-muted" />
}

export function ApiKeys() {
  const toast = useToast()
  const { isOwner } = useAuth()
  const { data, loading, reload } = useLoad(useCallback(() => (isOwner ? loadAdmin() : loadUser()), [isOwner]))
  const [adding, setAdding] = useState(false)

  const remove = async (key: ApiKey) => {
    try {
      if (isOwner) await adminApi.deleteKey(key.id)
      else if (key.owner.type === 'org') await userApi.deleteOrgKey(key.owner.id, key.id)
      else if (key.owner.type === 'repo') await userApi.deleteRepoKey(key.owner.id, key.id)
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
        description={
          isOwner
            ? 'Every OpenRouter key on the server. Keys are shown by their last four characters only.'
            : 'Your own keys, and the keys of organizations you own and repositories you administer. The agent tries repository keys, then organization keys, then the commenter’s own.'
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
