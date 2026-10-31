import { describe, expect, it } from 'vitest'
import { authHeaders, loadSession, readOAuthReturn, saveSession, takeOAuthReturn } from './session'

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

  it('reads the token or the error the server puts in the fragment after OAuth', () => {
    expect(readOAuthReturn('#platform=gitlab&token=gloas-1')).toEqual({ session: { mode: 'user', platform: 'gitlab', token: 'gloas-1' } })
    expect(readOAuthReturn('#error=Access%20denied')).toEqual({ error: 'Access denied' })
    expect(readOAuthReturn('#platform=bitbucket&token=x')).toBeNull()
    expect(readOAuthReturn('#section')).toBeNull()
    expect(readOAuthReturn('')).toBeNull()
  })

  it('removes the token from the address bar once read', () => {
    window.history.replaceState(null, '', '/keys?x=1#platform=github&token=gho_1')
    expect(takeOAuthReturn()).toEqual({ session: { mode: 'user', platform: 'github', token: 'gho_1' } })
    expect(window.location.href).not.toContain('gho_1')
    expect(window.location.pathname + window.location.search).toBe('/keys?x=1')
  })
})
