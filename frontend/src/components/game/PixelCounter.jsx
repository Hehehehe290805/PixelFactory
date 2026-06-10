import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'

export default function PixelCounter({ requiredOutput }) {
  const { totalPixelsProduced, pixelsSpent, currentPxPerSecond, gamePaused } = useGameStore()
  const remaining = Math.max(0, requiredOutput - totalPixelsProduced)
  const progress  = Math.min(1, totalPixelsProduced / requiredOutput)

  // Sync float interval to production rate so it matches block wave animation timing.
  // Tiered to avoid restarting the interval every 100ms tick.
  const floatInterval = currentPxPerSecond > 4 ? 300
    : currentPxPerSecond > 2 ? 500
    : currentPxPerSecond > 0.5 ? 1000
    : 1500

  const [floatKey, setFloatKey] = useState(0)
  useEffect(() => {
    if (gamePaused || currentPxPerSecond <= 0.05) return
    const t = setInterval(() => setFloatKey(k => k + 1), floatInterval)
    return () => clearInterval(t)
  }, [gamePaused, floatInterval])

  return (
    <div className="card">
      <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Output</h3>

      {/* px/s + floating number */}
      <div className="relative mb-4 text-center" style={{ height: 72 }}>
        <div className="text-5xl font-black text-pixel-blue leading-none">
          {currentPxPerSecond.toFixed(1)}
        </div>
        <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mt-1">px / sec</div>

        <AnimatePresence mode="popLayout">
          {currentPxPerSecond > 0.05 && (
            <motion.div
              key={floatKey}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -44, scale: 0.85 }}
              exit={{}}
              transition={{ duration: 1.0, ease: 'easeOut' }}
              className="absolute left-1/2 font-black text-pixel-green pointer-events-none select-none"
              style={{ top: 0, transform: 'translateX(-50%)', fontSize: 13, whiteSpace: 'nowrap' }}
            >
              +{Math.max(0.1, currentPxPerSecond).toFixed(1)} px
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="progress-track mb-4">
        <div
          className="progress-fill"
          style={{ width: `${progress * 100}%`, backgroundColor: progress >= 1 ? '#00d49a' : '#1499cc' }}
        />
      </div>

      <div className="space-y-2">
        <Row label="Total"     value={Math.floor(totalPixelsProduced).toLocaleString()} />
        <Row label="Remaining" value={Math.ceil(remaining).toLocaleString()} accent={remaining === 0 ? 'text-pixel-green' : 'text-white'} />
        <Row label="Spent"     value={pixelsSpent.toLocaleString()} accent="text-gray-500" />
      </div>
    </div>
  )
}

function Row({ label, value, accent = 'text-white' }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-black font-mono ${accent}`}>{value}</span>
    </div>
  )
}
