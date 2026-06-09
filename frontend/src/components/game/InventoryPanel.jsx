import { useGameStore } from '../../store/gameStore'
import { useGridCellSize } from '../../hooks/useGridCellSize'
import Block from './Block'
import { PIXEL_COLORS } from '../../lib/constants'

const SET_COLORS = {
  PRIMARY: '#f03e4e', MIDNIGHT: '#a066f0', PHILIPPINES: '#ffd166',
  GRASS: '#00d49a', SUNSET: '#f59342',
  SILVER_MIST: '#9db4cc', NEON_RUSH: '#39ff14', AURORA: '#a0c4ff',
  SUNRISE: '#ffc000', OCEAN: '#1499cc', FIRE: '#f03e4e',
  ROYAL: '#a066f0', EMBER: '#f59342', TROPICS: '#00d49a', CORAL: '#f03e4e',
}

export default function InventoryPanel({ selectedBlockId, onBlockSelect }) {
  const { inventory, pixelInventory } = useGameStore()
  const cellSize = useGridCellSize()
  const blockSize = Math.min(cellSize + 8, 64)

  return (
    <div
      className="flex flex-col flex-shrink-0 border-t-2 border-game-border"
      style={{ background: '#0a0a1e', minHeight: 180 }}
    >
      {/* Header row */}
      <div
        className="flex items-center px-3 py-1 border-b border-game-border flex-shrink-0"
        style={{ background: '#111128' }}
      >
        <span className="text-xs font-black uppercase tracking-widest text-gray-500">Inventory</span>
        <div className="ml-auto flex flex-wrap gap-1">
          {Object.entries(PIXEL_COLORS).map(([key, meta]) => {
            const n = pixelInventory[key] ?? 0
            if (!n) return null
            return (
              <div
                key={key}
                className="flex items-center gap-1 rounded-lg border px-1.5 py-0.5"
                style={{ backgroundColor: meta.hex + '18', borderColor: meta.hex + '55' }}
              >
                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: meta.hex }} />
                <span className="text-xs font-black font-mono" style={{ color: meta.hex }}>{n}</span>
              </div>
            )
          })}
          {Object.values(pixelInventory).every(n => !n) && (
            <span className="text-xs font-semibold text-gray-700 italic">No pixels</span>
          )}
        </div>
      </div>

      {/* Block strip — horizontally scrollable */}
      <div className="flex gap-2 overflow-x-auto px-2 py-2 flex-1 items-center">
        {inventory.length === 0 && (
          <span className="text-xs font-semibold text-gray-600 italic flex-shrink-0">All blocks placed</span>
        )}
        {inventory.map(block => {
          const selected = block.id === selectedBlockId
          return (
            <div
              key={block.id}
              draggable
              onDragStart={e =>
                e.dataTransfer.setData('application/json', JSON.stringify({ source: 'inventory', blockId: block.id }))
              }
              onClick={() => onBlockSelect(selected ? null : block.id)}
              className="flex-shrink-0 flex flex-col items-center gap-1 rounded-xl border-2 cursor-pointer transition-all p-1.5"
              style={{
                background:  selected ? 'rgba(20,153,204,0.12)' : '#111128',
                borderColor: selected ? '#1499cc' : '#36366a',
                minWidth: blockSize + 20,
              }}
            >
              <div
                className="rounded-lg overflow-hidden border-2 flex-shrink-0"
                style={{ borderColor: selected ? '#1499cc55' : '#36366a' }}
              >
                <Block block={block} size={blockSize} />
              </div>
              <div className="text-center" style={{ maxWidth: blockSize + 14 }}>
                <div className="text-xs font-black text-gray-300 capitalize leading-tight truncate">
                  {block.type.replace(/_/g, ' ')}
                </div>
                <div className="text-xs font-bold text-gray-600 leading-tight">{block.pixelCount}px</div>
                {block.activeSet && (
                  <div className="text-xs font-black leading-tight truncate" style={{ color: SET_COLORS[block.activeSet] ?? '#aaa' }}>
                    {block.activeSet}
                  </div>
                )}
                {block.type === 'focus' && block.focusColor && (
                  <div className="text-xs font-bold" style={{ color: PIXEL_COLORS[block.focusColor]?.hex ?? '#aaa' }}>
                    {block.focusColor}
                  </div>
                )}
                {block.type === 'color_checker' && block.colorCheckerColor && !block.colorCheckerTriggered && (
                  <div className="text-xs font-bold" style={{ color: PIXEL_COLORS[block.colorCheckerColor]?.hex ?? '#aaa' }}>
                    {block.colorCheckerColor}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
