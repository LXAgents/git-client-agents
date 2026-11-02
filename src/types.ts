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
  /** Provider and model per modality, e.g. { text: { provider: 'openai', model: 'gpt-5' } }. */
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

/** An AI provider slug, as the server names it: openrouter, openai, anthropic, deepseek, zai. */
export type ProviderId = string

/** One AI provider, from GET /api/user/providers. */
export interface AiProvider {
  id: ProviderId
  name: string
  /** A model id to show as an example, e.g. "gpt-5". */
  example: string
  /** True when the provider lists its models only to a key holder (all but OpenRouter). */
  keyForModels: boolean
  /** True when the provider reports what an answer cost (OpenRouter only). */
  reportsCost: boolean
}

/** What one owner picked for one modality. */
export interface ModelChoice {
  provider: ProviderId
  model: string
}

export type ModelSettings = Partial<Record<Modality, ModelChoice>>

/** Whose key lists a provider's models: the user's own (no ids), or an org's or repository's. */
export interface ModelScope {
  orgId?: string
  repoId?: string
}

/** One model from a provider's live list, as the server passes it on. Only OpenRouter has prices. */
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
  provider?: ProviderId
}

export interface ApiKey {
  id: string
  owner: { type: 'user' | 'org' | 'repo'; id: string; platform: Platform; name: string }
  /** The provider's display name, e.g. "OpenAI". */
  provider: string
  providerSlug?: ProviderId | null
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

/** A chat room as the server names it: user:{accountId}, repo:{repoId} or org:{orgId}. */
export type ChatRoomKind = 'user' | 'repo' | 'org'

export interface ChatRoom {
  room: string
  name: string
}

export interface ChatRooms {
  user: ChatRoom
  orgs: ChatRoom[]
  repos: ChatRoom[]
}

export interface ChatSession {
  id: string
  room: string
  title: string
  /** "{platform}:{account id}" of who started it; null for the agent's activity session. */
  createdBy: string | null
  /** The room's Agent activity session: reports of comment answers, and questions for the agent. */
  activity?: boolean
  createdAt: string
  updatedAt: string
}

export type ChatEventType = 'message' | 'progress' | 'report' | 'token'

export interface ChatEvent {
  /** Set on stored events (messages and reports). */
  id?: string
  type: ChatEventType
  room: string
  sessionId: string | null
  sender: { id: string | null; login: string | null; type: 'user' | 'agent'; avatarUrl?: string | null }
  content: string
  data?: { status?: string; tool?: string; reset?: boolean; error?: boolean; model?: string; provider?: string; cost?: string; where?: string; usage?: ChatUsage; [key: string]: unknown }
  timestamp: string
}

/** Usage stored with an agent answer or report (server 1.19.0 and later). */
export interface ChatUsage {
  costUsd: number | null
  costComplete: boolean
  inputTokens: number
  outputTokens: number
  tokensComplete: boolean
}

/** Key counts per owner the agent would try: the repository's, the org's and your own. */
export interface ChatKeyCounts {
  repo: number
  org: number
  user: number
  total: number
}

/** GET /api/chat/summary: what the Chat page's details pane shows. */
export interface ChatSummary {
  room: { room: string; kind: ChatRoomKind; name: string; platform: Platform }
  model: { provider: string; providerName: string; model: string; source?: 'repo' | 'org' | 'user' | 'default' }
  keys: {
    ai: ChatKeyCounts
    /** Null on platforms without workspaces (GitLab). */
    workspace: (ChatKeyCounts & { provider: string; providerName: string }) | null
  }
  stats: {
    answers: number
    inputTokens: number
    outputTokens: number
    costUsd: number
    costComplete: boolean
    tokensComplete: boolean
    answersWithoutUsage: number
    capped: boolean
  }
}

export interface PostedChatMessage {
  message: ChatEvent
  sessionId: string
  agent: 'answering' | 'busy' | 'idle'
}
