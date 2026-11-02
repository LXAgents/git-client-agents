import { NavLink, Outlet, useMatch, useNavigate } from 'react-router'
import { Bot, LogOut } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { NAV, type NavItem } from '../nav'
import { BrandIcon } from './BrandIcon'
import { RoleBadge } from './PageHeader'

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-accent to-accent-2 text-white shadow-[0_6px_16px_-6px_var(--color-accent)]">
        <Bot aria-hidden className="size-5" />
      </span>
      <div>
        <p className="text-sm leading-tight font-semibold tracking-tight">git-client-agents</p>
        <p className="text-xs text-fg-muted">Agent server settings</p>
      </div>
    </div>
  )
}

export function Layout({ nav = NAV }: { nav?: NavItem[] }) {
  const { session, me, isOwner, signOut: endSession } = useAuth()
  const navigate = useNavigate()
  // The Chat page's three panes use the whole width; other pages keep a readable column.
  const wide = useMatch('/chat') !== null
  // The next person to sign in starts on the dashboard, not on the last page visited.
  const signOut = () => {
    navigate('/')
    endSession()
  }
  const items = nav.filter((item) => isOwner || !item.adminOnly)
  const name = me?.name ?? me?.login ?? ''

  const signOutButton = (
    <button
      type="button"
      onClick={signOut}
      aria-label="Sign out"
      className="grid size-8 shrink-0 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-danger-muted hover:text-danger"
    >
      <LogOut aria-hidden className="size-4" />
    </button>
  )

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="glass sticky top-0 z-30 border-b border-line-muted md:h-dvh md:w-68 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 py-4 md:py-6">
            <Brand />
            <div className="md:hidden">{signOutButton}</div>
          </div>
          <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible">
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-accent/12 text-accent' : 'text-fg-muted hover:bg-overlay hover:text-fg'
                  }`
                }
              >
                <Icon aria-hidden className="size-4.5" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="m-3 hidden items-center gap-3 rounded-2xl border border-line-muted bg-canvas-subtle/70 p-3 md:flex">
            <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-overlay text-sm font-semibold uppercase">
              {me?.avatarUrl ? (
                <img src={me.avatarUrl} alt="" className="size-9 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <BrandIcon platform={session?.platform ?? 'github'} className="size-4.5" />
              )}
              {me?.avatarUrl && session && (
                <span className="absolute -right-0.5 -bottom-0.5 grid size-4 place-items-center rounded-full bg-canvas ring-2 ring-canvas">
                  <BrandIcon platform={session.platform} className="size-3" />
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" title={name}>
                {name}
              </p>
              {me?.name && <p className="truncate text-xs text-fg-muted">@{me.login}</p>}
              {me && (
                <div className="mt-1">
                  <RoleBadge role={isOwner ? 'owner' : me.role} />
                </div>
              )}
            </div>
            {signOutButton}
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 md:px-12 md:py-12">
        <div className={wide ? 'w-full' : 'mx-auto max-w-5xl'} data-width={wide ? 'full' : 'column'}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
