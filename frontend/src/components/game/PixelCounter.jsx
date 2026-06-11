import { useGameStore } from '../../store/gameStore'

export default function PixelCounter({ requiredOutput, totalLabel = 'Total', preLevelBonus = 0 }) {
  const { totalPixelsProduced, pixelsSpentInShop: pixelsSpent, currentPxPerSecond } = useGameStore()
  const remaining = Math.max(0, requiredOutput - totalPixelsProduced)
  const progress  = Math.min(1, totalPixelsProduced / requiredOutput)
  const complete  = progress >= 1

  return (
    <div
      data-tutorial="pixel-counter"
      className="card relative"
      style={complete ? { boxShadow: 'var(--glow-green)', borderColor: '#34d39966' } : undefined}
    >
      <div className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: '#3c3c72' }}>Output</div>

      {/* px/s hero number */}
      <div className="mb-4 text-center" style={{ minHeight: 56 }}>
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
