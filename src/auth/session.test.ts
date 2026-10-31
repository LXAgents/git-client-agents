import { describe, expect, it } from 'vitest'
import { authHeaders, beginOAuth, FOREIGN_SIGNIN, loadSession, readOAuthReturn, saveSession, takeOAuthReturn } from './session'

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

  it('drops anything in storage that is not a well-formed session', () => {
    for (const bad of ['{"mode":"admin"}', '{"mode":"user","platform":"bitbucket","token":"t"}', '{"mode":"admin","token":"a b"}', '[1]', 'null', '{not json']) {
      sessionStorage.setItem('git-client-agents.session', bad)
      expect(loadSession()).toBeNull()
    }
    expect(sessionStorage.getItem('git-client-agents.session')).toBeNull()
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

  it('never writes a malformed session', () => {
    saveSession({ mode: 'user', platform: 'github', token: 'has space' } as never)
    expect(sessionStorage.getItem('git-client-agents.session')).toBeNull()
    saveSession({ mode: 'admin', token: 't', extra: 'x' } as never)
    expect(sessionStorage.getItem('git-client-agents.session')).toBeNull()
    saveSession({ mode: 'admin', token: 't' })
    expect(JSON.parse(sessionStorage.getItem('git-client-agents.session')!)).toEqual({ mode: 'admin', token: 't' })
  })
})
