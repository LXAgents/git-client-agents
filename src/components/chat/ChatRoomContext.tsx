import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLoad } from '../../hooks/useLoad'
import { chatApi, openChatStream } from '../../services/chat'
import type { ChatEvent, ChatRoom, ChatRoomKind, ChatRooms } from '../../types'

export interface PickableRoom extends ChatRoom {
  kind: ChatRoomKind
}

type Listener = (event: ChatEvent) => void

interface ChatRoomState {
  /** Every room you may join, My chat first, then repositories, then organizations. */
  rooms: PickableRoom[]
  loading: boolean
  currentRoom: PickableRoom | null
  selectRoom: (room: string) => void
  /** Whether the current room's stream is open. */
  connected: boolean
  /** Hears every event of the current room's stream; returns the unsubscribe. */
  subscribe: (listener: Listener) => () => void
}

const ChatRoomContext = createContext<ChatRoomState | null>(null)

function flatten(rooms: ChatRooms | null): PickableRoom[] {
  if (!rooms) return []
  return [{ ...rooms.user, kind: 'user' }, ...rooms.repos.map((r) => ({ ...r, kind: 'repo' as const })), ...rooms.orgs.map((o) => ({ ...o, kind: 'org' as const }))]
}

// The Chat page's shared state: the rooms, the one selected room, and one event stream for it,
// opened when the room is picked and closed when another one is (or the page closes). Both
// panes read the same stream through subscribe(). The default room is the first repository,
// then the first organization, then My chat.
export function ChatRoomProvider({ children }: { children: ReactNode }) {
  const { data, loading } = useLoad(useCallback(() => chatApi.rooms(), []))
  const rooms = useMemo(() => flatten(data), [data])
  const [picked, setPicked] = useState<string | null>(null)
  const [connection, setConnection] = useState<{ room: string | null; connected: boolean }>({ room: null, connected: false })
  const listeners = useRef(new Set<Listener>())

  const currentRoom = useMemo(() => rooms.find((r) => r.room === picked) ?? rooms.find((r) => r.kind === 'repo') ?? rooms.find((r) => r.kind === 'org') ?? rooms[0] ?? null, [rooms, picked])
  const roomId = currentRoom?.room ?? null

  useEffect(() => {
    if (!roomId) return
    const abort = new AbortController()
    openChatStream(
      roomId,
      (event) => {
        for (const listener of listeners.current) listener(event)
      },
      abort.signal,
      (connected) => setConnection({ room: roomId, connected }),
    )
    return () => abort.abort()
  }, [roomId])

  const subscribe = useCallback((listener: Listener) => {
    listeners.current.add(listener)
    return () => {
      listeners.current.delete(listener)
    }
  }, [])

  const value = useMemo<ChatRoomState>(
    () => ({ rooms, loading, currentRoom, selectRoom: setPicked, connected: connection.room === roomId && connection.connected, subscribe }),
    [rooms, loading, currentRoom, connection, roomId, subscribe],
  )
  return <ChatRoomContext.Provider value={value}>{children}</ChatRoomContext.Provider>
}

// eslint-disable-next-line react/only-export-components -- hook lives beside its provider
export function useChatRoom(): ChatRoomState {
  const state = useContext(ChatRoomContext)
  if (!state) throw new Error('useChatRoom must be used inside ChatRoomProvider')
  return state
}

// Calls `onEvent` for each event of the current room's stream. The latest `onEvent` is used,
// so it need not be stable.
// eslint-disable-next-line react/only-export-components -- hook lives beside its provider
export function useRoomEvents(onEvent: Listener) {
  const { subscribe } = useChatRoom()
  const handler = useRef(onEvent)
  useEffect(() => {
    handler.current = onEvent
  })
  useEffect(() => subscribe((event) => handler.current(event)), [subscribe])
}
