import { describe, expect, it } from 'vitest'
import { trimTrailingSlashes } from './strings'

describe('trimTrailingSlashes', () => {
  it('trims only trailing slashes', () => {
    expect(trimTrailingSlashes('https://api.example.com//')).toBe('https://api.example.com')
    expect(trimTrailingSlashes('/')).toBe('')
    expect(trimTrailingSlashes('a/b')).toBe('a/b')
  })
})
