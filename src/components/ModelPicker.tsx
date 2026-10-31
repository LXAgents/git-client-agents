import { useCallback, useMemo, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { formatContext, matchesQuery, MODALITIES, perMillion } from '../modalities'
import { useLoad } from '../hooks/useLoad'
import { userApi } from '../services/api'
import type { Modality, ModelInfo } from '../types'
import { Button } from './Button'
import { SearchField } from './Field'
import { Modal } from './Modal'
import { Badge } from './PageHeader'

const LIMIT = 100

interface Props {
  title: string
  /** The stored text model, or undefined when the owner falls back. */
  current?: string
  /** What is used when nothing is stored, e.g. "the organization's model". */
  fallback: string
  onSave: (modality: Modality, model: string | null) => Promise<void>
  onClose: () => void
}

function ModelRow({ model, selected, onSelect }: { model: ModelInfo; selected: boolean; onSelect: () => void }) {
  const context = formatContext(model.contextLength)
  const input = perMillion(model.pricing.prompt)
  const output = perMillion(model.pricing.completion)
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors ${selected ? 'bg-accent/10' : 'hover:bg-overlay'}`}
      >
        <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${selected ? 'border-accent bg-accent text-white' : 'border-line'}`}>
          {selected && <Check aria-hidden className="size-3" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold">{model.name}</span>
            {model.free && <Badge tone="success">Free</Badge>}
          </span>
          <code className="block truncate font-mono text-xs text-fg-muted">{model.id}</code>
        </span>
        <span className="shrink-0 text-right text-xs text-fg-muted tabular-nums">
          {context && <span className="block">{context} context</span>}
          {!model.free && input && output && (
            <span className="block">
              {input} / {output} per 1M
            </span>
          )}
        </span>
      </button>
    </li>
  )
}

// Picks an OpenRouter model for one owner. The list is loaded live when the picker opens and
// filtered as you type. Only the Text tab works today; the others are shown faded.
export function ModelPicker({ title, current, fallback, onSave, onClose }: Props) {
  const [modality, setModality] = useState<Modality>('text')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | undefined>(current)
  const [busy, setBusy] = useState(false)
  const { data, loading } = useLoad(useCallback(() => userApi.models(modality), [modality]))

  const matches = useMemo(() => (data ?? []).filter((m) => matchesQuery(m, query)), [data, query])
  const shown = matches.slice(0, LIMIT)

  const save = async (model: string | null) => {
    setBusy(true)
    try {
      await onSave(modality, model)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={title}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" className="mr-auto" disabled={!current || busy} onClick={() => save(null)}>
            Use fallback
          </Button>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" busy={busy} disabled={!selected || selected === current} onClick={() => selected && save(selected)}>
            Save
          </Button>
        </>
      }
    >
      <div role="tablist" aria-label="Modality" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
        {MODALITIES.map(({ value, label, icon: Icon, available }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={modality === value}
            aria-disabled={!available}
            disabled={!available}
            title={available ? undefined : 'Coming soon'}
            onClick={() => setModality(value)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
              modality === value ? 'bg-accent/12 text-accent' : 'text-fg-muted hover:bg-overlay hover:text-fg'
            } disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-fg-muted`}
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </button>
        ))}
      </div>

      <p className="text-sm text-fg-muted">
        {current ? (
          <>
            Now using <code className="font-mono text-fg">{current}</code>.
          </>
        ) : (
          <>Nothing set, so {fallback} is used.</>
        )}
      </p>

      <SearchField label="Search models" placeholder="Search by name or id, e.g. claude or :free" value={query} onChange={setQuery} />

      {loading && !data ? (
        <p className="py-8 text-center text-sm text-fg-muted">
          <Loader2 aria-hidden className="mr-2 inline size-4 animate-spin" />
          Loading models from OpenRouter…
        </p>
      ) : (
        <>
          <ul aria-label="Models" className="max-h-80 divide-y divide-line-muted overflow-y-auto rounded-xl border border-line">
            {shown.map((m) => (
              <ModelRow key={m.id} model={m} selected={selected === m.id} onSelect={() => setSelected(m.id)} />
            ))}
            {data && matches.length === 0 && <li className="px-3 py-6 text-center text-sm text-fg-muted">No model matches “{query}”.</li>}
          </ul>
          {data && (
            <p className="text-xs text-fg-muted" aria-live="polite">
              {matches.length > LIMIT ? `Showing ${LIMIT} of ${matches.length} matches. Keep typing to narrow it down.` : `${matches.length} of ${data.length} models`}
            </p>
          )}
        </>
      )}
    </Modal>
  )
}
