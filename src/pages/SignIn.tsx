import { useState, type FormEvent } from 'react'
import { Bot } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { Segmented, SelectField, TextField } from '../components/Field'
import { errorMessage, errorStatus } from '../services/api'
import type { Platform } from '../types'

type Mode = 'user' | 'admin'

function explain(err: unknown, mode: Mode): string {
  const status = errorStatus(err)
  if (status === 401) return mode === 'admin' ? 'That admin token was rejected.' : 'The platform rejected that token.'
  if (status === 403) return 'You are not whitelisted on this server yet. Ask the operator to add your account.'
  return errorMessage(err)
}

export function SignIn() {
  const { signIn } = useAuth()
  const [mode, setMode] = useState<Mode>('user')
  const [platform, setPlatform] = useState<Platform>('github')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(mode === 'admin' ? { mode, token: token.trim() } : { mode, platform, token: token.trim() })
    } catch (err) {
      setError(explain(err, mode))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 pt-20">
      <Bot aria-hidden className="size-12 text-accent" />
      <h1 className="mt-4 text-2xl font-light">Sign in to git-client-agents</h1>
      <form onSubmit={submit} className="mt-6 w-full max-w-sm space-y-4 rounded-lg border border-line bg-canvas-subtle p-5">
        <Segmented
          label="Sign in as"
          value={mode}
          onChange={(m) => {
            setMode(m)
            setError(null)
          }}
          options={[
            { value: 'user', label: 'User' },
            { value: 'admin', label: 'Operator' },
          ]}
        />
        {mode === 'user' && (
          <SelectField label="Platform" value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>
            <option value="github">GitHub</option>
            <option value="gitlab">GitLab</option>
          </SelectField>
        )}
        <TextField
          label={mode === 'admin' ? 'Admin token' : 'Personal access token'}
          type="password"
          autoComplete="off"
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          hint={
            mode === 'admin'
              ? 'The ADMIN_TOKEN configured on git-server-agents.'
              : platform === 'github'
                ? 'Needs the read:org scope. Used to check who you are and which orgs you own; never stored by the server.'
                : 'Needs the read_api scope. Used to check who you are and which groups you own; never stored by the server.'
          }
        />
        {error && (
          <p role="alert" className="rounded-md border border-danger/50 bg-danger-muted px-3 py-2 text-sm text-fg">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" busy={busy} className="w-full">
          Sign in
        </Button>
      </form>
      <p className="mt-4 max-w-sm text-center text-xs text-fg-muted">The token stays in this browser tab and is cleared when you close it.</p>
    </div>
  )
}
