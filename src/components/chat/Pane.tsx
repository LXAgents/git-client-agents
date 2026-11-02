import { useEffect, useRef, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  id: string
  title: string
  icon: LucideIcon
  /** Next to the title, e.g. the live indicator. */
  aside?: ReactNode
  /** Under the title, e.g. a session picker. */
  toolbar?: ReactNode
  /** Kept in view at the bottom when it changes, e.g. the message count. */
  scrollKey?: unknown
  footer?: ReactNode
  children: ReactNode
}

// One column of the Chat page: a titled card whose body scrolls on its own.
export function Pane({ id, title, icon: Icon, aside, toolbar, scrollKey, footer, children }: Props) {
  const body = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = body.current
    if (el && scrollKey !== undefined) el.scrollTop = el.scrollHeight
  }, [scrollKey])
  return (
    <section aria-labelledby={id} className="flex h-[82dvh] min-h-[36rem] min-w-0 flex-col rounded-2xl border border-line bg-canvas-subtle shadow-card">
      <header className="space-y-3 border-b border-line p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 id={id} className="flex items-center gap-2 text-base font-semibold">
            <Icon aria-hidden className="size-4 text-fg-muted" /> {title}
          </h2>
          {aside}
        </div>
        {toolbar}
      </header>
      <div ref={body} className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
      {footer}
    </section>
  )
}
