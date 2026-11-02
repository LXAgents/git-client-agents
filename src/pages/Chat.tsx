import { Loader2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { AgentWorkPane } from '../components/chat/AgentWorkPane'
import { ChatRoomProvider, useChatRoom } from '../components/chat/ChatRoomContext'
import { RoomDetailsPane } from '../components/chat/RoomDetailsPane'
import { RoomPicker } from '../components/chat/RoomPicker'
import { TeamChatPane } from '../components/chat/TeamChatPane'
import { PageHeader } from '../components/PageHeader'

// One room at a time, picked at the top: its details on the left (10%), the agent's work in the
// middle (45%) and the people's chat on the right (45%), using the page's full width (stacked on
// narrow screens). One stream serves all three.
export function Chat() {
  return (
    <ChatRoomProvider>
      <PageHeader
        title="Chat"
        description="Pick a repository or organization. Watch the agent work and ask it things in the middle; talk with your team on the right, starting with @lxagents to ask the agent."
      />
      <Room />
    </ChatRoomProvider>
  )
}

function Room() {
  const { me } = useAuth()
  const { currentRoom, loading } = useChatRoom()
  if (!currentRoom) {
    return loading ? (
      <p className="flex items-center text-sm text-fg-muted">
        <Loader2 aria-hidden className="mr-2 size-4 animate-spin text-accent" /> Loading rooms…
      </p>
    ) : null
  }
  const myId = me?.id ?? null
  return (
    <>
      <RoomPicker />
      <div className="grid gap-4 lg:grid-cols-[1fr_4.5fr_4.5fr]">
        <RoomDetailsPane key={`details-${currentRoom.room}`} room={currentRoom} />
        <AgentWorkPane key={`work-${currentRoom.room}`} room={currentRoom} me={myId} />
        <TeamChatPane key={`team-${currentRoom.room}`} room={currentRoom} me={myId} />
      </div>
    </>
  )
}
