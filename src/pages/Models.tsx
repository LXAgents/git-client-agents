import { useState, type ReactNode } from 'react'
import { Building2, FolderGit2, User } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { ModelPicker } from '../components/ModelPicker'
import { PageHeader, PlatformBadge } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { useLoad } from '../hooks/useLoad'
import { DEFAULT_MODEL } from '../modalities'
import { errorMessage, userApi } from '../services/api'
import type { Modality, ModelSettings, Org, Repo } from '../types'

interface ModelsData {
  own: ModelSettings
  orgs: Org[]
  repos: Repo[]
}

async function load(): Promise<ModelsData> {
  const [own, orgs, repos] = await Promise.all([userApi.ownModels(), userApi.orgs(), userApi.repos()])
  return { own, orgs, repos }
}

type Target = { kind: 'user' } | { kind: 'org'; org: Org } | { kind: 'repo'; repo: Repo }

function Row({ icon, name, badge, model, fallback, onChange }: { icon: ReactNode; name: string; badge?: ReactNode; model?: string; fallback: string; onChange: () => void }) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="text-fg-muted">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-semibold">
          {name} {badge}
        </p>
        <p className="truncate text-xs text-fg-muted">
          {model ? <code className="font-mono text-fg">{model}</code> : <>Not set, so {fallback} is used</>}
        </p>
      </div>
      <Button size="sm" onClick={onChange} aria-label={`Change model for ${name}`}>
        Change
      </Button>
    </li>
  )
}

function Section({ title, empty, children }: { title: string; empty: string; children: ReactNode[] }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold tracking-tight text-fg-muted">{title}</h2>
      <ul aria-label={title} className="divide-y divide-line-muted overflow-hidden rounded-2xl border border-line bg-canvas-subtle shadow-card">
        {children.length ? children : <li className="px-4 py-5 text-center text-sm text-fg-muted">{empty}</li>}
      </ul>
    </section>
  )
}

// One place to pick the model "@agents" uses: the repository's, then the organization's, then
// the commenter's own, then openrouter/free.
export function Models() {
  const toast = useToast()
  const { me } = useAuth()
  const { data, reload } = useLoad(load)
  const [editing, setEditing] = useState<Target | null>(null)

  const save = async (target: Target, modality: Modality, model: string | null) => {
    try {
      if (target.kind === 'user') await userApi.setOwnModel(modality, model)
      else if (target.kind === 'org') await userApi.setOrgModel(target.org.id, modality, model)
      else await userApi.setRepoModel(target.repo.id, modality, model)
      toast.success(model ? `Model set to ${model}` : 'Model cleared')
      await reload()
    } catch (err) {
      toast.error(errorMessage(err))
      throw err
    }
  }

  const ownFallback = `the default (${DEFAULT_MODEL})`
  const orgFallback = "the commenter's own model"
  const repoFallback = "the organization's model"

  const picker = (() => {
    if (!editing || !data) return null
    const common = { onClose: () => setEditing(null), onSave: (m: Modality, model: string | null) => save(editing, m, model) }
    if (editing.kind === 'user') return <ModelPicker title="Your model" current={data.own.text} fallback={ownFallback} {...common} />
    if (editing.kind === 'org') return <ModelPicker title={`Model for ${editing.org.orgName}`} current={editing.org.models?.text} fallback={orgFallback} {...common} />
    return <ModelPicker title={`Model for ${editing.repo.fullName}`} current={editing.repo.models?.text} fallback={repoFallback} {...common} />
  })()

  return (
    <>
      <PageHeader
        title="Models"
        description={
          <>
            A comment that starts with <code className="font-mono text-fg">@agents</code> uses the repository’s model, then the organization’s,
            then the commenter’s own, then <code className="font-mono text-fg">{DEFAULT_MODEL}</code>. Start with{' '}
            <code className="font-mono text-fg">@vendor/model</code> to pick one model for a single comment.
          </>
        }
      />
      {!data ? (
        <p className="text-sm text-fg-muted">Loading…</p>
      ) : (
        <div className="space-y-8">
          <Section title="You" empty="">
            {[
              <Row
                key="me"
                icon={<User aria-hidden className="size-4" />}
                name={me?.login ?? 'You'}
                badge={me && <PlatformBadge platform={me.platform} />}
                model={data.own.text}
                fallback={ownFallback}
                onChange={() => setEditing({ kind: 'user' })}
              />,
            ]}
          </Section>
          <Section title="Organizations you own" empty="Import an organization you own to set its model.">
            {data.orgs.map((org) => (
              <Row
                key={org.id}
                icon={<Building2 aria-hidden className="size-4" />}
                name={org.orgName}
                model={org.models?.text}
                fallback={orgFallback}
                onChange={() => setEditing({ kind: 'org', org })}
              />
            ))}
          </Section>
          <Section title="Repositories you administer" empty="Import a repository you administer to set its model.">
            {data.repos.map((repo) => (
              <Row
                key={repo.id}
                icon={<FolderGit2 aria-hidden className="size-4" />}
                name={repo.fullName}
                model={repo.models?.text}
                fallback={repoFallback}
                onChange={() => setEditing({ kind: 'repo', repo })}
              />
            ))}
          </Section>
        </div>
      )}
      {picker}
    </>
  )
}
