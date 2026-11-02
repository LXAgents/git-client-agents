import { useState, type FormEvent } from 'react'
import { errorMessage, WORKSPACE_PROVIDERS, type WorkspaceProviderId } from '../services/api'
import type { KeyTarget } from '../services/keys'
import { createWorkspaceKeyFor, type WorkspaceKeysData } from '../services/workspaceKeys'
import { Button } from './Button'
import { Segmented, SelectField, TextField } from './Field'
import { Modal } from './Modal'
import { useToast } from './Toast'

// Adds a workspace key (for now a GitHub Codespaces token) for yourself, an org you own or a repository you administer.
export function AddWorkspaceKeyModal({ data, onClose, onAdded }: { data: WorkspaceKeysData; onClose: () => void; onAdded: () => void }) {
  const toast = useToast()
  const [target, setTarget] = useState<KeyTarget>('user')
  const [provider, setProvider] = useState<WorkspaceProviderId>(WORKSPACE_PROVIDERS[0].id)
  const [orgId, setOrgId] = useState(data.orgs[0]?.id ?? '')
  const [repoId, setRepoId] = useState(data.repos[0]?.id ?? '')
  const [token, setToken] = useState('')
  const [priority, setPriority] = useState('0')
  const [busy, setBusy] = useState(false)
  const noOrgs = target === 'org' && data.orgs.length === 0
  const noRepos = target === 'repo' && data.repos.length === 0

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await createWorkspaceKeyFor(target, { orgId, repoId }, { provider, token: token.trim(), priority: Number(priority) || 0 })
      toast.success('Workspace key added')
      onAdded()
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Add a workspace key" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <SelectField label="Platform" required value={provider} onChange={(e) => setProvider(e.target.value as WorkspaceProviderId)} hint="Where the agent starts its workspace.">
          {WORKSPACE_PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </SelectField>
        <Segmented
          label="Attach to"
          value={target}
          onChange={setTarget}
          options={[
            { value: 'user', label: 'Me' },
            { value: 'org', label: 'Organization' },
            { value: 'repo', label: 'Repository' },
          ]}
        />
        {target === 'org' && (
          <SelectField label="Organization" required value={orgId} onChange={(e) => setOrgId(e.target.value)} hint={noOrgs ? 'Import an organization you own first.' : 'Used for members of the organization, after repository keys.'}>
            {data.orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orgName}
              </option>
            ))}
          </SelectField>
        )}
        {target === 'repo' && (
          <SelectField label="Repository" required value={repoId} onChange={(e) => setRepoId(e.target.value)} hint={noRepos ? 'Import a repository you administer first.' : 'Tried first, for collaborators on the repository.'}>
            {data.repos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.fullName}
              </option>
            ))}
          </SelectField>
        )}
        <TextField
          label="GitHub personal access token"
          type="password"
          autoComplete="off"
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ghp_… or github_pat_…"
          hint="Needs the codespace scope, and repo to push. Codespaces run and bill on this token's account."
        />
        <TextField label="Priority" type="number" step={1} value={priority} onChange={(e) => setPriority(e.target.value)} hint="Higher is tried first. If GitHub refuses a key, the next one is used." />
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" busy={busy} disabled={noOrgs || noRepos}>
            Add workspace key
          </Button>
        </div>
      </form>
    </Modal>
  )
}
