import { useEffect, useState } from 'react'
import { errorMessage, userApi } from '../services/api'
import type { Modality, ModelInfo, ModelScope, ProviderId } from '../types'

export type ModelList = { provider: ProviderId; models: ModelInfo[] | null; error: string | null }

// One provider's live list. A failure (most often: no key for that provider yet) is shown in
// the picker instead of a toast, because it tells the user what to do next.
export function useProviderModels(modality: Modality, provider: ProviderId, scope: ModelScope) {
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
