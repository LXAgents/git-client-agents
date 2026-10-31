import githubLogo from '../assets/platforms/github.png'
import gitlabLogo from '../assets/platforms/gitlab.png'
import type { Platform } from '../types'

const LOGOS: Record<Platform, string> = { github: githubLogo, gitlab: gitlabLogo }
const PLATFORM_LABELS: Record<Platform, string> = { github: 'GitHub', gitlab: 'GitLab' }

// The GitHub mark is black, so it is inverted on a dark background: in dark mode by default,
// or in light mode when it sits on a dark surface (`onDark`).
function invertClass(platform: Platform, onDark: boolean) {
  if (platform !== 'github') return ''
  return onDark ? 'invert dark:invert-0' : 'dark:invert'
}

// The platform logo. With `label`, it carries the platform's name for screen readers and a
// tooltip, so it can stand in for the written name; without it, it is decoration.
export function BrandIcon({
  platform,
  className = 'size-5',
  label = false,
  onDark = false,
}: {
  platform: Platform
  className?: string
  label?: boolean
  onDark?: boolean
}) {
  const name = PLATFORM_LABELS[platform]
  return (
    <img
      src={LOGOS[platform]}
      alt={label ? name : ''}
      aria-hidden={label ? undefined : true}
      title={label ? name : undefined}
      draggable={false}
      className={`inline-block shrink-0 object-contain ${invertClass(platform, onDark)} ${className}`}
    />
  )
}
