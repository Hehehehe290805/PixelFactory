import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { useGridCellSize } from '../../hooks/useGridCellSize'
import Block from './Block'
import { PIXEL_COLORS } from '../../lib/constants'

const SET_COLORS = {
  PRIMARY: '#f03e4e', MIDNIGHT: '#a066f0', PHILIPPINES: '#ffd166',
  GRASS: '#00d49a', SUNSET: '#f59342',
  SILVER_MIST: '#9db4cc', NEON_RUSH: '#39ff14', AURORA: '#a0c4ff',
  SUNRISE: '#ffc000', OCEAN: '#1499cc', FIRE: '#f03e4e',
  ROYAL: '#a066f0', EMBER: '#f59342', TROPICS: '#00d49a', CORAL: '#f87171',
}

export default function InventoryPanel({ selectedBlockId, onBlockSelect }) {
  const { inventory, pixelInventory } = useGameStore()
  const cellSize = useGridCellSize()
  const blockSize = Math.min(cellSize, 56)
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex-shrink-0">

      {/* ── Collapsed handle — always visible at the very bottom ── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 border-t-2 border-game-border select-none"
        style={{ height: 44, background: '#111128', cursor: 'pointer' }}
      >
        {/* Label + count */}
        <span className="text-xs font-black uppercase tracking-widest text-gray-500 flex-shrink-0">
          Inventory
        </span>
        <span className="text-xs font-bold text-gray-700 flex-shrink-0">
          {inventory.length} block{inventory.length !== 1 ? 's' : ''}
        </span>

        {/* Pixel counts — fills remaining space, truncates gracefully */}
        <div className="flex-1 flex flex-wrap gap-1 overflow-hidden justify-end">
          {Object.entries(PIXEL_COLORS).map(([key, meta]) => {
            const n = pixelInventory[key] ?? 0
            if (!n) return null
            return (
              <div
                key={key}
                className="flex items-center gap-0.5 rounded-lg border px-1.5 py-0.5 flex-shrink-0"
                style={{ backgroundColor: meta.hex + '18', borderColor: meta.hex + '55' }}
              >
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: meta.hex }} />
                <span className="text-xs font-black font-mono" style={{ color: meta.hex }}>{n}</span>
              </div>
            )
          })}
          {Object.values(pixelInventory).every(n => !n) && (
            <span className="text-xs font-semibold text-gray-700 italic">No pixels</span>
          )}
        </div>

        {/* Chevron — points up when panel is open */}
        <motion.span
          animate={{ rotate: open ? 0 : 180 }}
          transition={{ duration: 0.18 }}
          className="text-gray-600 text-xs flex-shrink-0 font-black"
        >
          ▲
        </motion.span>
      </button>

      {/* ── Expanded block grid — slides up, overlays the grid above ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 264, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            className="absolute bottom-full left-0 right-0 z-20 overflow-hidden border-t-2 border-game-border"
            style={{ background: '#0a0a1e' }}
          >
            <div className="overflow-y-auto h-full px-2 py-2">
              {inventory.length === 0 ? (
                <p className="text-xs font-semibold text-gray-600 italic text-center py-8">
                  All blocks are on the grid
                </p>
              ) : (
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${blockSize + 28}px, 1fr))` }}
                >
                  {inventory.map(block => {
                    const selected = block.id === selectedBlockId
                    return (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData('application/json', JSON.stringify({ source: 'inventory', blockId: block.id }))
                          setOpen(false) // close so the grid is visible for the drop
                        }}
                        onClick={() => {
                          onBlockSelect(selected ? null : block.id)
                          setOpen(false)
                        }}
                        className="flex flex-col items-center gap-1.5 rounded-xl border-2 cursor-pointer transition-all p-2"
                        style={{
                          background:  selected ? 'rgba(20,153,204,0.12)' : '#111128',
                          borderColor: selected ? '#1499cc' : '#36366a',
                          boxShadow:   selected ? '0 0 0 1px #1499cc44' : undefined,
                        }}
                      >
                        <div
                          className="rounded-lg overflow-hidden border-2 flex-shrink-0"
                          style={{ borderColor: selected ? '#1499cc55' : '#36366a' }}
                        >
                          <Block block={block} size={blockSize} />
                        </div>
                        <div className="text-center w-full">
                          <div className="text-xs font-black text-gray-300 capitalize leading-tight truncate">
                            {block.type.replace(/_/g, ' ')}
                          </div>
                          <div className="text-xs font-bold text-gray-600 leading-tight">{block.pixelCount}px</div>
                          {block.activeSet && (
                            <div className="text-xs font-black leading-tight truncate"
                              style={{ color: SET_COLORS[block.activeSet] ?? '#aaa', fontSize: 9 }}>
                              {block.activeSet}
                            </div>
                          )}
                          {block.type === 'focus' && block.focusColor && (
                            <div className="text-xs font-bold" style={{ color: PIXEL_COLORS[block.focusColor]?.hex ?? '#aaa', fontSize: 9 }}>
                              {block.focusColor}
                            </div>
                          )}
                          {block.type === 'color_checker' && block.colorCheckerColor && !block.colorCheckerTriggered && (
                            <div className="text-xs font-bold" style={{ color: PIXEL_COLORS[block.colorCheckerColor]?.hex ?? '#aaa', fontSize: 9 }}>
                              {block.colorCheckerColor}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
