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
  /** Model per modality, e.g. { text: 'openai/gpt-5' }. */
  models?: ModelSettings
  createdAt: string
}

export interface Repo {
  id: string
  platform: Platform
  /** The platform's repository (GitHub) or project (GitLab) id. */
  externalId: string
  fullName: string
  org: { id: string; name: string | null }
  keyCount?: number
  models?: ModelSettings
  createdAt: string
}

export interface ImportableRepo {
  externalId: string
  fullName: string
  org: string
  importable: boolean
  reason: string | null
}

export type Modality = 'text' | 'image' | 'video' | 'speech' | 'decisions' | 'embeddings' | 'rerank' | 'transcription' | 'audio'

export type ModelSettings = Partial<Record<Modality, string>>

/** One model from OpenRouter's live list, as the server passes it on. */
export interface ModelInfo {
  id: string
  name: string
  description: string
  contextLength: number | null
  /** USD per token, as decimal strings. */
  pricing: { prompt: string | null; completion: string | null }
  free: boolean
  inputModalities: string[]
  outputModalities: string[]
}

export interface ApiKey {
  id: string
  owner: { type: 'user' | 'org' | 'repo'; id: string; platform: Platform; name: string }
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
