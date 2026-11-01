import { Check } from 'lucide-react'
import { formatContext, perMillion } from '../../modalities'
import type { ModelInfo } from '../../types'
import { Badge } from '../PageHeader'

// One model in the picker's list: name, id, context length and price per million tokens.
export function ModelRow({ model, selected, onSelect }: { model: ModelInfo; selected: boolean; onSelect: () => void }) {
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
