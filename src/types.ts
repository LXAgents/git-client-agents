export type Platform = 'github' | 'gitlab'

/** Lower case, as stored on the server. Only "owner" carries rights today. */
export type Role = 'owner' | 'free'

/** Read from GitHub or GitLab by the server, never stored. `login` is the numeric id when the platform gave no answer. */
export interface Profile {
  login: string
  name: string | null
  avatarUrl: string | null
}

export interface Account extends Profile {
  platform: Platform
  id: string
  role: Role
  keyCount: number
  orgCount: number
  createdAt: string
}

export interface Org {
  id: string
  platform: Platform
  orgName: string
  installationId: string | null
  owner: { platform: Platform; id: string } & Profile
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

export interface Me extends Profile {
  platform: Platform
  id: string
  role: Role
}

export type Providers = Record<Platform, boolean>

// A server log line, from GET /api/admin/logs. `platform` is null for lines about the server itself.
export type LogLevel = 'info' | 'warn' | 'error'

export interface LogLine {
  id: string
  level: LogLevel
  source: string
  message: string
  platform: Platform | null
  taskId: string | null
  createdAt: string
}

export interface LogPage {
  logs: LogLine[]
  next: string | null
}
