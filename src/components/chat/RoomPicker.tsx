import { Building2, FolderGit2, User } from 'lucide-react'
import { useChatRoom } from './ChatRoomContext'

const select =
  'h-10 w-full min-w-0 rounded-lg border border-line bg-canvas-subtle px-3 text-sm text-fg focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20 sm:w-80'
const ICON = { user: User, repo: FolderGit2, org: Building2 }

// Picks the one room the page shows, from GET /api/chat/rooms, with whether its stream is live.
export function RoomPicker() {
  const { rooms, currentRoom, selectRoom, connected } = useChatRoom()
  const repos = rooms.filter((r) => r.kind === 'repo')
  const orgs = rooms.filter((r) => r.kind === 'org')
  const mine = rooms.find((r) => r.kind === 'user')
  const Icon = ICON[currentRoom?.kind ?? 'user']
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
        <Icon aria-hidden className="size-4 shrink-0 text-fg-muted" />
        <select aria-label="Room" className={select} value={currentRoom?.room ?? ''} onChange={(e) => selectRoom(e.target.value)}>
          {mine && <option value={mine.room}>My chat (@{mine.name})</option>}
          {repos.length > 0 && (
            <optgroup label="Repositories">
              {repos.map((r) => (
                <option key={r.room} value={r.room}>
                  {r.name}
                </option>
              ))}
            </optgroup>
          )}
          {orgs.length > 0 && (
            <optgroup label="Organizations">
              {orgs.map((r) => (
                <option key={r.room} value={r.room}>
                  {r.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
      <span className={`flex items-center gap-1.5 text-xs ${connected ? 'text-success' : 'text-fg-muted'}`}>
        <span aria-hidden className={`size-1.5 rounded-full ${connected ? 'bg-success' : 'bg-fg-muted'}`} />
        {connected ? 'Live' : 'Connecting…'}
      </span>
    </div>
  )
}
