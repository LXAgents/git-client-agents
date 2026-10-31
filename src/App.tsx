import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { Layout } from './components/Layout'
import { ToastProvider } from './components/Toast'
import { Home } from './pages/Home'
import { SignIn } from './pages/SignIn'

function Routed() {
  const { session, checking } = useAuth()
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-fg-muted">
        <Loader2 aria-hidden className="mr-2 size-5 animate-spin" /> Checking your session…
      </div>
    )
  }
  if (!session) return <SignIn />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
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
