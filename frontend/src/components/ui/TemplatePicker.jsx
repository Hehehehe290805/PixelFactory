import { motion } from 'framer-motion'
import { useUserStore } from '../../store/userStore'
import { useGameStore } from '../../store/gameStore'
import { OFFICIAL_TEMPLATES } from '../../lib/officialTemplates'
import { PIXEL_COLORS, BLOCK_CANVAS_SIZE } from '../../lib/constants'

const CELL = 4  // preview cell size in pixels

function TemplateThumb({ pixelLayout }) {
  const size = BLOCK_CANVAS_SIZE * CELL
  return (
    <div
      className="rounded overflow-hidden flex-shrink-0 border border-game-border"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${BLOCK_CANVAS_SIZE}, ${CELL}px)`,
        width: size, height: size,
        imageRendering: 'pixelated',
      }}
    >
      {Array.from({ length: BLOCK_CANVAS_SIZE }, (_, r) =>
        Array.from({ length: BLOCK_CANVAS_SIZE }, (_, c) => (
          <div
            key={`${r}-${c}`}
            style={{ backgroundColor: PIXEL_COLORS[pixelLayout[r]?.[c]]?.hex ?? '#0a0a18' }}
          />
        ))
      )}
    </div>
  )
}

export default function TemplatePicker({ blockId, onPick, onBlank, onClose }) {
  const { templates, discoveredSets } = useUserStore()
  const { pixelInventory } = useGameStore()

  function applyTemplate(layout) {
    // Count pixels in the template that we can afford
    const costs = {}
    for (const row of layout) {
      for (const color of row) {
        if (color) costs[color] = (costs[color] ?? 0) + 1
      }
    }
    // Check if player has enough of each color
    const canAfford = Object.entries(costs).every(
      ([c, n]) => (pixelInventory[c] ?? 0) >= n
    )
    if (!canAfford) return false
    onPick(layout)
    return true
  }

  const allTemplates = [
    ...OFFICIAL_TEMPLATES.filter(t => discoveredSets.has(t.set_type)),
    ...templates,
  ]

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card w-full max-w-sm"
        style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-lg font-black text-white pixel-heading">Choose Design</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-sm transition">✕</button>
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto">
          {allTemplates.length === 0 ? (
            <p className="text-xs font-semibold text-gray-600 italic text-center py-4">
              No templates yet — discover sets in-level to unlock them!
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {allTemplates.map(t => {
                const costs = {}
                for (const row of t.pixel_layout) for (const c of row) if (c) costs[c] = (costs[c] ?? 0) + 1
                const canAfford = Object.entries(costs).every(([c, n]) => (pixelInventory[c] ?? 0) >= n)

                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (canAfford) applyTemplate(t.pixel_layout)
                    }}
                    disabled={!canAfford}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 transition
                      ${canAfford ? 'border-game-border hover:border-pixel-blue cursor-pointer' : 'border-game-border opacity-35 cursor-not-allowed'}`}
                    style={{ background: '#0d0d22' }}
                  >
                    <TemplateThumb pixelLayout={t.pixel_layout} />
                    <span className="text-xs font-black text-gray-300 leading-tight text-center truncate w-full">{t.name}</span>
                    {!canAfford && <span className="text-xs font-bold text-red-400" style={{ fontSize: 8 }}>Need pixels</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Start blank */}
        <button
          onClick={onBlank}
          className="btn btn-secondary w-full text-sm mt-3 flex-shrink-0"
        >
          Start Blank
        </button>
      </motion.div>
    </div>
  )
}
