/**
 * Canonical Socket.IO event type definitions.
 * These are shared between the server and can be imported by the frontend.
 *
 * Room naming convention:
 *   workspace:{workspaceId}   — all members of a workspace
 *   project:{projectId}       — all members of a project
 */

// ─── Events emitted FROM the Server TO clients ────────────────────────────────
export interface ServerToClientEvents {
  // Task events
  'task:created': (payload: TaskPayload) => void
  'task:updated': (payload: TaskPayload) => void
  'task:deleted': (payload: { taskId: number; projectId: number }) => void

  // Comment events
  'comment:added': (payload: CommentPayload) => void
  'comment:deleted': (payload: { commentId: number; taskId: number }) => void


  'doc:created': (payload: DocPayload) => void
  'doc:updated': (payload: DocPayload) => void
  'doc:deleted': (payload: { docId: number; projectId: number }) => void
  'doc:edit': (payload: DocEditPayload) => void

  // Snippet events
  'snippet:created': (payload: SnippetPayload) => void
  'snippet:updated': (payload: SnippetPayload) => void
  'snippet:deleted': (payload: { snippetId: number; projectId: number }) => void

  // Sprint events
  'sprint:created': (payload: { sprintId: number; projectId: number; data: Record<string, unknown> }) => void
  'sprint:updated': (payload: { sprintId: number; projectId: number; data: Record<string, unknown> }) => void
  'sprint:deleted': (payload: { sprintId: number; projectId: number }) => void

  // Project events
  'project:created': (payload: { projectId: number; workspaceId: number; data: Record<string, unknown> }) => void
  'project:updated': (payload: { projectId: number; workspaceId?: number; data: Record<string, unknown> }) => void
  'project:deleted': (payload: { projectId: number; workspaceId?: number }) => void
  'project:member_added': (payload: { projectId: number; userId: number; role: string }) => void
  'project:member_removed': (payload: { projectId: number; userId: number }) => void

  // Activity feed
  'activity:new': (payload: { id?: number; workspaceId: number; projectId?: number | null; userId: number; actionType: string; metadata?: any; createdAt?: string | Date }) => void

  // Chat events
  'chat:message': (payload: ChatMessagePayload) => void

  // Presence / cursors
  'cursor:move': (payload: CursorPayload) => void
  'user:joined': (payload: PresencePayload) => void
  'user:left': (payload: PresencePayload) => void

  // Notifications
  'notification:new': (payload: NotificationPayload) => void
  'invitation:rejected': (payload: { email: string }) => void

  // Generic error
  'error': (payload: { message: string }) => void
}

// ─── Events emitted FROM clients TO the Server ────────────────────────────────
export interface ClientToServerEvents {
  'workspace:join': (workspaceId: number) => void
  'workspace:leave': (workspaceId: number) => void

  'project:join': (projectId: number) => void
  'project:leave': (projectId: number) => void

  'doc:edit': (payload: DocEditPayload) => void
  'cursor:move': (payload: CursorPayload) => void
  'chat:send': (payload: { projectId: number; channel: string; content: string }) => void
}

// ─── Per-socket data stored on the server ─────────────────────────────────────
export interface SocketData {
  userId: number
}

// ─── Payload shapes ───────────────────────────────────────────────────────────
export interface TaskPayload {
  taskId: number
  projectId: number
  workspaceId: number
  data: Record<string, unknown>
}

export interface DocPayload {
  docId: number
  projectId: number
  workspaceId: number
  data: Record<string, unknown>
}

export interface SnippetPayload {
  snippetId: number
  projectId: number
  workspaceId: number
  data: Record<string, unknown>
}

export interface CommentPayload {
  commentId: number
  taskId: number
  projectId: number
  userId: number
  content: string
}

export interface DocEditPayload {
  docId: number
  projectId: number
  userId: number
  content: string
}

export interface CursorPayload {
  userId: number
  projectId: number
  position: { x: number; y: number }
}

export interface PresencePayload {
  userId: number
  roomId: string
}

export interface NotificationPayload {
  notificationId: number
  type: string
  message: string
}

export interface ChatMessagePayload {
  id: number | string
  projectId: number
  userId: number
  channel: string
  content: string
  createdAt: string
  senderName: string
  senderRole: string
  avatarUrl?: string | null
}

