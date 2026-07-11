import React, { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Plus, Paperclip, Globe, Volume2, Mic, ArrowUp,
  ExternalLink, MessageSquare, Lock, Trash2,
  PanelRightClose, PanelRightOpen, X
} from 'lucide-react'
import { Sidebar } from '../components/dashboard/Sidebar'
import { MessageBubble, type Message } from '../components/ai/MessageBubble'
import { ThinkingSkeleton } from '../components/ai/ThinkingSkeleton'
import { aiTokens } from '../components/ai/tokens'
import { AIIcon } from '../components/ai/AIIcon'
import { usePermissions } from '../context/RBACContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { useStore } from '../store/useStore'
import { useWorkspaces } from '../hooks/useWorkspaces'
import {
  sendAIMessage,
  sendAIMessageStream,
  getAIConversations,
  deleteAIConversation,
  type AIConversation,
} from '../lib/ai'

// ── ConvoItem ─────────────────────────────────────────────────────────────────
function ConvoItem({
  conv, onSelect, onDelete, active,
}: {
  conv: AIConversation
  onSelect: () => void
  onDelete: () => void
  active: boolean
}) {
  const { theme } = useTheme()
  const t = aiTokens(theme === 'dark')
  const [hov, setHov] = useState(false)
  const timeStr = new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect() }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left w-full transition-colors group cursor-pointer"
      style={{ background: active || hov ? t.convoHoverBg : 'transparent', color: active || hov ? t.textSecondary : t.textMuted }}
    >
      <MessageSquare className="w-3 h-3 flex-shrink-0" />
      <span className="flex-1 text-xs truncate">{conv.title}</span>
      <span className="text-[10px] flex-shrink-0">{timeStr}</span>
      {(hov || active) && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: t.textMuted }}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

// ── Right panel ───────────────────────────────────────────────────────────────
function RightPanel({
  workspaceId,
  activeConvId,
  onSelectConversation,
  refreshKey,
}: {
  workspaceId: number | undefined
  activeConvId: number | undefined
  onSelectConversation: (convId: number) => void
  refreshKey: number
}) {
  const { theme } = useTheme()
  const t = aiTokens(theme === 'dark')
  const [conversations, setConversations] = useState<AIConversation[]>([])

  useEffect(() => {
    if (!workspaceId) return
    getAIConversations(workspaceId)
      .then(setConversations)
      .catch(() => {})
  }, [workspaceId, refreshKey])

  const handleDelete = async (convId: number) => {
    await deleteAIConversation(convId).catch(() => {})
    setConversations((prev) => prev.filter((c) => c.id !== convId))
  }

  return (
    <aside
      className="flex flex-col overflow-hidden flex-shrink-0"
      style={{ width: 272, borderLeft: `1px solid ${t.borderWeak}`, background: t.panelBg }}
    >
      <div
        className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
        style={{ borderBottom: `1px solid ${t.borderWeak}` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: t.textPrimary }}>AI Assistant</span>
          <AIIcon size={14} style={{ color: t.accent }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {/* History */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.textDim }}>Conversation History</span>
          </div>
          {conversations.length === 0 ? (
            <p className="text-xs px-1" style={{ color: t.textMuted }}>No conversations yet. Start chatting!</p>
          ) : (
            conversations.map(conv => (
              <ConvoItem
                key={conv.id}
                conv={conv}
                active={conv.id === activeConvId}
                onSelect={() => onSelectConversation(conv.id)}
                onDelete={() => handleDelete(conv.id)}
              />
            ))
          )}
        </div>
      </div>
    </aside>
  )
}

