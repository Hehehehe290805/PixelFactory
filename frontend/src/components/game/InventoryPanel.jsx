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

export default function InventoryPanel({ selectedBlockId, onBlockSelect, onOpenStateChange }) {
  const { inventory, pixelInventory } = useGameStore()
  const cellSize = useGridCellSize()
  const blockSize = Math.min(cellSize, 52)
  const [open, setOpen] = useState(false)

  function toggle() {
    const next = !open
    setOpen(next)
    onOpenStateChange?.(next)
  }

  const pixelEntries = Object.entries(PIXEL_COLORS).filter(([k]) => (pixelInventory[k] ?? 0) > 0)

  return (
    <div className="relative flex-shrink-0 select-none">

      {/* ── Collapsed handle ── */}
      <button
        data-tutorial="inventory"
        onClick={toggle}
        className="w-full flex items-center gap-2 px-3 border-t-2 border-game-border"
        style={{ height: 44, background: '#111128', cursor: 'pointer' }}
      >
        <span className="text-xs font-black uppercase tracking-widest text-gray-500 flex-shrink-0">
          Inventory
        </span>
        <span className="text-xs font-bold text-gray-700 flex-shrink-0">
          {inventory.length} block{inventory.length !== 1 ? 's' : ''}
        </span>

        {/* Pixel chips summary */}
        <div className="flex-1 flex flex-wrap gap-1 overflow-hidden justify-end">
          {pixelEntries.map(([key, meta]) => (
            <div
              key={key}
              className="flex items-center gap-0.5 rounded-lg border px-1.5 py-0.5 flex-shrink-0"
              style={{ backgroundColor: meta.hex + '18', borderColor: meta.hex + '55' }}
            >
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: meta.hex }} />
              <span className="text-xs font-black font-mono" style={{ color: meta.hex }}>{pixelInventory[key]}</span>
            </div>
          ))}
          {pixelEntries.length === 0 && (
            <span className="text-xs font-semibold text-gray-700 italic">No pixels</span>
          )}
        </div>

        <motion.span
          animate={{ rotate: open ? 0 : 180 }}
          transition={{ duration: 0.18 }}
          className="text-gray-600 text-xs flex-shrink-0 font-black"
        >
          ▲
        </motion.span>
      </button>

      {/* ── Expanded panel — two columns: Blocks | Pixels ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 300, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            className="absolute bottom-full left-0 right-0 z-20 overflow-hidden border-t-2 border-game-border flex"
            style={{ background: '#0a0a1e' }}
          >
            {/* Left: Blocks */}
            <div className="flex-1 flex flex-col border-r border-game-border overflow-hidden">
              <div className="px-2 pt-2 pb-1 flex-shrink-0">
                <span className="text-xs font-black uppercase tracking-widest text-gray-600">Blocks</span>
              </div>
              <div className="overflow-y-auto flex-1 px-2 pb-2">
                {inventory.length === 0 ? (
                  <p className="text-xs font-semibold text-gray-700 italic text-center py-6">All placed</p>
                ) : (
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${blockSize + 24}px, 1fr))` }}
                  >
                    {inventory.map(block => {
                      const selected = block.id === selectedBlockId
                      return (
                        <div
                          key={block.id}
                          draggable
                          onDragStart={e => {
                            e.dataTransfer.setData('application/json', JSON.stringify({ source: 'inventory', blockId: block.id }))
                            setOpen(false)
                            onOpenStateChange?.(false)
                          }}
                          onClick={() => {
                            onBlockSelect(selected ? null : block.id)
                            setOpen(false)
                            onOpenStateChange?.(false)
                          }}
                          className="flex flex-col items-center gap-1 rounded-xl border-2 cursor-pointer transition-all p-2"
                          style={{
                            background:  selected ? 'rgba(20,153,204,0.12)' : '#111128',
                            borderColor: selected ? '#1499cc' : '#36366a',
                          }}
                        >
                          <div className="rounded-lg overflow-hidden border flex-shrink-0"
                            style={{ borderColor: selected ? '#1499cc55' : '#36366a' }}>
                            <Block block={block} size={blockSize} />
                          </div>
                          <div className="text-center w-full">
                            <div className="text-xs font-black text-gray-300 capitalize leading-tight truncate" style={{ fontSize: 10 }}>
                              {block.type.replace(/_/g, ' ')}
                            </div>
                            <div className="font-bold text-gray-600 leading-tight" style={{ fontSize: 9 }}>{block.pixelCount}px</div>
                            {block.activeSet && (
                              <div className="font-black leading-tight truncate" style={{ color: SET_COLORS[block.activeSet] ?? '#aaa', fontSize: 8 }}>
                                {block.activeSet}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Pixels */}
            <div className="flex flex-col overflow-hidden" style={{ width: 140, minWidth: 120 }}>
              <div className="px-2 pt-2 pb-1 flex-shrink-0">
                <span className="text-xs font-black uppercase tracking-widest text-gray-600">Pixels</span>
              </div>
              <div className="overflow-y-auto flex-1 px-2 pb-2">
                {pixelEntries.length === 0 ? (
                  <p className="text-xs font-semibold text-gray-700 italic text-center py-6">None</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {pixelEntries.map(([key, meta]) => (
                      <div
                        key={key}
                        className="flex items-center gap-2 rounded-xl border px-2.5 py-2"
                        style={{ background: meta.hex + '12', borderColor: meta.hex + '44' }}
                      >
                        <div className="w-5 h-5 rounded-md flex-shrink-0 border border-black/20" style={{ backgroundColor: meta.hex }} />
                        <span className="text-xs font-bold capitalize flex-1" style={{ color: meta.hex }}>{key}</span>
                        <span className="text-sm font-black font-mono" style={{ color: meta.hex }}>
                          {pixelInventory[key]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
