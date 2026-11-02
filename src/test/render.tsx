import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AuthProvider } from '../auth/AuthContext'
import { saveSession, type Session } from '../auth/session'
import { ToastProvider } from '../components/Toast'

// Renders a page inside the app's providers, signed in with `session`, at `path`.
export function renderAs(session: Session, ui: ReactNode, path = '/') {
  saveSession(session)
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <AuthProvider>{ui}</AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}
