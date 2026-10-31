import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { Layout } from './components/Layout'
import { ToastProvider } from './components/Toast'
import { ApiKeys } from './pages/ApiKeys'
import { Home } from './pages/Home'
import { Organizations } from './pages/Organizations'
import { SignIn } from './pages/SignIn'
import { Users } from './pages/Users'

function Routed() {
  const { session, isAdmin, checking } = useAuth()
  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-fg-muted">
        <Loader2 aria-hidden className="mr-2 size-5 animate-spin text-accent" /> Checking your session…
      </div>
    )
  }
  if (!session) return <SignIn />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        {isAdmin && <Route path="users" element={<Users />} />}
        <Route path="orgs" element={<Organizations />} />
        <Route path="keys" element={<ApiKeys />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routed />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
