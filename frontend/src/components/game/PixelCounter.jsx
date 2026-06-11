import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/gameStore'

export default function PixelCounter({ requiredOutput, totalLabel = 'Total', preLevelBonus = 0 }) {
  const { totalPixelsProduced, pixelsSpentInShop: pixelsSpent, currentPxPerSecond } = useGameStore()
  const remaining = Math.max(0, requiredOutput - totalPixelsProduced)
  const progress  = Math.min(1, totalPixelsProduced / requiredOutput)
  const complete  = progress >= 1

  const prevRef       = useRef(totalPixelsProduced)
  const lastFloatTime = useRef(0)
  const [floats, setFloats] = useState([])

  useEffect(() => {
    if (totalPixelsProduced === 0) { prevRef.current = 0; lastFloatTime.current = 0; return }
    const diff = totalPixelsProduced - prevRef.current
    if (diff < 1) return
    const now = Date.now()
    if (now - lastFloatTime.current < 800) return
    prevRef.current = totalPixelsProduced
    lastFloatTime.current = now
    const id = now + Math.random()
    setFloats(f => [...f.slice(-3), { id, amount: Math.floor(diff) }])
    setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 1100)
  }, [totalPixelsProduced])

  return (
    <div
      data-tutorial="pixel-counter"
      className="card relative"
      style={complete ? { boxShadow: 'var(--glow-green)', borderColor: '#34d39966' } : undefined}
    >
      <div className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: '#3c3c72' }}>Output</div>

      {/* px/s hero number */}
      <div className="mb-4 text-center relative" style={{ minHeight: 72 }}>
        <div
          className="text-5xl font-black leading-none"
          style={{
            color: complete ? '#34d399' : '#6366f1',
            textShadow: currentPxPerSecond > 0 ? (complete ? 'var(--glow-green)' : 'var(--glow-indigo)') : 'none',
          }}
        >
          {currentPxPerSecond.toFixed(1)}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: '#3c3c72' }}>px / sec</div>

        {/* Floating +N */}
        <div className="absolute inset-0 pointer-events-none" style={{ top: -8, overflow: 'visible' }}>
          {floats.map(f => (
            <span
              key={f.id}
              className="absolute left-1/2 font-black"
              style={{
                fontSize: 15,
                color: '#34d399',
                textShadow: '0 0 8px rgba(52,211,153,0.6)',
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
          className={`progress-fill ${complete ? 'progress-fill-complete' : ''}`}
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      <div className="space-y-1.5">
        <Row label={totalLabel} value={Math.floor(totalPixelsProduced).toLocaleString()} color={complete ? '#34d399' : '#ddd8f8'} />
        <Row label="Target"    value={requiredOutput.toLocaleString()} color="#7b78a8" />
        <Row label="Remaining" value={Math.ceil(remaining).toLocaleString()} color={remaining === 0 ? '#34d399' : '#ddd8f8'} />
        <Row label="Spent"     value={pixelsSpent.toLocaleString()} color="#3c3c72" />
        {preLevelBonus > 0 && (
          <Row label="Bonus"   value={`+${preLevelBonus.toLocaleString()}`} color="#fbbf24" />
        )}
      </div>
    </div>
  )
}

function Row({ label, value, color = '#ddd8f8' }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#3c3c72' }}>{label}</span>
      <span className="text-sm font-black font-mono" style={{ color }}>{value}</span>
    </div>
  )
}
