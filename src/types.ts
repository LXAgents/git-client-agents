export type Platform = 'github' | 'gitlab'

export interface Account {
  platform: Platform
  id: string
  username: string | null
  keyCount: number
  orgCount: number
  createdAt: string
}

export interface Org {
  id: string
  platform: Platform
  orgName: string
  installationId: string | null
  owner: { platform: Platform; id: string; username: string | null }
  keyCount?: number
  createdAt: string
}

export interface ApiKey {
  id: string
  owner: { type: 'user' | 'org'; id: string; platform: Platform; name: string }
  provider: string
  priority: number
  isActive: boolean
  last4: string | null
  createdAt: string
}

export interface ImportableOrg {
  name: string
  kind: 'user' | 'org'
  importable: boolean
  reason: string | null
  appInstallationId: string | null
}

export interface Me {
  platform: Platform
  id: string
  login: string
  username: string | null
  /** True when the user's ID is in GITHUB_ADMIN_ID or GITLAB_ADMIN_ID on the server. */
  isAdmin?: boolean
}

export type Providers = Record<Platform, boolean>
