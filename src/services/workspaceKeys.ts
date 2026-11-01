import { userApi, type NewWorkspaceKey } from './api'
import type { KeyOwnerIds, KeyTarget } from './keys'
import type { ApiKey, Org, Repo } from '../types'

// Workspace keys: GitHub personal access tokens with the codespace scope, for the agent's
// workspace tools. Kept apart from the AI keys; every user (owner included) manages them through
// the user API, for themselves, orgs they own and repositories they administer.
export interface WorkspaceKeysData {
  keys: ApiKey[]
  orgs: Org[]
  repos: Repo[]
}

export async function loadWorkspaceKeys(): Promise<WorkspaceKeysData> {
  const [own, orgs, repos] = await Promise.all([userApi.workspaceKeys(), userApi.orgs(), userApi.repos()])
  const [orgKeys, repoKeys] = await Promise.all([
    Promise.all(orgs.map((o) => userApi.orgWorkspaceKeys(o.id))),
    Promise.all(repos.map((r) => userApi.repoWorkspaceKeys(r.id))),
  ])
  // The order the agent tries them: repository, then organization, then your own; by priority.
  const rank = { repo: 0, org: 1, user: 2 }
  const keys = [...own, ...orgKeys.flat(), ...repoKeys.flat()].sort((a, b) => rank[a.owner.type] - rank[b.owner.type] || b.priority - a.priority)
  return { keys, orgs, repos }
}

export function createWorkspaceKeyFor(target: KeyTarget, ids: Pick<KeyOwnerIds, 'orgId' | 'repoId'>, key: NewWorkspaceKey): Promise<unknown> {
  if (target === 'org') return userApi.createOrgWorkspaceKey(ids.orgId, key)
  if (target === 'repo') return userApi.createRepoWorkspaceKey(ids.repoId, key)
  return userApi.createWorkspaceKey(key)
}

export function deleteWorkspaceKeyOf(key: ApiKey): Promise<unknown> {
  if (key.owner.type === 'org') return userApi.deleteOrgWorkspaceKey(key.owner.id, key.id)
  if (key.owner.type === 'repo') return userApi.deleteRepoWorkspaceKey(key.owner.id, key.id)
  return userApi.deleteWorkspaceKey(key.id)
}