// ── Input widget ──────────────────────────────────────────────────────────────
function InputWidget({
  value, onChange, onSend, onKeyDown, focused, onFocus, onBlur, disabled,
  attachment, onAttachmentSelect, onAttachmentClear
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  focused: boolean; onFocus: () => void; onBlur: () => void; disabled: boolean
  attachment?: { name: string; type: string; data: string } | null
  onAttachmentSelect?: (att: { name: string; type: string; data: string }) => void
  onAttachmentClear?: () => void
}) {
  const { theme } = useTheme()
  const t = aiTokens(theme === 'dark')
  const canSend = !!value.trim() && !disabled
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      onAttachmentSelect?.({ name: file.name, type: file.type, data: reader.result as string })
    }
    reader.readAsDataURL(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }
  return (
    <div
      className="w-full rounded-xl transition-all duration-200"
      style={{
        background: t.inputBg,
        border: `1px solid ${focused ? t.borderFocused : t.borderMid}`,
        boxShadow: focused ? t.inputGlow : 'none',
      }}
    >
      {attachment && (
        <div className="px-4 pt-3 pb-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium" style={{ background: t.surface2, color: t.textSecondary, border: `1px solid ${t.borderWeak}` }}>
            <Paperclip className="w-3.5 h-3.5" style={{ color: t.textDim }} />
            <span className="max-w-[150px] truncate">{attachment.name}</span>
            <button onClick={onAttachmentClear} className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      <div className="px-4 pt-3.5 pb-2">
        <textarea
          value={value}
          onChange={e => { onChange(e); autoGrow(e.target) }}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          placeholder="Ask DevCollab anything..."
          rows={1}
          className="w-full bg-transparent outline-none text-sm resize-none placeholder:text-current"
          style={{ color: t.textPrimary, lineHeight: 1.65, maxHeight: 120, overflowY: 'auto', fontFamily: 'var(--font-sans)' }}
        />
      </div>
      <div className="flex items-center justify-between px-3 pb-3">
        <div className="flex items-center gap-0.5">
          <input type="file" ref={fileRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: t.inputIconColor }}
            onMouseEnter={e => (e.currentTarget.style.color = t.inputIconHover)}
            onMouseLeave={e => (e.currentTarget.style.color = t.inputIconColor)}
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: t.inputIconColor }}
            onMouseEnter={e => (e.currentTarget.style.color = t.inputIconHover)}
            onMouseLeave={e => (e.currentTarget.style.color = t.inputIconColor)}
            title="Voice input"
          >
            <Mic className="w-4 h-4" />
          </button>
          <motion.button
            onClick={onSend}
            disabled={!canSend}
            whileTap={canSend ? { scale: 0.88 } : {}}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200"
            style={{
              background: canSend ? t.sendBg : t.sendDisabledBg,
              cursor: canSend ? 'pointer' : 'default',
              border: 'none',
            }}
          >
            <ArrowUp className="w-4 h-4" strokeWidth={2.5} style={{ color: canSend ? t.sendColor : t.sendDisabledColor }} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

// ── Intro hero ────────────────────────────────────────────────────────────────
function IntroHero({
  firstName, inputProps, onChip,
}: {
  firstName: string
  inputProps: {
    value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    onSend: () => void; onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
    focused: boolean; onFocus: () => void; onBlur: () => void; disabled: boolean
  }
  onChip: (text: string) => void
}) {
  const { theme } = useTheme()
  const t = aiTokens(theme === 'dark')

  return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center relative min-h-0">
      {/* Spotlight */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{ height: 280, background: t.spotlight }}
      />

      <div className="relative z-10 w-full max-w-xl px-6 flex flex-col items-center">
        {/* Icon box */}
        <motion.div
          initial={{ scale: 0.78, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.38, ease: 'easeOut' }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: t.iconBoxBg, border: `1px solid ${t.iconBoxBorder}`, boxShadow: t.iconBoxGlow }}
        >
          <AIIcon size={24} style={{ color: t.textPrimary }} />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3, ease: 'easeOut' }}
          className="text-[26px] font-semibold tracking-tight text-center mb-2"
          style={{ color: t.textPrimary, fontFamily: 'var(--font-sans)', lineHeight: 1.25 }}
        >
          How can I help you today{firstName ? `, ${firstName}` : ''}?
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.28 }}
          className="text-sm text-center mb-8"
          style={{ color: t.textMuted, lineHeight: 1.65, maxWidth: 340 }}
        >
          Ask anything about your workspace. I have full context.
        </motion.p>

        {/* Input */}
        <motion.div
          className="w-full mb-8"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.26 }}
        >
          <InputWidget {...inputProps} />
          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] mt-2" style={{ color: t.footerColor }}>
            <Lock className="w-3 h-3" />
            DevCollab AI can make mistakes. Verify important information.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

