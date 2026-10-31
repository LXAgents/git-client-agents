import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'

interface Props {
  title: string
  message: string
  label: string
  onConfirm: () => Promise<void>
}

// A trash button that asks before it deletes. `label` names the thing for screen readers.
export function ConfirmDelete({ title, message, label, onConfirm }: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button variant="danger" size="sm" aria-label={label} onClick={() => setOpen(true)}>
        <Trash2 aria-hidden className="size-3.5" />
      </Button>
      {open && (
        <Modal
          title={title}
          onClose={() => !busy && setOpen(false)}
          footer={
            <>
              <Button onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button variant="danger" busy={busy} onClick={confirm}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-fg-muted">{message}</p>
        </Modal>
      )}
    </>
  )
}
