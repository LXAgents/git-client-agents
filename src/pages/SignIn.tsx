import { useEffect, useState } from 'react'
import { Bot } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { beginOAuth } from '../auth/session'
import { BrandIcon } from '../components/BrandIcon'
import { authApi, errorMessage, errorStatus } from '../services/api'
import type { Platform, Providers } from '../types'

const PLATFORM_NAMES: Record<Platform, string> = { github: 'GitHub', gitlab: 'GitLab' }

function explain(err: unknown): string {
  const status = errorStatus(err)
  if (status === 401) return 'GitHub or GitLab did not accept the sign-in. Try again.'
  if (status === 403) return 'You are not whitelisted on this server yet. Ask the owner to add your account.'
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
      onClick={(e) => {
        e.preventDefault()
        window.location.assign(authApi.startUrl(platform, beginOAuth()))
      }}
      className={`flex h-11 items-center justify-center gap-2.5 rounded-xl text-sm font-medium shadow-xs transition-[background-color,scale] duration-200 active:scale-[0.98] ${look}`}
    >
      <BrandIcon platform={platform} onDark={platform === 'github'} />
      Continue with {PLATFORM_NAMES[platform]}
    </a>
  )
}

export function SignIn() {
  const { oauthError } = useAuth()
  const [providers, setProviders] = useState<Providers | null>(null)
  const error = oauthError ? explain(oauthError) : null

  useEffect(() => {
    authApi
      .providers()
      .then(setProviders)
      .catch(() => setProviders({ github: false, gitlab: false }))
  }, [])

  const enabled = providers ? (Object.keys(PLATFORM_NAMES) as Platform[]).filter((p) => providers[p]) : []

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
          {enabled.length > 0 && (
            <div className="space-y-2.5">
              {enabled.map((p) => (
                <ProviderButton key={p} platform={p} />
              ))}
            </div>
          )}

          {providers !== null && enabled.length === 0 && (
            <p className="text-center text-sm text-fg-muted">
              No sign-in is set up on the server yet. Set <code className="font-mono text-xs">GITHUB_CLIENT_ID</code> and{' '}
              <code className="font-mono text-xs">GITHUB_CLIENT_SECRET</code> (or the GitLab pair) there first.
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-danger-muted px-4 py-3 text-sm text-danger ring-1 ring-danger/25 ring-inset">
              {error}
            </p>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-fg-muted">A reload signs you straight back in. Closing the tab signs you out.</p>
      </div>
    </div>
  )
}
