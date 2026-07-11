import { motion } from 'framer-motion'
import { Paperclip } from 'lucide-react'
import { CodeBlock } from './CodeBlock'
import { useTheme } from '../../hooks/useTheme'
import { aiTokens } from './tokens'
import { AIIcon } from './AIIcon'

export interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp?: Date
  attachment?: { name: string; type: string; data: string }
}

// ── Content parser — handles multiple code blocks ──────────────────────────
type Segment =
  | { type: 'text'; content: string }
  | { type: 'code'; lang: string; content: string }

function parseContent(raw: string): Segment[] {
  const segments: Segment[] = []
  const re = /```(\w*)\n?([\s\S]*?)```/g
  let last = 0, m: RegExpExecArray | null

  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) segments.push({ type: 'text', content: raw.slice(last, m.index) })
    segments.push({ type: 'code', lang: m[1] || 'code', content: (m[2] ?? '').trimEnd() })
    last = m.index + m[0].length
  }
  if (last < raw.length) segments.push({ type: 'text', content: raw.slice(last) })
  return segments
}

// ── Inline text renderer — **bold**, - bullets ─────────────────────────────
function renderText(text: string, accentColor: string) {
  return text.split('\n').map((line, li) => {
    if (!line.trim()) return <div key={li} className="h-2" />

    const bullet = line.trim().startsWith('- ')
    const body = bullet ? line.trim().slice(2) : line

    const parts = body.split(/(\*\*[^*]+\*\*)/g).map((p, pi) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={pi} style={{ color: accentColor, fontWeight: 600 }}>{p.slice(2, -2)}</strong>
        : <span key={pi}>{p}</span>
    )

    return bullet ? (
      <div key={li} className="flex gap-2 my-0.5">
        <span style={{ color: accentColor, flexShrink: 0, marginTop: 2 }}>▸</span>
        <span>{parts}</span>
      </div>
    ) : (
      <p key={li} className="my-0.5">{parts}</p>
    )
  })
}

// ── Component ──────────────────────────────────────────────────────────────
export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const segments = parseContent(message.content)
  const { theme } = useTheme()
  const t = aiTokens(theme === 'dark')

  return (
    <motion.div
      className={`flex gap-2.5 items-start ${isUser ? 'flex-row-reverse' : ''}`}
      initial={{ opacity: 0, y: 10, scale: 0.98, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} // smooth custom spring-like ease
    >
      {/* Avatar */}
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5"
        style={{
          background: t.accentGrad,
          border: `1px solid ${t.accentBorder}`,
          color: t.accent,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {isUser ? 'S' : <AIIcon size={12} />}
      </div>

      {/* Bubble */}
      <div
        className="max-w-[80%] px-4 py-3 text-sm flex flex-col gap-2 relative"
        style={{
          background: isUser
            ? t.surface2
            : t.surface1,
          border: `1px solid ${isUser
            ? t.borderStrong
            : t.borderWeak}`,
          borderRadius: isUser
            ? '16px 4px 16px 16px'
            : '4px 16px 16px 16px',
          color: t.textPrimary,
          lineHeight: 1.7,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {message.attachment && (
          <div className="mb-1">
            {message.attachment.type.startsWith('image/') ? (
              <img src={message.attachment.data} alt={message.attachment.name} className="max-w-full sm:max-w-sm rounded-lg" style={{ border: `1px solid ${t.borderWeak}` }} />
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: t.surface1, border: `1px solid ${t.borderWeak}` }}>
                <Paperclip className="w-4 h-4 text-current" />
                <span className="truncate max-w-[200px]">{message.attachment.name}</span>
              </div>
            )}
          </div>
        )}
        <div>
          {segments.map((seg, i) =>
            seg.type === 'code'
              ? <CodeBlock key={i} lang={seg.lang} code={seg.content} />
              : <div key={i}>{renderText(seg.content, t.accent)}</div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
