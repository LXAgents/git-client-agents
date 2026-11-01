import { useCallback } from 'react'
import { Building2, FolderGit2, Loader2, User } from 'lucide-react'
import { ChatPane } from '../components/chat/ChatPane'
import { PageHeader } from '../components/PageHeader'
import { useLoad } from '../hooks/useLoad'
import { chatApi } from '../services/chat'

// Three chat rooms side by side: your own with the agent, a repository's and an organization's.
// Repository and organization rooms list only those you are in right now.
export function Chat() {
  const { data: rooms, loading } = useLoad(useCallback(() => chatApi.rooms(), []))
  return (
    <>
      <PageHeader
        title="Chat"
        description="Talk to the agent and your team. Your own chat answers every message; in repository and organization rooms, start with @lxagents to ask the agent. Answers to comments show up live in your chat and the repository’s."
      />
      {loading && !rooms ? (
        <p className="flex items-center text-sm text-fg-muted">
          <Loader2 aria-hidden className="mr-2 size-4 animate-spin text-accent" /> Loading rooms…
        </p>
      ) : rooms ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <ChatPane title="My chat" icon={User} rooms={[rooms.user]} empty="" hint="Every message here goes to the agent." />
          <ChatPane title="Repository" icon={FolderGit2} rooms={rooms.repos} empty="No imported repository you can read yet." hint="Start with @lxagents to ask the agent." />
          <ChatPane title="Organization" icon={Building2} rooms={rooms.orgs} empty="No imported organization you are in yet." hint="Start with @lxagents to ask the agent." />
        </div>
      ) : null}
    </>
  )
}
