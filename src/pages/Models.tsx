import { useCallback, useState, type ReactNode } from 'react'
import { Building2, FolderGit2, User } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { ModelPicker } from '../components/ModelPicker'
import { PageHeader, PlatformBadge } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { useLoad } from '../hooks/useLoad'
import { DEFAULT_MODEL, describeChoice } from '../modalities'
import { errorMessage, userApi } from '../services/api'
import type { AiProvider, Modality, ModelChoice, ModelSettings, Org, Repo } from '../types'

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

function Row({
  icon,
  name,
  badge,
  choice,
  providers,
  fallback,
  onChange,
}: {
  icon: ReactNode
  name: string
  badge?: ReactNode
  choice?: ModelChoice
  providers: AiProvider[] | null
  fallback: string
  onChange: () => void
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="text-fg-muted">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-semibold">
          {name} {badge}
        </p>
        <p className="truncate text-xs text-fg-muted">
          {choice ? <code className="font-mono text-fg">{describeChoice(choice, providers)}</code> : <>Not set, so {fallback} is used</>}
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

// One place to pick the provider and model "@lxagents" uses: the repository's, then the
// organization's, then the commenter's own, then openrouter/free on OpenRouter.
export function Models() {
  const toast = useToast()
  const { me } = useAuth()
  const { data, reload } = useLoad(load)
  const { data: providers } = useLoad(useCallback(() => userApi.providers(), []))
  const [editing, setEditing] = useState<Target | null>(null)

  const save = async (target: Target, modality: Modality, choice: ModelChoice | null) => {
    try {
      if (target.kind === 'user') await userApi.setOwnModel(modality, choice)
      else if (target.kind === 'org') await userApi.setOrgModel(target.org.id, modality, choice)
      else await userApi.setRepoModel(target.repo.id, modality, choice)
      toast.success(choice ? `Model set to ${describeChoice(choice, providers)}` : 'Model cleared')
      await reload()
    } catch (err) {
      toast.error(errorMessage(err))
      throw err
    }
  }

  const ownFallback = `the default (${DEFAULT_MODEL} on OpenRouter)`
  const orgFallback = "the commenter's own model"
  const repoFallback = "the organization's model"

  const picker = (() => {
    if (!editing || !data) return null
    const common = { providers, onClose: () => setEditing(null), onSave: (m: Modality, choice: ModelChoice | null) => save(editing, m, choice) }
    if (editing.kind === 'user') return <ModelPicker title="Your model" current={data.own.text} fallback={ownFallback} {...common} />
    if (editing.kind === 'org')
      return <ModelPicker title={`Model for ${editing.org.orgName}`} current={editing.org.models?.text} fallback={orgFallback} scope={{ orgId: editing.org.id }} {...common} />
    return <ModelPicker title={`Model for ${editing.repo.fullName}`} current={editing.repo.models?.text} fallback={repoFallback} scope={{ repoId: editing.repo.id }} {...common} />
  })()

  return (
    <>
      <PageHeader
        title="Models"
        description={
          <>
            A comment that starts with <code className="font-mono text-fg">@lxagents</code> uses the repository’s provider and model, then the
            organization’s, then the commenter’s own, then <code className="font-mono text-fg">{DEFAULT_MODEL}</code> on OpenRouter. Each answer
            is paid with a key for that provider, brought by the repository, organization or commenter. Start with{' '}
            <code className="font-mono text-fg">@vendor/model</code> to pick one OpenRouter model for a single comment.
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
                choice={data.own.text}
                providers={providers}
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
                choice={org.models?.text}
                providers={providers}
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
                choice={repo.models?.text}
                providers={providers}
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
