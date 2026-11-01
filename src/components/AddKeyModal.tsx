import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { DEFAULT_PROVIDER } from '../modalities'
import { errorMessage } from '../services/api'
import { createKeyFor, KEY_PLACEHOLDER, type KeysData, type KeyTarget } from '../services/keys'
import { Button } from './Button'
import { Segmented, SelectField, TextField } from './Field'
import { Modal } from './Modal'
import { useToast } from './Toast'

// Adds a key for one provider to a user, an org or (for users) a repository.
export function AddKeyModal({ data, onClose, onAdded }: { data: KeysData; onClose: () => void; onAdded: () => void }) {
  const toast = useToast()
  const { me, isOwner } = useAuth()
  const [target, setTarget] = useState<KeyTarget>('user')
  const [accountId, setAccountId] = useState(data.accounts[0]?.id ?? '')
  const [orgId, setOrgId] = useState(data.orgs[0]?.id ?? '')
  const [repoId, setRepoId] = useState(data.repos[0]?.id ?? '')
  const [provider, setProvider] = useState(data.providers[0]?.id ?? DEFAULT_PROVIDER)
  const [apiKey, setApiKey] = useState('')
  const [priority, setPriority] = useState('0')
  const [busy, setBusy] = useState(false)

  const providerName = data.providers.find((p) => p.id === provider)?.name ?? provider
  const noOrgs = target === 'org' && data.orgs.length === 0
  const noRepos = target === 'repo' && data.repos.length === 0
  const noUsers = isOwner && target === 'user' && data.accounts.length === 0

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const key = { apiKey: apiKey.trim(), priority: Number(priority) || 0, provider }
    setBusy(true)
    try {
      await createKeyFor(isOwner, target, { accountId, orgId, repoId }, key)
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
        <SelectField label="Provider" required value={provider} onChange={(e) => setProvider(e.target.value)} hint="The agent uses this key only for models of this provider.">
          {data.providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </SelectField>
        <TextField
          label={`${providerName} API key`}
          type="password"
          autoComplete="off"
          required
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={KEY_PLACEHOLDER[provider] ?? 'Your key'}
        />
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
