// ── Types ─────────────────────────────────────────────────────────────────────

export interface AIChatResponse {
  conversationId: number
  messageId: number
  reply: string
}

export interface AIConversation {
  id: number
  title: string
  scope: string
  updatedAt: string
  createdAt: string
}

export interface AIMessage {
  id: number
  role: 'user' | 'model'
  content: string
  createdAt: string
}

// ── Base URL ──────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message ?? `Request failed: ${res.status}`)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json()
}

// ── AI API helpers ────────────────────────────────────────────────────────────

/**
 * Send a message to the AI. Creates a new conversation if conversationId is not provided.
 */
export function sendAIMessage(payload: {
  message: string
  conversationId?: number
  scope: 'workspace' | 'project'
  scopeId: number
  attachment?: { name: string; type: string; data: string }
}): Promise<AIChatResponse> {
  return apiFetch<AIChatResponse>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * List all AI conversations for a workspace (newest first).
 */
export function getAIConversations(workspaceId: number): Promise<AIConversation[]> {
  return apiFetch<AIConversation[]>(`/api/ai/conversations?workspaceId=${workspaceId}`)
}

/**
 * Get all messages in a conversation.
 */
export function getAIMessages(conversationId: number): Promise<AIMessage[]> {
  return apiFetch<AIMessage[]>(`/api/ai/conversations/${conversationId}/messages`)
}

/**
 * Delete a conversation and all its messages.
 */
export function deleteAIConversation(conversationId: number): Promise<void> {
  return apiFetch<void>(`/api/ai/conversations/${conversationId}`, {
    method: 'DELETE',
  })
}

/**
 * Send a message to the AI and receive a stream of Server-Sent Events (SSE).
 * Yields parsed JSON chunks as they arrive from the backend.
 */
export async function* sendAIMessageStream(payload: {
  message: string
  conversationId?: number
  scope: 'workspace' | 'project'
  scopeId: number
  attachment?: { name: string; type: string; data: string }
}): AsyncGenerator<any, void, unknown> {
  const res = await fetch(`${API}/api/ai/chat/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message ?? `Request failed: ${res.status}`)
  }

  if (!res.body) throw new Error('ReadableStream not supported by browser')
  
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      // The last element is either an incomplete chunk or empty string
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6)
          if (!dataStr.trim()) continue
          try {
            yield JSON.parse(dataStr)
          } catch (e) {
            console.error('Failed to parse SSE line:', dataStr)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
