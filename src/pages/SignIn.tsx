import { useEffect, useState, type FormEvent } from 'react'
import { Bot, ChevronDown } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { BrandIcon } from '../components/BrandIcon'
import { Button } from '../components/Button'
import { Segmented, SelectField, TextField } from '../components/Field'
import { authApi, errorMessage, errorStatus } from '../services/api'
import type { Platform, Providers } from '../types'

type Mode = 'user' | 'admin'

const PLATFORM_NAMES: Record<Platform, string> = { github: 'GitHub', gitlab: 'GitLab' }

function explain(err: unknown, mode: Mode): string {
  const status = errorStatus(err)
  if (status === 401) return mode === 'admin' ? 'That admin token was rejected.' : 'The platform rejected that token.'
  if (status === 403) return 'You are not whitelisted on this server yet. Ask the operator to add your account.'
  return errorMessage(err)
}

function ProviderButton({ platform }: { platform: Platform }) {
  const look =
    platform === 'github'
      ? 'bg-[oklch(0.22_0.01_270)] text-white hover:bg-[oklch(0.3_0.01_270)] dark:bg-white dark:text-[oklch(0.2_0.01_270)] dark:hover:bg-[oklch(0.92_0_0)]'
      : 'border border-line bg-canvas-subtle text-fg hover:bg-overlay'
  return (
    <a
      href={authApi.startUrl(platform)}
      className={`flex h-11 items-center justify-center gap-2.5 rounded-xl text-sm font-medium shadow-xs transition-[background-color,scale] duration-200 active:scale-[0.98] ${look}`}
    >
      <BrandIcon platform={platform} />
      Continue with {PLATFORM_NAMES[platform]}
    </a>
  )
}

export function SignIn() {
  const { signIn, oauthError } = useAuth()
  const [mode, setMode] = useState<Mode>('user')
  const [platform, setPlatform] = useState<Platform>('github')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(() => (oauthError ? explain(oauthError, 'user') : null))
  const [providers, setProviders] = useState<Providers | null>(null)
  const [showToken, setShowToken] = useState(false)

  useEffect(() => {
    authApi
      .providers()
      .then(setProviders)
      .catch(() => setProviders({ github: false, gitlab: false }))
  }, [])

  const enabled = providers ? (Object.keys(PLATFORM_NAMES) as Platform[]).filter((p) => providers[p]) : []
  // With no sign-in buttons configured, the token form is the only way in, so show it.
  const tokenFormOpen = mode === 'admin' || showToken || (providers !== null && enabled.length === 0)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(mode === 'admin' ? { mode, token: token.trim() } : { mode, platform, token: token.trim() })
    } catch (err) {
      setError(explain(err, mode))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="enter w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-linear-to-br from-accent to-accent-2 text-white shadow-[0_12px_32px_-8px_var(--color-accent)]">
            <Bot aria-hidden className="size-7" />
          </span>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">Sign in to git-client-agents</h1>
          <p className="mt-2 text-sm text-fg-muted">Manage the agent server&rsquo;s users, organizations and keys.</p>
        </div>

        <div className="card mt-8 space-y-5 p-6">
          <Segmented
            label="Sign in as"
            value={mode}
            onChange={(m) => {
              setMode(m)
              setError(null)
            }}
            options={[
              { value: 'user', label: 'User' },
              { value: 'admin', label: 'Operator' },
            ]}
          />

          {mode === 'user' && enabled.length > 0 && (
            <div className="space-y-2.5">
              {enabled.map((p) => (
                <ProviderButton key={p} platform={p} />
              ))}
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-danger-muted px-4 py-3 text-sm text-danger ring-1 ring-danger/25 ring-inset">
              {error}
            </p>
          )}

          {mode === 'user' && enabled.length > 0 && (
            <button
              type="button"
              aria-expanded={showToken}
              onClick={() => setShowToken((v) => !v)}
              className="flex w-full items-center gap-3 text-xs font-medium text-fg-muted transition-colors hover:text-fg"
            >
              <span className="h-px flex-1 bg-line" />
              Use a personal access token instead
              <ChevronDown aria-hidden className={`size-3.5 transition-transform ${showToken ? 'rotate-180' : ''}`} />
              <span className="h-px flex-1 bg-line" />
            </button>
          )}

          {tokenFormOpen && (
            <form onSubmit={submit} className="enter space-y-4">
              {mode === 'user' && (
                <SelectField label="Platform" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
                  <option value="github">GitHub</option>
                  <option value="gitlab">GitLab</option>
                </SelectField>
              )}
              <TextField
                label={mode === 'admin' ? 'Admin token' : 'Personal access token'}
                type="password"
                autoComplete="off"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                hint={
                  mode === 'admin'
                    ? 'The ADMIN_TOKEN configured on git-server-agents.'
                    : platform === 'github'
                      ? 'Needs the read:org scope. Used to check who you are and which orgs you own; never stored by the server.'
                      : 'Needs the read_api scope. Used to check who you are and which groups you own; never stored by the server.'
                }
              />
              <Button type="submit" variant="primary" busy={busy} className="w-full">
                Sign in
              </Button>
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-fg-muted">Your sign-in stays in this browser tab and is cleared when you close it.</p>
      </div>
    </div>
  )
}
