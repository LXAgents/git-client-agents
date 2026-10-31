import { describe, expect, it } from 'vitest'
import { authHeaders, loadSession, saveSession } from './session'

describe('session', () => {
  it('sends only a bearer token for the operator', () => {
    expect(authHeaders({ mode: 'admin', token: 't' })).toEqual({ Authorization: 'Bearer t' })
  })

  it('adds the platform for a user', () => {
    expect(authHeaders({ mode: 'user', platform: 'gitlab', token: 'glpat' })).toEqual({
      Authorization: 'Bearer glpat',
      'X-Platform': 'gitlab',
    })
  })

  it('keeps the session in sessionStorage and clears it on sign-out', () => {
    saveSession({ mode: 'user', platform: 'github', token: 'ghp' })
    expect(loadSession()).toEqual({ mode: 'user', platform: 'github', token: 'ghp' })
    saveSession(null)
    expect(loadSession()).toBeNull()
  })
})
