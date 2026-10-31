import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiBaseUrl } from './config'

describe('apiBaseUrl', () => {
  afterEach(() => {
    delete window.__APP_CONFIG__
    vi.unstubAllEnvs()
  })

  it('prefers the runtime API_URL over the build-time one', () => {
    vi.stubEnv('VITE_API_URL', 'https://build.example')
    window.__APP_CONFIG__ = { apiUrl: 'https://runtime.example' }
    expect(apiBaseUrl()).toBe('https://runtime.example')
  })

  it('falls back to VITE_API_URL, then localhost', () => {
    window.__APP_CONFIG__ = { apiUrl: ' ' }
    vi.stubEnv('VITE_API_URL', 'https://build.example')
    expect(apiBaseUrl()).toBe('https://build.example')
    vi.stubEnv('VITE_API_URL', '')
    expect(apiBaseUrl()).toBe('http://localhost:3000')
  })
})
