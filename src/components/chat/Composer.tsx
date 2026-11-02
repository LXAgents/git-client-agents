import { useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
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

// The box grows with its text up to this height, then scrolls.
const MAX_HEIGHT_PX = 320

// Fits the box's height to its text, between its CSS minimum and MAX_HEIGHT_PX.
function fit(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`
}

// A message box across the pane, four lines tall and growing with the text, with the hint and the
// send button under it. Enter sends, Shift+Enter adds a line. The draft is kept when sending fails.
export function Composer({ label, placeholder, hint, disabled = false, onSend }: Props) {
  const toast = useToast()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const box = useRef<HTMLTextAreaElement>(null)

  const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value)
    fit(e.target)
  }

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    const content = draft.trim()
    if (!content || sending || disabled) return
    setSending(true)
    try {
      await onSend(content)
      setDraft('')
      if (box.current) box.current.style.height = ''
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
      <textarea
        ref={box}
        aria-label={label}
        rows={4}
        value={draft}
        onChange={onChange}
        onKeyDown={onKey}
        disabled={disabled}
        placeholder={placeholder}
        style={{ maxHeight: MAX_HEIGHT_PX }}
        className="block min-h-28 w-full resize-y rounded-xl border border-line bg-canvas px-3.5 py-3 text-[15px] leading-relaxed text-fg placeholder:text-fg-muted/70 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20 disabled:opacity-60"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="min-w-0 text-xs text-fg-muted">{hint}</p>
        <Button type="submit" variant="primary" aria-label={`Send: ${label}`} busy={sending} disabled={disabled || !draft.trim()}>
          <Send aria-hidden className="size-4" /> Send
        </Button>
      </div>
    </form>
  )
}
