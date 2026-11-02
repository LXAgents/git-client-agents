import { describe, expect, it } from 'vitest'
import type { ChatEvent, ChatSummary } from '../types'
import { formatCost, mergeById, nextActivity } from './chatEvents'

const stats = (costUsd: number, costComplete: boolean): ChatSummary['stats'] => ({ answers: 1, inputTokens: 0, outputTokens: 0, costUsd, costComplete, tokensComplete: true, answersWithoutUsage: 0, capped: false })
const ev = (fields: Partial<ChatEvent>): ChatEvent => ({ type: 'token', room: 'r', sessionId: 's', sender: { id: null, login: null, type: 'agent' }, content: '', timestamp: '2026-11-01T10:00:00.000Z', ...fields })

describe('chat events', () => {
  it('says how sure the cost is', () => {
    expect(formatCost(stats(0, false))).toBe('Unknown')
    expect(formatCost(stats(0.0123, false))).toBe('at least $0.0123')
    expect(formatCost(stats(2.5, true))).toBe('$2.50')
  })

  it('adds tokens to the text and clears it on a new model call', () => {
    const a = nextActivity(ev({ content: 'Hi' }), null)
    expect(a.text).toBe('Hi')
    expect(nextActivity(ev({ type: 'progress', content: 'Thinking...', data: { status: 'Thinking...', reset: true } }), a)).toEqual({ status: 'Thinking...', tool: undefined, where: undefined, text: '' })
  })

  it('keeps each stored event once, in time order', () => {
    const one = ev({ id: '1', type: 'message', timestamp: '2026-11-01T10:01:00.000Z' })
    const two = ev({ id: '2', type: 'message' })
    expect(mergeById([one], [two, one]).map((e) => e.id)).toEqual(['2', '1'])
  })
})
