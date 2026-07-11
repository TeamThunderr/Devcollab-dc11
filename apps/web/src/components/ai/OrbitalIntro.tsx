import { motion } from 'framer-motion'

const SUGGESTIONS = [
  'Summarize sprint progress',
  'Who owns authentication?',
  'What changed today?',
  'Find related snippets',
]

interface Props {
  projectName: string
  onSuggest: (text: string) => void
}

export function OrbitalIntro({ projectName, onSuggest }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 select-none">
      <ActivityGraph />

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35, ease: 'easeOut' }}
        className="text-2xl font-semibold tracking-tight mb-2.5"
        style={{ color: '#e8eaed', fontFamily: 'var(--font-sans)' }}
      >
        Ask anything about{' '}
        <span style={{ color: '#818CF8' }}>{projectName}</span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.35 }}
        className="text-sm text-center max-w-xs mb-8"
        style={{ color: '#5c6577', lineHeight: 1.6 }}
      >
        Full context — tasks, members, snippets, and wiki pages.
      </motion.p>

      <div className="flex flex-wrap gap-2 justify-center max-w-md">
        {SUGGESTIONS.map((text, i) => (
          <motion.button
            key={text}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 + i * 0.05, duration: 0.22, ease: 'easeOut' }}
            whileHover={{ y: -1 }}
            onClick={() => onSuggest(text)}
            className="px-3.5 py-1.5 text-sm rounded-full transition-all duration-150"
            style={{
              background: 'rgba(129,140,248,0.06)',
              border: '1px solid rgba(129,140,248,0.2)',
              color: '#9aa3b2',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(129,140,248,0.45)'
              e.currentTarget.style.color = '#e8eaed'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(129,140,248,0.2)'
              e.currentTarget.style.color = '#9aa3b2'
            }}
          >
            {text}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// Slow-drawing SVG activity graph — project activity, not a spinning orb
function ActivityGraph() {
  return (
    <div className="relative mb-10" style={{ width: 260, height: 110 }}>
      <svg viewBox="0 0 260 110" fill="none" className="w-full h-full">
        {/* Subtle grid */}
        {[28, 56, 84].map(y => (
          <line key={y} x1="0" y1={y} x2="260" y2={y}
            stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        ))}

        {/* Secondary line — dimmer */}
        <motion.path
          d="M0,90 C30,86 55,80 85,74 C115,68 135,82 165,77 C190,73 215,65 260,69"
          stroke="rgba(129,140,248,0.25)"
          strokeWidth="1"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, ease: 'easeInOut', delay: 0.5 }}
        />

        {/* Primary line — accent */}
        <motion.path
          d="M0,75 C22,70 42,52 64,47 C86,42 106,62 128,57 C150,52 170,28 192,33 C210,37 232,42 260,36"
          stroke="#818CF8"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.6, ease: 'easeInOut', delay: 0.1 }}
        />

        {/* Fill under primary line */}
        <motion.path
          d="M0,75 C22,70 42,52 64,47 C86,42 106,62 128,57 C150,52 170,28 192,33 C210,37 232,42 260,36 L260,110 L0,110 Z"
          fill="url(#grad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
        />

        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Live endpoint dot */}
        <motion.circle cx="260" cy="36" r="3" fill="#818CF8"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 2.7, duration: 0.25 }}
        />

        {/* Pulse ring — repeating */}
        <motion.circle cx="260" cy="36" r="3" fill="none"
          stroke="#818CF8" strokeWidth="1"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 3.5, opacity: 0 }}
          transition={{ delay: 3, duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
      </svg>
    </div>
  )
}
