import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { CircleAlert, CircleCheck, X } from 'lucide-react'

type Tone = 'success' | 'error'
interface Toast {
  id: number
  tone: Tone
  message: string
}
interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), [])
  const push = useCallback(
    (tone: Tone, message: string) => {
      const id = nextId.current++
      setToasts((all) => [...all, { id, tone, message }])
      window.setTimeout(() => dismiss(id), tone === 'error' ? 8000 : 4000)
    },
    [dismiss],
  )
  const api = useMemo(() => ({ success: (m: string) => push('success', m), error: (m: string) => push('error', m) }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:left-auto">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className="glass enter pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line px-4 py-3 text-sm shadow-raised"
          >
            {t.tone === 'error' ? (
              <CircleAlert aria-hidden className="mt-0.5 size-4.5 shrink-0 text-danger" />
            ) : (
              <CircleCheck aria-hidden className="mt-0.5 size-4.5 shrink-0 text-success" />
            )}
            <p className="flex-1 break-words">{t.message}</p>
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="rounded-md text-fg-muted transition-colors hover:text-fg">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react/only-export-components -- hook lives beside its provider
export function useToast(): ToastApi {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside ToastProvider')
  return value
}