// ── WorkspaceAI ───────────────────────────────────────────────────────────────
export function WorkspaceAI() {
  const { theme }        = useTheme()
  const t                = aiTokens(theme === 'dark')
  const permissions      = usePermissions()
  const canAsk           = permissions.canUseAiCopilot
  const { currentUser }  = useAuth()
  const { activeWorkspaceId } = useStore()
  const { data: workspaces } = useWorkspaces()
  const activeWorkspaceObj = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0]
  const workspaceName    = activeWorkspaceObj?.name || 'Workspace'
  const workspaceId      = activeWorkspaceObj?.id
  const firstName        = currentUser?.name?.split(' ')[0] ?? ''

  const [messages, setMessages]           = useState<Message[]>([])
  const [input, setInput]                 = useState('')
  const [attachment, setAttachment]       = useState<{name: string; type: string; data: string} | null>(null)
  const [isThinking, setIsThinking]       = useState(false)
  const [focused, setFocused]             = useState(false)
  const [conversationId, setConversationId] = useState<number | undefined>()
  const [error, setError]                 = useState<string | null>(null)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [showHistory, setShowHistory]     = useState(true)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || isThinking || !canAsk || !workspaceId) return
    setInput('')
    const currentAttachment = attachment
    setAttachment(null)
    setError(null)
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: msg }])
    
    setIsThinking(true)
    let isThinkingState = true
    const streamId = 'streaming-' + Date.now()
    let streamContent = ''
    
    try {
      const generator = sendAIMessageStream({
        message: msg,
        conversationId,
        scope: 'workspace',
        scopeId: workspaceId,
        attachment: currentAttachment ?? undefined,
      })
      
      for await (const chunk of generator) {
        if (chunk.type === 'init') {
          if (!conversationId) setConversationId(chunk.conversationId)
        } else if (chunk.type === 'text') {
          if (isThinkingState) {
            setIsThinking(false)
            isThinkingState = false
            setMessages(prev => [...prev, { id: streamId, role: 'ai', content: '' }])
          }
          streamContent += chunk.content
          setMessages(prev => {
            const newMsgs = [...prev]
            const last = newMsgs[newMsgs.length - 1]
            if (last && last.id === streamId) {
              last.content = streamContent
            }
            return newMsgs
          })
        }
      }
      
      if (isThinkingState) {
        setIsThinking(false)
        if (!streamContent) {
          setMessages(prev => [...prev, { id: streamId, role: 'ai', content: 'Completed request.' }])
        }
      }
      
      setHistoryRefreshKey(k => k + 1)
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.')
      if (!isThinkingState) {
        setMessages(prev => prev.filter(m => m.id !== streamId))
      }
    } finally {
      setIsThinking(false)
    }
  }, [input, isThinking, canAsk, workspaceId, conversationId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }
  const handleSelectConversation = (convId: number) => {
    setConversationId(convId)
    setMessages([])
    // Load existing messages for this conversation
    import('../lib/ai').then(({ getAIMessages }) => {
      getAIMessages(convId).then(msgs => {
        setMessages(msgs.map(m => ({
          id: m.id.toString(),
          role: m.role === 'model' ? 'ai' : 'user',
          content: m.content,
        })))
      }).catch(() => {})
    })
  }

  const startNewChat = () => {
    setConversationId(undefined)
    setMessages([])
    setError(null)
  }

  const inputProps = {
    value: input,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value),
    onSend: () => send(),
    onKeyDown: handleKeyDown,
    focused,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    disabled: isThinking || !canAsk,
    attachment,
    onAttachmentSelect: setAttachment,
    onAttachmentClear: () => setAttachment(null),
  }

  const hasMessages = messages.length > 0

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ background: t.pageBg, fontFamily: 'var(--font-sans)' }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <div
          className="flex-shrink-0 h-12 flex items-center justify-between px-6"
          style={{ borderBottom: `1px solid ${t.topBarBorder}` }}
        >
          <div className="flex items-center gap-2">
            <AIIcon size={16} style={{ color: t.accent }} />
            <span className="text-sm font-semibold" style={{ color: t.textPrimary }}>AI Assistant</span>
          </div>
          <div className="flex items-center gap-3">
            {hasMessages && (
              <button
                onClick={startNewChat}
                className="text-xs font-medium px-3 py-1 rounded-lg transition-colors"
                style={{ color: t.accent, background: t.surface1, border: `1px solid ${t.borderWeak}` }}
              >
                + New chat
              </button>
            )}
            <span className="text-xs mr-2" style={{ color: t.textDim }}>{workspaceName}</span>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Toggle History"
            >
              {showHistory ? <PanelRightClose size={16} style={{ color: t.textDim }} /> : <PanelRightOpen size={16} style={{ color: t.textDim }} />}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!hasMessages ? (
            <motion.div key="intro" className="flex-1 flex flex-col overflow-hidden min-h-0"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <IntroHero firstName={firstName} inputProps={inputProps} onChip={send} />
            </motion.div>
          ) : (
            <motion.div key="chat" className="flex-1 flex flex-col overflow-hidden min-h-0"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 flex flex-col gap-4 min-h-0">
                {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
                {isThinking && <ThinkingSkeleton />}
                {error && (
                  <div className="text-xs px-4 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                    ⚠ {error}
                  </div>
                )}
                <div ref={endRef} />
              </div>
              <div className="flex-shrink-0 px-6 pb-5 pt-4" style={{ borderTop: `1px solid ${t.borderWeak}` }}>
                <InputWidget {...inputProps} />
                <p className="flex items-center justify-center gap-1.5 text-center text-[11px] mt-2" style={{ color: t.footerColor }}>
                  <Lock className="w-3 h-3" />
                  DevCollab AI can make mistakes. Verify important information.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showHistory && (
        <RightPanel
          workspaceId={workspaceId}
          activeConvId={conversationId}
          onSelectConversation={handleSelectConversation}
          refreshKey={historyRefreshKey}
        />
      )}
    </div>
  )
}
