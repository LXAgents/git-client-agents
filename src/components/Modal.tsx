import { useEffect, useId, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ title, onClose, children, footer }: Props) {
  const titleId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto px-4 py-16">
      {/* The backdrop is a real button behind the dialog: a click outside closes it. Keyboard users
          close it with Escape or the Close button, so it is left out of the tab order. */}
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-black/40 backdrop-blur-sm transition-opacity duration-200 starting:opacity-0"
      />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="enter relative w-full max-w-md rounded-2xl border border-line bg-canvas-subtle shadow-raised">
        <div className="flex items-center justify-between px-6 pt-5 pb-1">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-overlay hover:text-fg">
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 rounded-b-2xl border-t border-line-muted bg-canvas-inset/60 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}
