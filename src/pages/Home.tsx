import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Building2, KeyRound, Users, type LucideIcon } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { adminApi, errorMessage, userApi } from '../services/api'

interface Stat {
  label: string
  value: number | null
  to: string
  icon: LucideIcon
  blurb: string
}

export function Home() {
  const { session, me } = useAuth()
  const toast = useToast()
  const isAdmin = session?.mode === 'admin'
  const [counts, setCounts] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    const load = isAdmin
      ? Promise.all([adminApi.accounts(), adminApi.orgs(), adminApi.keys()]).then(([a, o, k]) => ({ users: a.length, orgs: o.length, keys: k.length }))
      : Promise.all([userApi.orgs(), userApi.keys()]).then(([o, k]) => ({ orgs: o.length, keys: k.length }))
    load.then(setCounts).catch((err) => toast.error(errorMessage(err)))
  }, [isAdmin, toast])

  const stats: Stat[] = [
    ...(isAdmin ? [{ label: 'Whitelisted users', value: counts?.users ?? null, to: '/users', icon: Users, blurb: 'Who may trigger the agent.' }] : []),
    {
      label: isAdmin ? 'Organizations' : 'Organizations you own',
      value: counts?.orgs ?? null,
      to: '/orgs',
      icon: Building2,
      blurb: 'Imported from GitHub or GitLab.',
    },
    {
      label: isAdmin ? 'API keys' : 'Your API keys',
      value: counts?.keys ?? null,
      to: '/keys',
      icon: KeyRound,
      blurb: 'OpenRouter keys, tried in priority order.',
    },
  ]

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Welcome, operator' : `Welcome${me ? `, ${me.login}` : ''}`}
        description="Manage who can use the agent server, which organizations it serves, and the API keys it spends."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, to, icon: Icon, blurb }) => (
          <Link key={to} to={to} className="group rounded-md border border-line bg-canvas-subtle p-4 hover:border-accent/60">
            <div className="flex items-center gap-2 text-sm text-fg-muted">
              <Icon aria-hidden className="size-4" />
              {label}
            </div>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{value ?? '–'}</p>
            <p className="mt-1 text-xs text-fg-muted group-hover:text-fg">{blurb}</p>
          </Link>
        ))}
      </div>
      <section className="mt-8 rounded-md border border-line p-4 text-sm text-fg-muted">
        <h2 className="mb-2 font-semibold text-fg">How access works</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>The operator whitelists users. Nobody else can.</li>
          <li>Organizations are only ever imported by one of their owners, and only when the app is installed.</li>
          <li>Org keys can be changed by org owners only. The server asks GitHub or GitLab every time.</li>
          <li>When a comment is answered, your keys are tried first, then the org's, highest priority first.</li>
        </ul>
      </section>
    </>
  )
}
