import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../Toast'
import { Composer } from './Composer'

describe('Composer', () => {
  it('is four lines tall, grows with the text and sends on Enter', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined)
    render(
      <ToastProvider>
        <Composer label="Ask the agent" placeholder="Ask…" hint="Goes to the agent." onSend={onSend} />
      </ToastProvider>,
    )
    const box = screen.getByLabelText('Ask the agent')
    expect(box).toHaveAttribute('rows', '4')
    expect(box.className).toContain('w-full')
    Object.defineProperty(box, 'scrollHeight', { configurable: true, get: () => 200 })
    await userEvent.type(box, 'line one{Shift>}{Enter}{/Shift}line two')
    expect(box.style.height).toBe('200px')
    Object.defineProperty(box, 'scrollHeight', { configurable: true, get: () => 900 })
    await userEvent.type(box, '!')
    expect(box.style.height).toBe('320px')
    await userEvent.type(box, '{Enter}')
    expect(onSend).toHaveBeenCalledWith('line one\nline two!')
    expect(box).toHaveValue('')
    expect(box.style.height).toBe('')
  })
})
