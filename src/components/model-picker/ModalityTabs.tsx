import { MODALITIES } from '../../modalities'
import type { Modality } from '../../types'

// The modality tabs. Only the Text tab works today; the others are shown faded.
export function ModalityTabs({ modality, setModality }: { modality: Modality; setModality: (m: Modality) => void }) {
  return (
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
  )
}
