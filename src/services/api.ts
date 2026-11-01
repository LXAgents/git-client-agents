import axios, { isAxiosError } from 'axios'
import { authHeaders, type Session } from '../auth/session'
import { apiBaseUrl } from '../config'
import { trimTrailingSlashes } from '../utils/strings'
import type { AiProvider, Account, ApiKey, ImportableOrg, ImportableRepo, LogLevel, LogPage, Me, Modality, ModelChoice, ModelInfo, ModelScope, ModelSettings, Org, Platform, ProviderId, Providers, Repo } from '../types'

export const api = axios.create({
  baseURL: apiBaseUrl(),
  timeout: 20_000,
})

let current: Session | null = null

export function setApiSession(session: Session | null) {
  current = session
}

api.interceptors.request.use((config) => {
  for (const [name, value] of Object.entries(authHeaders(current))) config.headers.set(name, value)
  return config
})

export function errorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const body = err.response?.data as { error?: string } | undefined
    if (body?.error) return body.error
    if (err.response) return `Request failed (${err.response.status})`
    return 'Cannot reach the server. Is git-server-agents running?'
  }
  return err instanceof Error ? err.message : String(err)
}

export function errorStatus(err: unknown): number | undefined {
  return isAxiosError(err) ? err.response?.status : undefined
}

// The headers of the current session, for calls made with fetch (the chat stream).
export function sessionHeaders(): Record<string, string> {
  return authHeaders(current)
}

export interface NewWorkspaceKey {
  /** A GitHub personal access token with the codespace scope. */
  token: string
  priority: number
}

export interface NewKey {
  apiKey: string
  priority: number
  /** The AI provider the key is for, e.g. "openai". */
  provider: ProviderId
}

// The body of a model PUT: null clears the choice so the owner falls back.
const modelBody = (modality: Modality, choice: ModelChoice | null) => ({ modality, provider: choice?.provider ?? null, model: choice?.model ?? null })

const data = <T>(p: Promise<{ data: T }>) => p.then((r) => r.data)

// OAuth sign-in. `start` is a full-page navigation, not an XHR: the platform's consent page
// must open in the browser, and the server sends the browser back to `redirect`.
export const authApi = {
  providers: () => data(api.get<Providers>('/api/auth/providers')),
  // Swaps the one-time code from the OAuth return for the user's token.
  exchange: (code: string) => data(api.post<{ platform: Platform; token: string }>('/api/auth/exchange', { code })),
  // `nonce` comes back as ?signin=… and ties the return to this tab (see beginOAuth).
  startUrl: (platform: Platform, nonce?: string) => {
    const back = new URL('/', window.location.origin)
    if (nonce) back.searchParams.set('signin', nonce)
    return `${trimTrailingSlashes(apiBaseUrl())}/api/auth/${platform}/start?redirect=${encodeURIComponent(back.toString())}`
  },
}

// Owner endpoints: ADMIN_TOKEN, or the platform token of a user whose role is "owner". Every call
// works on the session's platform only (X-Platform).
export const adminApi = {
  accounts: () => data(api.get<Account[]>('/api/admin/accounts')),
  createAccount: (body: { userId: string }) =>
    data(api.post<Account>('/api/admin/accounts', body)),
  deleteAccount: (platform: Platform, userId: string) =>
    api.delete(`/api/admin/accounts/${platform}/${encodeURIComponent(userId)}`),
  orgs: () => data(api.get<Org[]>('/api/admin/orgs')),
  deleteOrg: (id: string) => api.delete(`/api/admin/orgs/${id}`),
  keys: () => data(api.get<ApiKey[]>('/api/admin/keys')),
  createUserKey: (userId: string, key: NewKey) => data(api.post<ApiKey>('/api/admin/keys', { target: 'user', userId, ...key })),
  createOrgKey: (appInstallationId: string, key: NewKey) =>
    data(api.post<ApiKey>('/api/admin/keys', { target: 'org', appInstallationId, ...key })),
  deleteKey: (id: string) => api.delete(`/api/admin/keys/${id}`),
  providers: () => data(api.get<AiProvider[]>('/api/admin/providers')),
  repos: () => data(api.get<Repo[]>('/api/admin/repos')),
  deleteRepo: (id: string) => api.delete(`/api/admin/repos/${id}`),
  // Newest first. `level` is the lowest level shown; pass the previous page's `next` as `before`.
  logs: (params: { level?: LogLevel; source?: string; before?: string; limit?: number } = {}) =>
    data(api.get<LogPage>('/api/admin/logs', { params })),
}

