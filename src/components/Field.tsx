import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'

const control =
  'block w-full rounded-md border border-line bg-canvas px-3 py-1.5 text-sm text-fg placeholder:text-fg-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60'

interface FieldProps {
  label: string
  hint?: ReactNode
}

export function TextField({ label, hint, ...input }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <input id={id} {...input} className={control} />
      {hint && <p className="mt-1 text-xs text-fg-muted">{hint}</p>}
    </div>
  )
}

export function SelectField({ label, hint, children, ...select }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <select id={id} {...select} className={control}>
        {children}
      </select>
      {hint && <p className="mt-1 text-xs text-fg-muted">{hint}</p>}
    </div>
  )
}

// A two-option toggle, like GitHub's segmented controls.
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
      <legend className="mb-1.5 block text-sm font-semibold">{label}</legend>
      <div className="inline-flex rounded-md border border-line bg-canvas p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`rounded px-3 py-1 text-sm ${value === o.value ? 'bg-overlay font-semibold text-fg shadow' : 'text-fg-muted hover:text-fg'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
