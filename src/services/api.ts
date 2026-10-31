import axios, { isAxiosError } from 'axios'
import { authHeaders, type Session } from '../auth/session'
import { apiBaseUrl } from '../config'
import { trimTrailingSlashes } from '../utils/strings'
import type { Account, ApiKey, ImportableOrg, Me, Org, Platform, Providers } from '../types'

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

export interface NewKey {
  apiKey: string
  priority: number
}

const data = <T>(p: Promise<{ data: T }>) => p.then((r) => r.data)

// OAuth sign-in. `start` is a full-page navigation, not an XHR: the platform's consent page
// must open in the browser, and the server sends the browser back to `redirect`.
export const authApi = {
  providers: () => data(api.get<Providers>('/api/auth/providers')),
  // `nonce` comes back as ?signin=… and ties the return to this tab (see beginOAuth).
  startUrl: (platform: Platform, nonce?: string) => {
    const back = new URL('/', window.location.origin)
    if (nonce) back.searchParams.set('signin', nonce)
    return `${trimTrailingSlashes(apiBaseUrl())}/api/auth/${platform}/start?redirect=${encodeURIComponent(back.toString())}`
  },
}

// Operator endpoints: ADMIN_TOKEN, or the platform token of a user in GITHUB_ADMIN_ID / GITLAB_ADMIN_ID.
export const adminApi = {
  accounts: () => data(api.get<Account[]>('/api/admin/accounts')),
  createAccount: (body: { platform: Platform; userId: string; username: string }) =>
    data(api.post<Account>('/api/admin/accounts', body)),
  deleteAccount: (platform: Platform, userId: string) =>
    api.delete(`/api/admin/accounts/${platform}/${encodeURIComponent(userId)}`),
  orgs: () => data(api.get<Org[]>('/api/admin/orgs')),
  deleteOrg: (id: string) => api.delete(`/api/admin/orgs/${id}`),
  keys: () => data(api.get<ApiKey[]>('/api/admin/keys')),
  createUserKey: (platform: Platform, userId: string, key: NewKey) =>
    data(api.post<ApiKey>('/api/admin/keys', { target: 'user', platform, userId, ...key })),
  createOrgKey: (appInstallationId: string, key: NewKey) =>
    data(api.post<ApiKey>('/api/admin/keys', { target: 'org', appInstallationId, ...key })),
  deleteKey: (id: string) => api.delete(`/api/admin/keys/${id}`),
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
}
