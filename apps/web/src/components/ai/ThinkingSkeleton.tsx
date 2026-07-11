import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../hooks/useTheme'
import { aiTokens } from './tokens'
import { Cpu, Database, Search, Sparkles, Network } from 'lucide-react'

// ── Skeleton phase: Premium Shimmer bubbles ────────────────────────────────────
function ShimmerBar({ width, delay = 0, shimmerGrad }: { width: string; delay?: number; shimmerGrad: string }) {
  return (
    <div
      style={{
        width,
        height: 12,
        borderRadius: 6,
        backgroundImage: shimmerGrad,
        backgroundSize: '200% 100%',
        animation: `dc-shimmer 2s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s infinite`,
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
      }}
    />
  )
}

function SkeletonBubble({
  bars,
  delay = 0,
  t,
}: {
  bars: { width: string; rowDelay?: number }[]
  delay?: number
  t: ReturnType<typeof aiTokens>
}) {
  return (
    <motion.div
      className="flex items-start gap-3"
      initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
    >
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5 relative overflow-hidden"
        style={{
          background: t.skeletonAvatarBg,
          boxShadow: `0 0 10px ${t.accent}20`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: t.shimmerGrad,
            backgroundSize: '200% 100%',
            animation: 'dc-shimmer 2s infinite',
            opacity: 0.4
          }}
        />
      </div>
      <div className="flex flex-col gap-2.5 max-w-[70%] w-full pt-1">
        {bars.map((b, i) => (
          <ShimmerBar
            key={i}
            width={b.width}
            delay={b.rowDelay ?? i * 0.1}
            shimmerGrad={t.shimmerGrad}
          />
        ))}
      </div>
    </motion.div>
  )
}

function SkeletonPhase({ t }: { t: ReturnType<typeof aiTokens> }) {
  return (
    <motion.div
      key="skeleton"
      className="flex flex-col gap-6 w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, filter: 'blur(2px)' }}
      transition={{ duration: 0.2 }}
    >
      <style>{`
        @keyframes dc-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>
      <SkeletonBubble delay={0}    bars={[{ width: '85%' }, { width: '65%' }]} t={t} />
      <SkeletonBubble delay={0.12} bars={[{ width: '92%' }, { width: '70%', rowDelay: 0.1 }, { width: '45%', rowDelay: 0.2 }]} t={t} />
      <SkeletonBubble delay={0.24} bars={[{ width: '58%' }]} t={t} />
    </motion.div>
  )
}

// ── Thinking phase: Dynamic and Premium Processing Indicator ──────────────────
const AI_PROCESSES = [
  { text: 'Initializing context engine...', icon: Cpu },
  { text: 'Scanning workspace structure...', icon: Database },
  { text: 'Analyzing semantic relations...', icon: Network },
  { text: 'Extracting project insights...', icon: Search },
  { text: 'Synthesizing optimal response...', icon: Sparkles },
]

function ThinkingPhase({ t, isDark }: { t: ReturnType<typeof aiTokens>; isDark: boolean }) {
  const [activeProcess, setActiveProcess] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveProcess(prev => (prev < AI_PROCESSES.length - 1 ? prev + 1 : prev))
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  const CurrentIcon = AI_PROCESSES[activeProcess]?.icon || Cpu

  return (
    <motion.div
      key="thinking"
      className="flex items-start gap-3 w-full"
      initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 relative z-10"
        style={{
          background: `linear-gradient(135deg, ${t.surface2}, ${t.surface1})`,
          border: `1px solid ${t.accent}40`,
          boxShadow: `0 0 15px ${t.accent}30, inset 0 0 8px ${t.accent}20`,
        }}
        animate={{ 
          rotate: [0, 360],
          boxShadow: [`0 0 15px ${t.accent}30`, `0 0 25px ${t.accent}60`, `0 0 15px ${t.accent}30`]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      >
        <Sparkles className="w-3.5 h-3.5" style={{ color: t.accent }} />
      </motion.div>

      {/* Advanced Glassmorphic Bubble */}
      <div className="relative group max-w-[80%]">
        {/* Animated Gradient Border Layer */}
        <motion.div 
          className="absolute -inset-[1px] rounded-[4px_16px_16px_16px] opacity-70 group-hover:opacity-100 transition-opacity"
          style={{
            background: `linear-gradient(90deg, ${t.accent}00, ${t.accent}80, ${t.accent}00)`,
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Core Bubble Content */}
        <div
          className="relative overflow-hidden flex flex-col gap-3"
          style={{
            borderRadius: '4px 15px 15px 15px',
            background: isDark ? 'rgba(20, 20, 20, 0.7)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}`,
            padding: '12px 18px',
            minWidth: 260,
          }}
        >
          {/* Subtle scanning line effect */}
          <motion.div 
            className="absolute top-0 bottom-0 w-[200%] opacity-20 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${t.accent}, transparent)`,
              transform: 'skewX(-20deg)',
            }}
            animate={{ left: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="flex flex-col gap-1.5 z-10">
            <div className="flex items-center gap-2 mb-1">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <CurrentIcon className="w-3.5 h-3.5" style={{ color: t.accent }} />
              </motion.div>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: t.accent }}>
                AI Processing
              </span>
            </div>

            <div className="relative h-5">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={activeProcess}
                  initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="absolute inset-0 flex items-center"
                >
                  <span
                    className="text-sm font-medium tracking-wide"
                    style={{ 
                      color: t.textPrimary,
                      textShadow: isDark ? `0 0 10px ${t.accent}30` : 'none'
                    }}
                  >
                    {AI_PROCESSES[activeProcess]?.text}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Progress Track */}
            <div className="w-full h-1 mt-1 rounded-full overflow-hidden" style={{ background: t.surface2 }}>
              <motion.div 
                className="h-full rounded-full"
                style={{ 
                  background: `linear-gradient(90deg, ${t.accent}80, ${t.accent})`,
                  boxShadow: `0 0 8px ${t.accent}80`
                }}
                initial={{ width: '0%' }}
                animate={{ width: `${((activeProcess + 1) / AI_PROCESSES.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────
// Phase 1 (0–600ms): Premium Shimmer Skeleton
// Phase 2 (600ms+):  Advanced AI Processing Indicator
export function ThinkingSkeleton() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const t = aiTokens(isDark)
  const [phase, setPhase] = useState<'skeleton' | 'thinking'>('skeleton')

  useEffect(() => {
    const timer = setTimeout(() => setPhase('thinking'), 600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence mode="wait">
      {phase === 'skeleton' ? (
        <SkeletonPhase key="skeleton" t={t} />
      ) : (
        <ThinkingPhase key="thinking" t={t} isDark={isDark} />
      )}
    </AnimatePresence>
  )
}
