import type { Platform } from '../types'

// The GitHub and GitLab marks, inline so they need no extra package.
export function BrandIcon({ platform, className = 'size-5' }: { platform: Platform; className?: string }) {
  if (platform === 'github') {
    return (
      <svg aria-hidden viewBox="0 0 16 16" className={className} fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
    )
  }
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className}>
      <path fill="#E24329" d="m12 21.4 3.7-11.4H8.3L12 21.4Z" />
      <path fill="#FC6D26" d="M12 21.4 8.3 10H3.1L12 21.4Zm0 0 3.7-11.4h5.2L12 21.4Z" />
      <path fill="#FCA326" d="m3.1 10-1.1 3.4c-.1.3 0 .7.3.9L12 21.4 3.1 10Zm17.8 0 1.1 3.4c.1.3 0 .7-.3.9L12 21.4l8.9-11.4Z" />
      <path fill="#E24329" d="M3.1 10h5.2L6.1 3.2c-.1-.4-.6-.4-.8 0L3.1 10Zm17.8 0h-5.2l2.2-6.8c.1-.4.7-.4.8 0l2.2 6.8Z" />
    </svg>
  )
}
