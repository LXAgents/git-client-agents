import { LayoutDashboard, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  adminOnly?: boolean
}

export const NAV: NavItem[] = [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }]
