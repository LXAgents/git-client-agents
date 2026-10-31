import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, Building2, KeyRound, ShieldCheck, Users, type LucideIcon } from 'lucide-react'
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

const ACCESS_RULES = [
  'The operator and admin users whitelist users. Nobody else can.',
  'Organizations are only ever imported by one of their owners, and only when the app is installed.',
  'Org keys can be changed by org owners only. The server asks GitHub or GitLab every time.',
  'When a comment is answered, your keys are tried first, then the org’s, highest priority first.',
]

export function Home() {
  const { session, me, isAdmin } = useAuth()
  const toast = useToast()
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
        title={session?.mode === 'admin' ? 'Welcome, operator' : `Welcome${me ? `, ${me.login}` : ''}`}
        description="Manage who can use the agent server, which organizations it serves, and the API keys it spends."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, to, icon: Icon, blurb }) => (
          <Link
            key={to}
            to={to}
            className="group card enter @container relative overflow-hidden p-5 transition-[translate,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-raised"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-fg-muted">{label}</p>
              <span className="grid size-9 place-items-center rounded-xl bg-accent/12 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                <Icon aria-hidden className="size-4.5" />
              </span>
            </div>
            <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums @[18rem]:text-5xl">{value ?? '–'}</p>
            <p className="mt-2 flex items-center gap-1 text-xs text-fg-muted">
              {blurb}
              <ArrowUpRight aria-hidden className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </p>
          </Link>
        ))}
      </div>
      <section className="card enter mt-8 p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <ShieldCheck aria-hidden className="size-5 text-accent" />
          How access works
        </h2>
        <ul className="mt-4 grid gap-3 text-sm text-fg-muted sm:grid-cols-2">
          {ACCESS_RULES.map((rule) => (
            <li key={rule} className="rounded-xl bg-overlay/60 px-4 py-3">
              {rule}
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
