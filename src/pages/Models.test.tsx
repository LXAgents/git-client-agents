import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { formatContext, matchesQuery, perMillion } from '../modalities'
import { userApi } from '../services/api'
import { renderAs } from '../test/render'
import type { ModelInfo, Org, Repo } from '../types'
import { Models } from './Models'

const model = (id: string, name: string, free = false): ModelInfo => ({
  id,
  name,
  description: '',
  contextLength: 400_000,
  pricing: free ? { prompt: '0', completion: '0' } : { prompt: '0.00000125', completion: '0.00001' },
  free,
  inputModalities: ['text'],
  outputModalities: ['text'],
})

const acme: Org = {
  id: 'org1',
  platform: 'github',
  orgName: 'acme',
  installationId: '555',
  owner: { platform: 'github', id: '1001', login: 'alice', name: null, avatarUrl: null },
  models: { text: 'openai/gpt-5' },
  createdAt: '2026-10-31T00:00:00Z',
}
const web: Repo = {
  id: 'repo1',
  platform: 'github',
  externalId: '301',
  fullName: 'acme/web',
  org: { id: 'org1', name: 'acme' },
  models: {},
  createdAt: '2026-10-31T00:00:00Z',
}

describe('Models', () => {
  beforeEach(() => {
    vi.spyOn(userApi, 'me').mockResolvedValue({ platform: 'github', id: '1001', login: 'alice', name: null, avatarUrl: null, role: 'free' as const })
    vi.spyOn(userApi, 'ownModels').mockResolvedValue({})
    vi.spyOn(userApi, 'orgs').mockResolvedValue([acme])
    vi.spyOn(userApi, 'repos').mockResolvedValue([web])
    vi.spyOn(userApi, 'models').mockResolvedValue([
      model('openai/gpt-5', 'GPT-5'),
      model('anthropic/claude-sonnet', 'Claude Sonnet'),
      model('openrouter/free', 'Free Models Router', true),
    ])
  })

  it('shows each owner and what falls back to what', async () => {
    renderAs({ platform: 'github', token: 'ghp' }, <Models />)
    const you = await screen.findByRole('list', { name: 'You' })
    expect(you).toHaveTextContent('Not set, so the default (openrouter/free) is used')
    expect(screen.getByRole('list', { name: 'Organizations you own' })).toHaveTextContent('openai/gpt-5')
    expect(screen.getByRole('list', { name: 'Repositories you administer' })).toHaveTextContent("the organization's model is used")
  })

  it('searches the live list as you type and saves a repository model', async () => {
    const set = vi.spyOn(userApi, 'setRepoModel').mockResolvedValue({ text: 'anthropic/claude-sonnet' })
    renderAs({ platform: 'github', token: 'ghp' }, <Models />)
    await userEvent.click(await screen.findByRole('button', { name: 'Change model for acme/web' }))
    const dialog = screen.getByRole('dialog')
    const list = await within(dialog).findByRole('list', { name: 'Models' })
    expect(within(list).getAllByRole('button')).toHaveLength(3)
    expect(userApi.models).toHaveBeenCalledWith('text')

    await userEvent.type(within(dialog).getByRole('searchbox', { name: 'Search models' }), 'clau')
    expect(within(list).getAllByRole('button')).toHaveLength(1)
    await userEvent.clear(within(dialog).getByRole('searchbox'))
    await userEvent.type(within(dialog).getByRole('searchbox'), 'free router')
    expect(within(list).getByRole('button')).toHaveTextContent('Free')
    await userEvent.clear(within(dialog).getByRole('searchbox'))
    await userEvent.type(within(dialog).getByRole('searchbox'), 'nothing-like-this')
    expect(within(dialog).getByText(/No model matches/)).toBeInTheDocument()

    await userEvent.clear(within(dialog).getByRole('searchbox'))
    await userEvent.click(within(dialog).getByRole('button', { name: /Claude Sonnet/ }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(set).toHaveBeenCalledWith('repo1', 'text', 'anthropic/claude-sonnet')
  })

  it('loads the next 100 models when the list is scrolled to the bottom, and a new search starts over', async () => {
    vi.spyOn(userApi, 'models').mockResolvedValue(Array.from({ length: 250 }, (_, i) => model(`vendor/m${i}`, `Model ${i}`)))
    renderAs({ platform: 'github', token: 'ghp' }, <Models />)
    await userEvent.click(await screen.findByRole('button', { name: 'Change model for alice' }))
    const dialog = screen.getByRole('dialog')
    const list = await within(dialog).findByRole('list', { name: 'Models' })
    expect(within(list).getAllByRole('button')).toHaveLength(100)
    expect(within(dialog).getByText('Showing 100 of 250 models. Scroll for more.')).toBeInTheDocument()

    Object.defineProperty(list, 'clientHeight', { configurable: true, value: 320 })
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 5000 })
    const scrollToBottom = () => {
      list.scrollTop = 4680
      fireEvent.scroll(list)
    }
    list.scrollTop = 100
    fireEvent.scroll(list)
    expect(within(list).getAllByRole('button')).toHaveLength(100)
    scrollToBottom()
    expect(within(list).getAllByRole('button')).toHaveLength(200)
    scrollToBottom()
    expect(within(list).getAllByRole('button')).toHaveLength(250)
    expect(within(dialog).getByText('250 of 250 models')).toBeInTheDocument()

    await userEvent.type(within(dialog).getByRole('searchbox', { name: 'Search models' }), 'm1')
    expect(within(dialog).getByText('Showing 100 of 111 models. Scroll for more.')).toBeInTheDocument()
  })

  it('offers only the Text modality for now; the others are disabled', async () => {
    renderAs({ platform: 'github', token: 'ghp' }, <Models />)
    await userEvent.click(await screen.findByRole('button', { name: 'Change model for alice' }))
    const tabs = within(screen.getByRole('tablist', { name: 'Modality' })).getAllByRole('tab')
    expect(tabs.map((t) => t.textContent)).toEqual(['Text', 'Image', 'Video', 'Speech', 'Decisions', 'Embeddings', 'Rerank', 'Transcription', 'Audio'])
    expect(tabs[0]).toBeEnabled()
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    for (const tab of tabs.slice(1)) expect(tab).toBeDisabled()
  })

  it('clears an org model so it falls back', async () => {
    const set = vi.spyOn(userApi, 'setOrgModel').mockResolvedValue({})
    renderAs({ platform: 'github', token: 'ghp' }, <Models />)
    await userEvent.click(await screen.findByRole('button', { name: 'Change model for acme' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Use fallback' }))
    expect(set).toHaveBeenCalledWith('org1', 'text', null)
  })
})

describe('model helpers', () => {
  it('formats prices per million tokens and context sizes', () => {
    expect(perMillion('0.00000125')).toBe('$1.25')
    expect(perMillion('0.00001')).toBe('$10')
    expect(perMillion(null)).toBeNull()
    expect(formatContext(400_000)).toBe('400K')
    expect(formatContext(1_048_576)).toBe('1M')
  })

  it('matches every word of the query against the name or id', () => {
    const m = { id: 'anthropic/claude-sonnet', name: 'Claude Sonnet' }
    expect(matchesQuery(m, 'SONNET anthropic')).toBe(true)
    expect(matchesQuery(m, 'sonnet gpt')).toBe(false)
    expect(matchesQuery(m, '  ')).toBe(true)
  })
})
