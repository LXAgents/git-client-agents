import { Building2, FolderGit2, KeyRound, LayoutDashboard, ScrollText, Sparkles, Users, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  adminOnly?: boolean
}

export const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users, adminOnly: true },
  { to: '/orgs', label: 'Organizations', icon: Building2 },
  { to: '/repos', label: 'Repositories', icon: FolderGit2 },
  { to: '/models', label: 'Models', icon: Sparkles },
  { to: '/keys', label: 'API keys', icon: KeyRound },
  { to: '/logs', label: 'Logs', icon: ScrollText, adminOnly: true },
]
