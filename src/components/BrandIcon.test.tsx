import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BrandIcon } from './BrandIcon'
import { PlatformBadge } from './PageHeader'

describe('platform logos', () => {
  it('shows the logo in place of the name, keeping the name for screen readers', () => {
    render(
      <>
        <PlatformBadge platform="github" />
        <PlatformBadge platform="gitlab" />
      </>,
    )
    expect(screen.getByRole('img', { name: 'GitHub' })).toHaveAttribute('title', 'GitHub')
    expect(screen.getByRole('img', { name: 'GitLab' })).toBeInTheDocument()
    expect(screen.queryByText('GitHub')).toBeNull()
  })

  it('is decoration when it sits next to the written name', () => {
    const { container } = render(<BrandIcon platform="gitlab" />)
    expect(container.querySelector('img')).toHaveAttribute('alt', '')
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('inverts the black GitHub mark on a dark surface', () => {
    const { container } = render(<BrandIcon platform="github" onDark />)
    expect(container.querySelector('img')?.className).toContain('invert dark:invert-0')
  })
})