// Signed-in user endpoints (platform token). The server re-checks org ownership every call.
export const userApi = {
  me: () => data(api.get<Me>('/api/user/me')),
  keys: () => data(api.get<ApiKey[]>('/api/user/keys')),
  createKey: (key: NewKey) => data(api.post<ApiKey>('/api/user/keys', key)),
  deleteKey: (id: string) => api.delete(`/api/user/keys/${id}`),
  orgs: () => data(api.get<Org[]>('/api/user/orgs')),
  importable: () => data(api.get<ImportableOrg[]>('/api/user/orgs/importable')),
  importOrg: (orgName: string) => data(api.post<Org>('/api/user/orgs/import', { orgName })),
  deleteOrg: (id: string) => api.delete(`/api/user/orgs/${id}`),
  orgKeys: (orgId: string) => data(api.get<ApiKey[]>(`/api/user/orgs/${orgId}/keys`)),
  createOrgKey: (orgId: string, key: NewKey) => data(api.post<ApiKey>(`/api/user/orgs/${orgId}/keys`, key)),
  deleteOrgKey: (orgId: string, keyId: string) => api.delete(`/api/user/orgs/${orgId}/keys/${keyId}`),
  setOrgModel: (orgId: string, modality: Modality, choice: ModelChoice | null) =>
    data(api.put<ModelSettings>(`/api/user/orgs/${orgId}/models`, modelBody(modality, choice))),

  // The AI providers, for the provider dropdowns.
  providers: () => data(api.get<AiProvider[]>('/api/user/providers')),
  // One provider's live model list (the server keeps it for a few minutes). Providers other than
  // OpenRouter list with a key: the user's own, or the org's or repository's in `scope`.
  models: (modality: Modality, provider: ProviderId, scope: ModelScope = {}) =>
    data(api.get<ModelInfo[]>('/api/user/models', { params: { modality, provider, ...scope } })),
  ownModels: () => data(api.get<ModelSettings>('/api/user/models/settings')),
  setOwnModel: (modality: Modality, choice: ModelChoice | null) => data(api.put<ModelSettings>('/api/user/models/settings', modelBody(modality, choice))),

  // Repositories the user administers. The server asks the platform again on every call.
  repos: () => data(api.get<Repo[]>('/api/user/repos')),
  importableRepos: () => data(api.get<ImportableRepo[]>('/api/user/repos/importable')),
  importRepo: (externalId: string) => data(api.post<Repo>('/api/user/repos/import', { externalId })),
  deleteRepo: (id: string) => api.delete(`/api/user/repos/${id}`),
  repoKeys: (repoId: string) => data(api.get<ApiKey[]>(`/api/user/repos/${repoId}/keys`)),
  createRepoKey: (repoId: string, key: NewKey) => data(api.post<ApiKey>(`/api/user/repos/${repoId}/keys`, key)),
  deleteRepoKey: (repoId: string, keyId: string) => api.delete(`/api/user/repos/${repoId}/keys/${keyId}`),
  setRepoModel: (repoId: string, modality: Modality, choice: ModelChoice | null) =>
    data(api.put<ModelSettings>(`/api/user/repos/${repoId}/models`, modelBody(modality, choice))),

  // Workspace keys (GitHub Codespaces tokens) for the agent's workspace tools. GitHub only.
  workspaceKeys: () => data(api.get<ApiKey[]>('/api/user/workspace-keys')),
  createWorkspaceKey: (key: NewWorkspaceKey) => data(api.post<ApiKey>('/api/user/workspace-keys', key)),
  deleteWorkspaceKey: (id: string) => api.delete(`/api/user/workspace-keys/${id}`),
  orgWorkspaceKeys: (orgId: string) => data(api.get<ApiKey[]>(`/api/user/orgs/${orgId}/workspace-keys`)),
  createOrgWorkspaceKey: (orgId: string, key: NewWorkspaceKey) => data(api.post<ApiKey>(`/api/user/orgs/${orgId}/workspace-keys`, key)),
  deleteOrgWorkspaceKey: (orgId: string, keyId: string) => api.delete(`/api/user/orgs/${orgId}/workspace-keys/${keyId}`),
  repoWorkspaceKeys: (repoId: string) => data(api.get<ApiKey[]>(`/api/user/repos/${repoId}/workspace-keys`)),
  createRepoWorkspaceKey: (repoId: string, key: NewWorkspaceKey) => data(api.post<ApiKey>(`/api/user/repos/${repoId}/workspace-keys`, key)),
  deleteRepoWorkspaceKey: (repoId: string, keyId: string) => api.delete(`/api/user/repos/${repoId}/workspace-keys/${keyId}`),
}
