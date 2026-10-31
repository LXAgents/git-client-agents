import type { ReactNode } from 'react'
import type { Platform, Role } from '../types'
import { BrandIcon } from './BrandIcon'

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}

type Tone = 'default' | 'success' | 'attention' | 'accent' | 'danger' | 'free'

// A soft tinted pill. The tint is mixed from the tone colour, so it works in light and dark.
const tones: Record<Tone, string> = {
  default: '[--tone:var(--color-fg-muted)]',
  success: '[--tone:var(--color-success)]',
  attention: '[--tone:var(--color-attention)]',
  accent: '[--tone:var(--color-accent)]',
  danger: '[--tone:var(--color-danger)]',
  free: '[--tone:var(--color-free)]',
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklch,var(--tone)_14%,transparent)] px-2.5 py-0.5 text-xs font-medium text-[color-mix(in_oklch,var(--tone)_85%,var(--color-fg))] ring-1 ring-[color-mix(in_oklch,var(--tone)_25%,transparent)] ring-inset ${tones[tone]}`}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-(--tone)" />
      {children}
    </span>
  )
}

const ROLE_BADGES: Record<Role, { label: string; tone: Tone }> = {
  owner: { label: 'Owner', tone: 'accent' },
  free: { label: 'Free', tone: 'free' },
}

// An account's role: Owner for the platform's owner, a light green Free for everyone else.
export function RoleBadge({ role }: { role: Role }) {
  const { label, tone } = ROLE_BADGES[role] ?? ROLE_BADGES.free
  return <Badge tone={tone}>{label}</Badge>
}

// The platform's logo in place of its name; the name stays as alt text and tooltip.
export function PlatformBadge({ platform }: { platform: Platform }) {
  return <BrandIcon platform={platform} label className="size-5" />
}
