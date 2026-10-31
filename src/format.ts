export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function platformName(platform: string): string {
  return platform === 'github' ? 'GitHub' : 'GitLab'
}
