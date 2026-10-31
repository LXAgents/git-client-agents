import { NavLink, Outlet, useNavigate } from 'react-router'
import { Bot, LogOut } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { NAV, type NavItem } from '../nav'

export function Layout({ nav = NAV }: { nav?: NavItem[] }) {
  const { session, me, signOut: endSession } = useAuth()
  const navigate = useNavigate()
  // The next person to sign in starts on the dashboard, not on the last page visited.
  const signOut = () => {
    navigate('/')
    endSession()
  }
  const isAdmin = session?.mode === 'admin'
  const items = nav.filter((item) => isAdmin || !item.adminOnly)
  const who = isAdmin ? 'Operator' : me ? `${me.login} · ${me.platform === 'github' ? 'GitHub' : 'GitLab'}` : ''

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-line bg-canvas-inset md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 px-4 py-4">
            <Bot aria-hidden className="size-6 text-accent" />
            <div>
              <p className="text-sm font-semibold leading-tight">git-client-agents</p>
              <p className="text-xs text-fg-muted">Agent server settings</p>
            </div>
          </div>
          <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-1 md:flex-col md:overflow-visible">
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `relative flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm ${
                    isActive
                      ? 'bg-overlay font-semibold text-fg md:before:absolute md:before:inset-y-1.5 md:before:-left-2 md:before:w-1 md:before:rounded md:before:bg-accent'
                      : 'text-fg-muted hover:bg-overlay hover:text-fg'
                  }`
                }
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden border-t border-line px-4 py-3 md:block">
            <p className="truncate text-xs text-fg-muted" title={who}>
              Signed in as <span className="text-fg">{who}</span>
            </p>
            <button type="button" onClick={signOut} className="mt-2 inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-danger">
              <LogOut aria-hidden className="size-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 md:py-8">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
        <button type="button" onClick={signOut} className="mt-8 inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-danger md:hidden">
          <LogOut aria-hidden className="size-3.5" />
          Sign out
        </button>
      </main>
    </div>
  )
}
