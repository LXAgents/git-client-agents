import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { adminApi } from '../services/api'
import { renderAs } from '../test/render'
import type { LogLine } from '../types'
import { Logs } from './Logs'

const line = (id: string, level: LogLine['level'], message: string): LogLine => ({
  id,
  level,
  source: 'webhook',
  message,
  platform: 'github',
  taskId: null,
  createdAt: '2026-10-31T22:30:00Z',
})

describe('Logs', () => {
  it('lists the server log lines with their level', async () => {
    vi.spyOn(adminApi, 'logs').mockResolvedValue({
      logs: [line('2', 'warn', '401 GITHUB_WEBHOOK_SECRET is not set on the server'), line('1', 'info', 'queued task t1')],
      next: null,
    })
    renderAs({ platform: 'github', token: 'gho' }, <Logs />)
    const table = await screen.findByRole('table', { name: 'Logs' })
    const [, first, second] = within(table).getAllByRole('row')
    expect(first).toHaveTextContent('GITHUB_WEBHOOK_SECRET is not set')
    expect(within(first).getByText('Warning')).toBeInTheDocument()
    expect(within(second).getByText('Info')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull()
  })

  it('filters by level and source, and loads the next page after the last line', async () => {
    const logs = vi
      .spyOn(adminApi, 'logs')
      .mockResolvedValueOnce({ logs: [line('3', 'info', 'first page')], next: '3' })
      .mockResolvedValueOnce({ logs: [line('2', 'info', 'second page')], next: null })
      .mockResolvedValue({ logs: [line('9', 'error', 'an error')], next: null })
    renderAs({ platform: 'github', token: 'gho' }, <Logs />)
    await screen.findByText('first page')
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }))
    expect(await screen.findByText('second page')).toBeInTheDocument()
    expect(screen.getByText('first page')).toBeInTheDocument()
    expect(logs).toHaveBeenLastCalledWith({ level: 'info', source: undefined, before: '3' })

    await userEvent.selectOptions(screen.getByLabelText('Level'), 'error')
    await userEvent.selectOptions(screen.getByLabelText('Source'), 'agent')
    expect(await screen.findByText('an error')).toBeInTheDocument()
    expect(logs).toHaveBeenLastCalledWith({ level: 'error', source: 'agent' })
    expect(screen.queryByText('first page')).toBeNull()
  })
})
