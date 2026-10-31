import type { ReactNode } from 'react'

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-normal">{title}</h1>
        {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'success' | 'attention' | 'accent' }) {
  const tones = {
    default: 'border-line text-fg-muted',
    success: 'border-success/60 text-success-hover',
    attention: 'border-attention/60 text-attention',
    accent: 'border-accent/60 text-accent',
  }
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>
}

export function PlatformBadge({ platform }: { platform: string }) {
  return <Badge tone={platform === 'github' ? 'default' : 'attention'}>{platform === 'github' ? 'GitHub' : 'GitLab'}</Badge>
}
