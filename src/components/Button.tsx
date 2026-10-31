import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'default' | 'danger' | 'ghost'

const styles: Record<Variant, string> = {
  primary: 'bg-success text-white border-white/10 hover:bg-success-hover',
  default: 'bg-overlay text-fg border-line hover:bg-line-muted hover:border-fg-muted/40',
  danger: 'bg-overlay text-danger border-line hover:bg-danger hover:text-white hover:border-danger',
  ghost: 'bg-transparent text-fg-muted border-transparent hover:bg-overlay hover:text-fg',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  busy?: boolean
  size?: 'sm' | 'md'
}

export function Button({ variant = 'default', busy = false, size = 'md', className = '', children, disabled, ...rest }: Props) {
  const sizing = size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm'
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${sizing} ${styles[variant]} ${className}`}
    >
      {busy && <Loader2 aria-hidden className="size-3.5 animate-spin" />}
      {children}
    </button>
  )
}
