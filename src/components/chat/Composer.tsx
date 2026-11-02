import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { errorMessage } from '../../services/api'
import { Button } from '../Button'
import { useToast } from '../Toast'

interface Props {
  /** Names the box and its button for screen readers, e.g. "Ask the agent". */
  label: string
  placeholder: string
  hint?: string
  disabled?: boolean
  onSend: (content: string) => Promise<void>
}

// A message box: Enter sends, Shift+Enter adds a line. The draft is kept when sending fails.
export function Composer({ label, placeholder, hint, disabled = false, onSend }: Props) {
  const toast = useToast()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    const content = draft.trim()
    if (!content || sending || disabled) return
    setSending(true)
    try {
      await onSend(content)
      setDraft('')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void submit()
    }
  }

  return (
    <form onSubmit={submit} className="border-t border-line p-3">
      <div className="flex items-end gap-2">
        <textarea
          aria-label={label}
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          disabled={disabled}
          placeholder={placeholder}
          className="block max-h-40 min-h-10 flex-1 resize-y rounded-xl border border-line bg-canvas px-3 py-2 text-[15px] text-fg placeholder:text-fg-muted/70 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:opacity-60"
        />
        <Button type="submit" variant="primary" aria-label={`Send: ${label}`} busy={sending} disabled={disabled || !draft.trim()}>
          <Send aria-hidden className="size-4" />
        </Button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-fg-muted">{hint}</p>}
    </form>
  )
}
