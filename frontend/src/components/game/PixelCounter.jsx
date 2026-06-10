import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/gameStore'

export default function PixelCounter({ requiredOutput, totalLabel = 'Total' }) {
  const { totalPixelsProduced, pixelsSpentInShop: pixelsSpent, currentPxPerSecond } = useGameStore()
  const remaining = Math.max(0, requiredOutput - totalPixelsProduced)
  const progress  = Math.min(1, totalPixelsProduced / requiredOutput)

  // Floating +N animation — throttled to one float per ~800ms so they don't pile up
  const prevRef       = useRef(totalPixelsProduced)
  const lastFloatTime = useRef(0)
  const [floats, setFloats] = useState([])

  useEffect(() => {
    const diff = totalPixelsProduced - prevRef.current
    prevRef.current = totalPixelsProduced
    if (diff < 1) return
    const now = Date.now()
    if (now - lastFloatTime.current < 800) return
    lastFloatTime.current = now
    const id = now + Math.random()
    setFloats(f => [...f.slice(-3), { id, amount: Math.floor(diff) }])
    // No cleanup return — letting the timeout fire naturally so it's never cancelled
    setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 1100)
  }, [totalPixelsProduced])

  return (
    <div className="card relative">
      <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Output</h3>

      {/* px/s with floating +N overlays */}
      <div className="mb-4 text-center relative" style={{ minHeight: 72 }}>
        <div className="text-5xl font-black text-pixel-blue leading-none">
          {currentPxPerSecond.toFixed(1)}
        </div>
        <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mt-1">px / sec</div>

        {/* Floating number animations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ top: -8 }}>
          {floats.map(f => (
            <span
              key={f.id}
              className="absolute left-1/2 font-black text-sm text-pixel-green"
              style={{
                transform: 'translateX(-50%)',
                bottom: '100%',
                animation: 'floatUp 1.1s ease-out forwards',
                whiteSpace: 'nowrap',
              }}
            >
              +{f.amount >= 1000 ? `${(f.amount / 1000).toFixed(1)}k` : f.amount}
            </span>
          ))}
        </div>
      </div>

      <div className="progress-track mb-4">
        <div
          className="progress-fill"
          style={{ width: `${progress * 100}%`, backgroundColor: progress >= 1 ? '#00d49a' : '#1499cc' }}
        />
      </div>

      <div className="space-y-2">
        <Row label={totalLabel} value={Math.floor(totalPixelsProduced).toLocaleString()} />
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
