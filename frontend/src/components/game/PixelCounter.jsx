import { useGameStore } from '../../store/gameStore'

export default function PixelCounter({ requiredOutput }) {
  const { totalPixelsProduced, pixelsSpentInShop: pixelsSpent, currentPxPerSecond } = useGameStore()
  const remaining = Math.max(0, requiredOutput - totalPixelsProduced)
  const progress  = Math.min(1, totalPixelsProduced / requiredOutput)

  return (
    <div className="card">
      <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Output</h3>

      {/* px/s */}
      <div className="mb-4 text-center">
        <div className="text-5xl font-black text-pixel-blue leading-none">
          {currentPxPerSecond.toFixed(1)}
        </div>
        <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mt-1">px / sec</div>
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
