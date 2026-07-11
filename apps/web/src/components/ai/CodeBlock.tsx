import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Copy } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { aiTokens } from './tokens'

// ── Regex syntax coloring — no library ──────────────────────────────────────
type TokenType = 'keyword' | 'string' | 'comment' | 'number' | 'plain'
interface Token { text: string; type: TokenType }

const KEYWORDS = new Set([
  'const','let','var','function','return','if','else','for','while',
  'import','export','default','from','class','extends','async','await',
  'new','typeof','interface','type','enum','null','undefined','true','false',
])

function tokenize(line: string): Token[] {
  const tokens: Token[] = []

  // Strip trailing comment first
  const commentIdx = line.search(/(?<!:)\/\//)
  const code = commentIdx > -1 ? line.slice(0, commentIdx) : line
  const comment = commentIdx > -1 ? line.slice(commentIdx) : ''

  // Walk character by character for strings, then keyword-split the rest
  const strRe = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
  let last = 0, m: RegExpExecArray | null

  while ((m = strRe.exec(code)) !== null) {
    if (m.index > last) tokens.push(...splitKeywords(code.slice(last, m.index)))
    tokens.push({ text: m[0], type: 'string' })
    last = m.index + m[0].length
  }
  if (last < code.length) tokens.push(...splitKeywords(code.slice(last)))
  if (comment) tokens.push({ text: comment, type: 'comment' })

  return tokens
}

function splitKeywords(text: string): Token[] {
  const tokens: Token[] = []
  const re = /\b([a-zA-Z_$][\w$]*|\d+\.?\d*)\b/g
  let last = 0, m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ text: text.slice(last, m.index), type: 'plain' })
    const isNum = /^\d/.test(m[0])
    tokens.push({ text: m[0], type: isNum ? 'number' : KEYWORDS.has(m[0]) ? 'keyword' : 'plain' })
    last = m.index + m[0].length
  }
  if (last < text.length) tokens.push({ text: text.slice(last), type: 'plain' })
  return tokens
}

const TOKEN_COLOR_DARK: Record<TokenType, string> = {
  keyword: '#e4e4e7',
  string:  '#86efac',
  comment: '#71717a',
  number:  '#fca5a5',
  plain:   '#cbd5e1',
}

const TOKEN_COLOR_LIGHT: Record<TokenType, string> = {
  keyword: '#18181b',
  string:  '#16a34a',
  comment: '#a1a1aa',
  number:  '#ef4444',
  plain:   '#3f3f46',
}

// ── Component ────────────────────────────────────────────────────────────────
interface Props { lang: string; code: string }

export function CodeBlock({ lang, code }: Props) {
  const [copied, setCopied] = useState(false)
  const lines = code.split('\n')
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const t = aiTokens(dark)
  const colors = dark ? TOKEN_COLOR_DARK : TOKEN_COLOR_LIGHT

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(code) } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      className="my-3 rounded-xl overflow-hidden"
      style={{
        background: dark ? '#04060D' : '#f4f4f5',
        border: `1px solid ${t.borderWeak}`,
        borderLeft: `2px solid ${t.accent}`,
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{
          background: t.surface2,
          borderBottom: `1px solid ${t.borderWeak}`,
        }}
      >
        <span
          className="text-xs font-medium"
          style={{ color: t.accent, fontFamily: 'var(--font-mono)' }}
        >
          {lang || 'code'}
        </span>

        <motion.button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs rounded px-2 py-1 transition-colors duration-150"
          style={{
            color: copied ? t.accent : t.textDim,
            background: copied ? t.surface1 : 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
          whileTap={{ scale: 0.94 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span key="check"
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}
              >
                <Check size={11} />
              </motion.span>
            ) : (
              <motion.span key="copy"
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}
              >
                <Copy size={11} />
              </motion.span>
            )}
          </AnimatePresence>
          {copied ? 'Copied' : 'Copy'}
        </motion.button>
      </div>

      {/* Code with line numbers */}
      <div className="overflow-x-auto" style={{ fontFamily: 'var(--font-mono)' }}>
        <table className="w-full border-collapse" style={{ fontSize: '12.5px', lineHeight: '1.85' }}>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}>
                <td
                  className="text-right select-none"
                  style={{
                    color: t.textMuted,
                    paddingLeft: 16,
                    paddingRight: 14,
                    paddingTop: i === 0 ? 12 : 0,
                    paddingBottom: i === lines.length - 1 ? 12 : 0,
                    verticalAlign: 'top',
                    width: '1%',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {i + 1}
                </td>
                <td
                  style={{
                    whiteSpace: 'pre',
                    paddingRight: 20,
                    paddingTop: i === 0 ? 12 : 0,
                    paddingBottom: i === lines.length - 1 ? 12 : 0,
                    verticalAlign: 'top',
                  }}
                >
                  {tokenize(line).map((t, ti) => (
                    <span key={ti} style={{ color: colors[t.type] }}>{t.text}</span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
