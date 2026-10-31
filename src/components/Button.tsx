import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'default' | 'danger' | 'ghost'

const styles: Record<Variant, string> = {
  primary:
    'border-transparent bg-linear-to-b from-accent to-accent-strong text-white shadow-[0_1px_0_inset_oklch(1_0_0/0.25),0_6px_16px_-6px_var(--color-accent)] hover:brightness-110',
  default: 'border-line bg-canvas-subtle text-fg shadow-xs hover:bg-overlay',
  danger: 'border-line bg-canvas-subtle text-danger shadow-xs hover:border-danger hover:bg-danger hover:text-white',
  ghost: 'border-transparent bg-transparent text-fg-muted hover:bg-overlay hover:text-fg',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  busy?: boolean
  size?: 'sm' | 'md'
}

export function Button({ variant = 'default', busy = false, size = 'md', className = '', children, disabled, ...rest }: Props) {
  const sizing = size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm'
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition-[background-color,border-color,color,filter,scale] duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${sizing} ${styles[variant]} ${className}`}
    >
      {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  )
}
