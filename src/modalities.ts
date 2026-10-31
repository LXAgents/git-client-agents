import { ArrowUpDown, AudioWaveform, Boxes, Gavel, Image as ImageIcon, Mic, Speech, Type, Video, type LucideIcon } from 'lucide-react'
import type { Modality } from './types'

export interface ModalityInfo {
  value: Modality
  label: string
  icon: LucideIcon
  /** Only text models can be picked today; the rest are shown faded. */
  available: boolean
}

// The order OpenRouter's model browser uses.
export const MODALITIES: ModalityInfo[] = [
  { value: 'text', label: 'Text', icon: Type, available: true },
  { value: 'image', label: 'Image', icon: ImageIcon, available: false },
  { value: 'video', label: 'Video', icon: Video, available: false },
  { value: 'speech', label: 'Speech', icon: Speech, available: false },
  { value: 'decisions', label: 'Decisions', icon: Gavel, available: false },
  { value: 'embeddings', label: 'Embeddings', icon: Boxes, available: false },
  { value: 'rerank', label: 'Rerank', icon: ArrowUpDown, available: false },
  { value: 'transcription', label: 'Transcription', icon: Mic, available: false },
  { value: 'audio', label: 'Audio', icon: AudioWaveform, available: false },
]

export const DEFAULT_MODEL = 'openrouter/free'

// "0.00000125" USD per token -> "$1.25" per million tokens.
export function perMillion(price: string | null): string | null {
  if (price === null) return null
  const value = Number(price) * 1_000_000
  if (!Number.isFinite(value) || value < 0) return null
  return `$${value >= 100 ? value.toFixed(0) : String(Number(value.toFixed(2)))}`
}

export function formatContext(tokens: number | null): string | null {
  if (!tokens) return null
  return tokens >= 1_000_000 ? `${+(tokens / 1_000_000).toFixed(1)}M` : `${Math.round(tokens / 1000)}K`
}

// Every word of the query must appear in the model's name or id, in any order.
export function matchesQuery(model: { id: string; name: string }, query: string): boolean {
  const haystack = `${model.name} ${model.id}`.toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word))
}
