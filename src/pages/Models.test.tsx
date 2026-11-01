import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { formatContext, matchesQuery, perMillion } from '../modalities'
import { userApi } from '../services/api'
import { renderAs } from '../test/render'
import type { AiProvider, ModelInfo, Org, Repo } from '../types'
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

const PROVIDERS: AiProvider[] = [
  { id: 'openrouter', name: 'OpenRouter', example: 'openai/gpt-5', keyForModels: false, reportsCost: true },
  { id: 'anthropic', name: 'Anthropic', example: 'claude-opus-5-5', keyForModels: true, reportsCost: false },
]

const acme: Org = {
  id: 'org1',
  platform: 'github',
  orgName: 'acme',
  installationId: '555',
  owner: { platform: 'github', id: '1001', login: 'alice', name: null, avatarUrl: null },
  models: { text: { provider: 'openrouter', model: 'openai/gpt-5' } },
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
    vi.spyOn(userApi, 'providers').mockResolvedValue(PROVIDERS)
    vi.spyOn(userApi, 'models').mockResolvedValue([
      model('openai/gpt-5', 'GPT-5'),
      model('anthropic/claude-sonnet', 'Claude Sonnet'),
      model('openrouter/free', 'Free Models Router', true),
    ])
  })

  it('shows each owner and what falls back to what', async () => {
    renderAs({ platform: 'github', token: 'ghp' }, <Models />)
    const you = await screen.findByRole('list', { name: 'You' })
    expect(you).toHaveTextContent('Not set, so the default (openrouter/free on OpenRouter) is used')
    expect(screen.getByRole('list', { name: 'Organizations you own' })).toHaveTextContent('openai/gpt-5 on OpenRouter')
    expect(screen.getByRole('list', { name: 'Repositories you administer' })).toHaveTextContent("the organization's model is used")
  })

  it('searches the live list as you type and saves a repository model', async () => {
    const set = vi.spyOn(userApi, 'setRepoModel').mockResolvedValue({ text: { provider: 'openrouter', model: 'anthropic/claude-sonnet' } })
    renderAs({ platform: 'github', token: 'ghp' }, <Models />)
    await userEvent.click(await screen.findByRole('button', { name: 'Change model for acme/web' }))
    const dialog = screen.getByRole('dialog')
    const list = await within(dialog).findByRole('list', { name: 'Models' })
    expect(within(list).getAllByRole('button')).toHaveLength(3)
    expect(userApi.models).toHaveBeenCalledWith('text', 'openrouter', { repoId: 'repo1' })

    await userEvent.type(within(dialog).getByRole('searchbox', { name: 'Search models' }), 'clau')
    // The match, and the offer to use the typed id as it is.
    expect(within(list).getAllByRole('button').map((b) => b.textContent)).toEqual([expect.stringContaining('Use clau as the OpenRouter model id'), expect.stringContaining('Claude Sonnet')])
    await userEvent.clear(within(dialog).getByRole('searchbox'))
    await userEvent.type(within(dialog).getByRole('searchbox'), 'free router')
    expect(within(list).getAllByRole('button')).toHaveLength(1)
    expect(within(list).getByRole('button')).toHaveTextContent('Free')
    await userEvent.clear(within(dialog).getByRole('searchbox'))
    await userEvent.type(within(dialog).getByRole('searchbox'), 'nothing-like-this')
    expect(within(dialog).getByText(/No model matches/)).toBeInTheDocument()

    await userEvent.clear(within(dialog).getByRole('searchbox'))
    await userEvent.click(within(dialog).getByRole('button', { name: /Claude Sonnet/ }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(set).toHaveBeenCalledWith('repo1', 'text', { provider: 'openrouter', model: 'anthropic/claude-sonnet' })
  })

  it('switches provider, lists that provider\'s models with the org key, and saves provider and model', async () => {
    const models = vi.spyOn(userApi, 'models').mockImplementation(async (_m, provider) =>
      provider === 'anthropic' ? [{ ...model('claude-opus-5-5', 'Claude Opus 5.5'), pricing: { prompt: null, completion: null }, provider: 'anthropic' }] : [model('openai/gpt-5', 'GPT-5')],
    )
    const set = vi.spyOn(userApi, 'setOrgModel').mockResolvedValue({ text: { provider: 'anthropic', model: 'claude-opus-5-5' } })
    renderAs({ platform: 'github', token: 'ghp' }, <Models />)
    await userEvent.click(await screen.findByRole('button', { name: 'Change model for acme' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('openai/gpt-5 on OpenRouter')).toBeInTheDocument()
    await within(dialog).findByRole('button', { name: /GPT-5/ })

    await userEvent.selectOptions(await within(dialog).findByLabelText('Provider'), 'Anthropic')
    await userEvent.click(await within(dialog).findByRole('button', { name: /Claude Opus 5.5/ }))
    expect(models).toHaveBeenLastCalledWith('text', 'anthropic', { orgId: 'org1' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(set).toHaveBeenCalledWith('org1', 'text', { provider: 'anthropic', model: 'claude-opus-5-5' })
  })

  it('says to add a key when a provider lists models only to key holders, and still takes a typed id', async () => {
    vi.spyOn(userApi, 'models').mockImplementation(async (_m, provider) => {
      if (provider === 'anthropic') throw new Error('add a Anthropic key first: Anthropic lists its models only to a key holder')
      return [model('openai/gpt-5', 'GPT-5')]
    })
    const set = vi.spyOn(userApi, 'setOwnModel').mockResolvedValue({ text: { provider: 'anthropic', model: 'claude-haiku-5-5' } })
    renderAs({ platform: 'github', token: 'ghp' }, <Models />)
    await userEvent.click(await screen.findByRole('button', { name: 'Change model for alice' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.selectOptions(await within(dialog).findByLabelText('Provider'), 'Anthropic')
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Add a Anthropic key on the API keys page')
    await userEvent.type(within(dialog).getByRole('searchbox', { name: 'Search models' }), 'claude-haiku-5-5')
    await userEvent.click(within(dialog).getByRole('button', { name: /Use claude-haiku-5-5 as the Anthropic model id/ }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(set).toHaveBeenCalledWith('text', { provider: 'anthropic', model: 'claude-haiku-5-5' })
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
