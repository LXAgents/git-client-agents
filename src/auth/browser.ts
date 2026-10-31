// Full-page navigation, kept in one object so tests can replace it.
export const browser = {
  go(url: string) {
    window.location.assign(url)
  },
}
