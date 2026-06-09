import { useGameStore } from '../../store/gameStore'

export default function PixelCounter({ requiredOutput }) {
  const { totalPixelsProduced, pixelsSpent, currentPxPerSecond } = useGameStore()
  const remaining = Math.max(0, requiredOutput - totalPixelsProduced)

  return (
    <div className="bg-game-card border border-game-border rounded-xl p-3">
      <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Stats</h3>

      <div className="space-y-2">
        <StatRow
          label="px / sec"
          value={currentPxPerSecond.toFixed(1)}
          accent="text-pixel-blue"
        />
        <StatRow
          label="Total produced"
          value={Math.floor(totalPixelsProduced).toLocaleString()}
        />
        <StatRow
          label="Remaining"
          value={Math.ceil(remaining).toLocaleString()}
          accent={remaining === 0 ? 'text-pixel-green' : 'text-white'}
        />
        <StatRow
          label="Pixels spent"
          value={pixelsSpent.toLocaleString()}
          accent="text-gray-500"
        />
      </div>
    </div>
  )
}

function StatRow({ label, value, accent = 'text-white' }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-semibold font-mono ${accent}`}>{value}</span>
    </div>
  )
}
