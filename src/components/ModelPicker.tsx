import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from 'react'
import { Check, KeyRound, Loader2, PenLine } from 'lucide-react'
import { DEFAULT_PROVIDER, describeChoice, formatContext, matchesQuery, MODALITIES, perMillion } from '../modalities'
import { useLoad } from '../hooks/useLoad'
import { errorMessage, userApi } from '../services/api'
import type { Modality, ModelChoice, ModelInfo, ModelScope, ProviderId } from '../types'
import { Button } from './Button'
import { SearchField, SelectField } from './Field'
import { Modal } from './Modal'
import { Badge } from './PageHeader'

// Rows rendered at a time. Scrolling near the bottom of the list adds the next batch.
const PAGE = 100
// How close to the bottom, in pixels, counts as "near".
const NEAR_BOTTOM = 160

interface Props {
  title: string
  /** The stored text provider and model, or undefined when the owner falls back. */
  current?: ModelChoice
  /** What is used when nothing is stored, e.g. "the organization's model". */
  fallback: string
  /** Whose key lists the models of providers that need one: the org's or repository's, else the user's own. */
  scope?: ModelScope
  onSave: (modality: Modality, choice: ModelChoice | null) => Promise<void>
  onClose: () => void
}

type ModelList = { provider: ProviderId; models: ModelInfo[] | null; error: string | null }

// One provider's live list. A failure (most often: no key for that provider yet) is shown in
// the picker instead of a toast, because it tells the user what to do next.
function useProviderModels(modality: Modality, provider: ProviderId, scope: ModelScope) {
  const [state, setState] = useState<ModelList | null>(null)
  const { orgId, repoId } = scope
  useEffect(() => {
    let current = true
    userApi
      .models(modality, provider, { ...(orgId ? { orgId } : {}), ...(repoId ? { repoId } : {}) })
      .then((models) => current && setState({ provider, models, error: null }))
      .catch((err) => current && setState({ provider, models: null, error: errorMessage(err) }))
    return () => {
      current = false
    }
  }, [modality, provider, orgId, repoId])
  // A list for another provider is stale while the new one loads.
  return state?.provider === provider ? state : null
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

// Picks a provider and one of its models for one owner. The provider's list is loaded live
// when the picker opens or the provider changes, and filtered as you type; a model id that is
// not listed can be typed in. Only the Text tab works today; the others are shown faded.
export function ModelPicker({ title, current, fallback, scope = {}, onSave, onClose }: Props) {
  const [modality, setModality] = useState<Modality>('text')
  const [provider, setProvider] = useState<ProviderId>(current?.provider ?? DEFAULT_PROVIDER)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ModelChoice | undefined>(current)
  const [busy, setBusy] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  const listRef = useRef<HTMLUListElement>(null)
  const { data: providers } = useLoad(useCallback(() => userApi.providers(), []))
  const list = useProviderModels(modality, provider, scope)
  const data = list?.models ?? null
  const providerName = providers?.find((p) => p.id === provider)?.name ?? provider

  const matches = useMemo(() => (data ?? []).filter((m) => matchesQuery(m, query)), [data, query])
  const shown = matches.slice(0, limit)
  const typed = query.trim()
  const canUseTyped = typed.length > 0 && !/\s/.test(typed) && !(data ?? []).some((m) => m.id === typed)
  const isSelected = (id: string) => selected?.provider === provider && selected.model === id
  const unchanged = Boolean(selected && current && selected.provider === current.provider && selected.model === current.model)

  const changeProvider = (value: ProviderId) => {
    setProvider(value)
    setLimit(PAGE)
    listRef.current?.scrollTo?.({ top: 0 })
  }

  // A new search starts again from the first batch, at the top of the list.
  const search = (value: string) => {
    setQuery(value)
    setLimit(PAGE)
    listRef.current?.scrollTo?.({ top: 0 })
  }

  const loadMoreNearBottom = (e: UIEvent<HTMLUListElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget
    if (limit < matches.length && scrollTop + clientHeight >= scrollHeight - NEAR_BOTTOM) {
      setLimit((n) => n + PAGE)
    }
  }

  const save = async (choice: ModelChoice | null) => {
    setBusy(true)
    try {
      await onSave(modality, choice)
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
          <Button variant="primary" busy={busy} disabled={!selected || unchanged} onClick={() => selected && save(selected)}>
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
            Now using <code className="font-mono text-fg">{describeChoice(current, providers)}</code>.
          </>
        ) : (
          <>Nothing set, so {fallback} is used.</>
        )}
      </p>

      <SelectField label="Provider" value={provider} onChange={(e) => changeProvider(e.target.value)} hint="Answers are paid with a key for this provider: yours, or the organization’s or repository’s.">
        {(providers ?? [{ id: provider, name: providerName }]).map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </SelectField>

      <SearchField label="Search models" placeholder="Search by name or id, or type a model id" value={query} onChange={search} />

      {list?.error ? (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-line bg-overlay px-3.5 py-3 text-sm">
          <KeyRound aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-muted" />
          <div>
            <p>{list.error}</p>
            <p className="mt-1 text-fg-muted">Add a {providerName} key on the API keys page to see its models, or type a model id above.</p>
          </div>
        </div>
      ) : null}

      {!list ? (
        <p className="py-8 text-center text-sm text-fg-muted">
          <Loader2 aria-hidden className="mr-2 inline size-4 animate-spin" />
          Loading models from {providerName}…
        </p>
      ) : (
        <>
          <ul ref={listRef} onScroll={loadMoreNearBottom} aria-label="Models" className="max-h-80 divide-y divide-line-muted overflow-y-auto rounded-xl border border-line">
            {canUseTyped && (
              <li>
                <button
                  type="button"
                  aria-pressed={isSelected(typed)}
                  onClick={() => setSelected({ provider, model: typed })}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${isSelected(typed) ? 'bg-accent/10' : 'hover:bg-overlay'}`}
                >
                  <PenLine aria-hidden className="size-4 shrink-0 text-fg-muted" />
                  <span>
                    Use <code className="font-mono">{typed}</code> as the {providerName} model id
                  </span>
                </button>
              </li>
            )}
            {shown.map((m) => (
              <ModelRow key={m.id} model={m} selected={isSelected(m.id)} onSelect={() => setSelected({ provider, model: m.id })} />
            ))}
            {data && matches.length === 0 && <li className="px-3 py-6 text-center text-sm text-fg-muted">No model matches “{query}”.</li>}
          </ul>
          {data && (
            <p className="text-xs text-fg-muted" aria-live="polite">
              {matches.length > shown.length ? `Showing ${shown.length} of ${matches.length} models. Scroll for more.` : `${matches.length} of ${data.length} models`}
            </p>
          )}
        </>
      )}
    </Modal>
  )
}
