import { adminApi, userApi, type NewKey } from './api'
import type { Account, AiProvider, ApiKey, Org, Repo } from '../types'

// Who a new key belongs to. Owners attach keys to users and orgs; users to themselves, orgs
// they own and repositories they administer.
export type KeyTarget = 'user' | 'org' | 'repo'

export interface KeysData {
  keys: ApiKey[]
  orgs: Org[]
  repos: Repo[]
  accounts: Account[]
  providers: AiProvider[]
}

export interface KeyOwnerIds {
  accountId: string
  orgId: string
  repoId: string
}

// What each provider's keys start with, as a hint only.
export const KEY_PLACEHOLDER: Record<string, string> = { openrouter: 'sk-or-…', openai: 'sk-…', anthropic: 'sk-ant-…', deepseek: 'sk-…' }

async function loadAdmin(): Promise<KeysData> {
  const [keys, orgs, accounts, providers] = await Promise.all([adminApi.keys(), adminApi.orgs(), adminApi.accounts(), adminApi.providers()])
  return { keys, orgs, repos: [], accounts, providers }
}

// A user sees their own keys and the keys of each org they own and each repository they
// administer; the server checks ownership again for every org and repository request.
async function loadUser(): Promise<KeysData> {
  const [own, orgs, repos, providers] = await Promise.all([userApi.keys(), userApi.orgs(), userApi.repos(), userApi.providers()])
  const [orgKeys, repoKeys] = await Promise.all([
    Promise.all(orgs.map((o) => userApi.orgKeys(o.id))),
    Promise.all(repos.map((r) => userApi.repoKeys(r.id))),
  ])
  const keys = [...own, ...orgKeys.flat(), ...repoKeys.flat()].sort((a, b) => b.priority - a.priority)
  return { keys, orgs, repos, accounts: [], providers }
}

export function loadKeys(isOwner: boolean): Promise<KeysData> {
  return isOwner ? loadAdmin() : loadUser()
}

// The one place that knows which endpoint stores a key for which owner.
export function createKeyFor(isOwner: boolean, target: KeyTarget, ids: KeyOwnerIds, key: NewKey): Promise<unknown> {
  if (isOwner) return target === 'user' ? adminApi.createUserKey(ids.accountId, key) : adminApi.createOrgKey(ids.orgId, key)
  if (target === 'org') return userApi.createOrgKey(ids.orgId, key)
  if (target === 'repo') return userApi.createRepoKey(ids.repoId, key)
  return userApi.createKey(key)
}

export function deleteKeyOf(isOwner: boolean, key: ApiKey): Promise<unknown> {
  if (isOwner) return adminApi.deleteKey(key.id)
  if (key.owner.type === 'org') return userApi.deleteOrgKey(key.owner.id, key.id)
  if (key.owner.type === 'repo') return userApi.deleteRepoKey(key.owner.id, key.id)
  return userApi.deleteKey(key.id)
}
