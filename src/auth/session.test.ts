import { describe, expect, it } from 'vitest'
import { authHeaders, beginOAuth, FOREIGN_SIGNIN, loadSession, readOAuthReturn, saveSession, takeOAuthReturn } from './session'

describe('session', () => {
  it('adds the platform for a user', () => {
    expect(authHeaders({ platform: 'gitlab', token: 'glpat' })).toEqual({
      Authorization: 'Bearer glpat',
      'X-Platform': 'gitlab',
    })
  })

  it('keeps the session in memory only and clears it on sign-out', () => {
    saveSession({ platform: 'github', token: 'ghp' })
    expect(loadSession()).toEqual({ platform: 'github', token: 'ghp' })
    expect(sessionStorage.length).toBe(0)
    expect(localStorage.length).toBe(0)
    saveSession(null)
    expect(loadSession()).toBeNull()
  })

  it('ignores a session left in storage by an older version', () => {
    sessionStorage.setItem('git-client-agents.session', '{"mode":"admin","token":"planted"}')
    expect(loadSession()).toBeNull()
  })

  it('reads the token or the error the server puts in the fragment after OAuth', () => {
    expect(readOAuthReturn('#code=sealed-1')).toEqual({ code: 'sealed-1' })
    expect(readOAuthReturn('#error=Access%20denied')).toEqual({ error: 'Access denied' })
    // The token is never taken from the URL, even if a link puts it there.
    expect(readOAuthReturn('#platform=github&token=x')).toBeNull()
    expect(readOAuthReturn('#section')).toBeNull()
    expect(readOAuthReturn('')).toBeNull()
  })

  it('removes the token and nonce from the address bar once read, and the nonce works once', () => {
    const nonce = beginOAuth()
    window.history.replaceState(null, '', `/keys?x=1&signin=${nonce}#code=sealed-1`)
    expect(takeOAuthReturn()).toEqual({ code: 'sealed-1' })
    expect(window.location.href).not.toContain('sealed-1')
    expect(window.location.pathname + window.location.search).toBe('/keys?x=1')
    window.history.replaceState(null, '', `/?signin=${nonce}#code=sealed-1`)
    expect(takeOAuthReturn()).toEqual({ error: FOREIGN_SIGNIN })
  })

  it('refuses a return without the nonce this tab stored', () => {
    beginOAuth()
    window.history.replaceState(null, '', '/?signin=other#code=sealed-2')
    expect(takeOAuthReturn()).toEqual({ error: FOREIGN_SIGNIN })
    window.history.replaceState(null, '', '/#code=sealed-3')
    expect(takeOAuthReturn()).toEqual({ error: FOREIGN_SIGNIN })
    expect(window.location.href).not.toContain('sealed-')
  })

  it('never keeps a malformed session', () => {
    saveSession({ platform: 'github', token: 'has space' } as never)
    expect(loadSession()).toBeNull()
    saveSession({ platform: 'github', token: 't', extra: 'x' } as never)
    expect(loadSession()).toBeNull()
    // The old operator shape is not a session any more.
    saveSession({ mode: 'admin', token: 't' } as never)
    expect(loadSession()).toBeNull()
    saveSession({ platform: 'github', token: 't' })
    expect(loadSession()).toEqual({ platform: 'github', token: 't' })
  })
})
