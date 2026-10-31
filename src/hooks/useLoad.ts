import { useCallback, useEffect, useState } from 'react'
import { useToast } from '../components/Toast'
import { errorMessage } from '../services/api'

// Loads data on mount (and whenever `load` changes) and on reload(); failures become an
// error toast. `load` must be stable, e.g. wrapped in useCallback.
export function useLoad<T>(load: () => Promise<T>) {
  const toast = useToast()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  const run = useCallback(
    (isCurrent: () => boolean) =>
      load()
        .then((result) => isCurrent() && setData(result))
        .catch((err) => isCurrent() && toast.error(errorMessage(err)))
        .finally(() => isCurrent() && setLoading(false)),
    [load, toast],
  )

  useEffect(() => {
    let current = true
    void run(() => current)
    return () => {
      current = false
    }
  }, [run])

  const reload = useCallback(async () => {
    setLoading(true)
    await run(() => true)
  }, [run])

  return { data, loading, reload }
}
