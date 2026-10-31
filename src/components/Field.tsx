import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'

const control =
  'block h-10 w-full rounded-xl border border-line bg-canvas-subtle px-3.5 text-sm text-fg shadow-xs transition-[border-color,box-shadow] placeholder:text-fg-muted/70 hover:border-fg-muted/40 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:opacity-60'

interface FieldProps {
  label: string
  hint?: ReactNode
}

function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
      {children}
    </label>
  )
}

export function TextField({ label, hint, ...input }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input id={id} {...input} className={control} />
      {hint && <p className="mt-1.5 text-xs text-fg-muted">{hint}</p>}
    </div>
  )
}

export function SelectField({ label, hint, children, ...select }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select id={id} {...select} className={`${control} appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-9`} style={{ backgroundImage: CHEVRON }}>
        {children}
      </select>
      {hint && <p className="mt-1.5 text-xs text-fg-muted">{hint}</p>}
    </div>
  )
}

const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`

// A two-option toggle with a raised "thumb" on the selected option.
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium">{label}</legend>
      <div className="grid auto-cols-fr grid-flow-col rounded-xl bg-overlay p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
              value === o.value ? 'bg-canvas-subtle text-fg shadow-card' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
