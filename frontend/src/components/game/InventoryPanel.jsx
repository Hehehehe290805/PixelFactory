import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { useGridCellSize } from '../../hooks/useGridCellSize'
import Block from './Block'
import { DESIGNS } from '../../data/designLibrary'

export default function InventoryPanel({ onOpenStateChange }) {
  const { inventory } = useGameStore()
  const cellSize = useGridCellSize()
  const blockSize = Math.min(cellSize, 52)
  const [open, setOpen] = useState(false)
  const [hoveredId, setHoveredId] = useState(null)

  function toggle() {
    const next = !open
    setOpen(next)
    onOpenStateChange?.(next)
  }

  const hovered = hoveredId ? inventory.find(b => b.id === hoveredId) : null
  const hoveredDesign = hovered ? DESIGNS.find(d => d.id === hovered.designId) : null

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
          {inventory.length} design{inventory.length !== 1 ? 's' : ''}
        </span>

        {/* Mini design chips */}
        <div className="flex-1 flex flex-wrap gap-1 overflow-hidden justify-end">
          {inventory.slice(0, 8).map(b => (
            <div
              key={b.id}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg border border-game-border text-gray-400 truncate max-w-16"
              style={{ background: '#0d0d22' }}
            >
              {b.name}
            </div>
          ))}
          {inventory.length > 8 && (
            <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg border border-game-border text-gray-600">
              +{inventory.length - 8}
            </div>
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

      {/* ── Expanded panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            data-tutorial="inventory-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 280, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            className="absolute bottom-full left-0 right-0 z-20 overflow-hidden border-t-2 border-game-border flex"
            style={{ background: '#0a0a1e' }}
          >
            {/* Design grid */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-2 pt-2 pb-1 flex-shrink-0 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-gray-600">In Hand</span>
                <span className="text-xs text-gray-700">{inventory.length} designs</span>
              </div>
              <div className="overflow-y-auto flex-1 px-2 pb-2">
                {inventory.length === 0 ? (
                  <p className="text-xs font-semibold text-gray-700 italic text-center py-6">All placed on grid</p>
                ) : (
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${blockSize + 16}px, 1fr))` }}
                  >
                    {inventory.map(block => (
                      <InventoryDesignCard
                        key={block.id}
                        block={block}
                        blockSize={blockSize}
                        hovered={hoveredId === block.id}
                        onHover={setHoveredId}
                        onLeave={() => setHoveredId(null)}
                        onDragStart={() => { setOpen(false); onOpenStateChange?.(false) }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hover tooltip panel */}
            {hoveredDesign && (
              <div
                className="flex-shrink-0 w-44 border-l-2 border-game-border flex flex-col gap-2 p-3 overflow-y-auto"
                style={{ background: '#0d0d22' }}
              >
                <div className="text-sm font-black text-white">{hoveredDesign.name}</div>
                <div className="text-xs text-pixel-blue font-bold capitalize">{hoveredDesign.blockType.replace(/_/g, ' ')}</div>
                <div className="text-xs text-gray-500 capitalize">{hoveredDesign.series}</div>
                <div className="text-xs text-gray-300 leading-snug">{hoveredDesign.desc}</div>
                {hovered?.activeSynergy && (
                  <div className="text-xs text-pixel-green font-bold">✦ {hovered.activeSynergy.replace(/_/g, ' ')}</div>
                )}
                <div className="text-xs text-gray-600">{hoveredDesign.pixelCount}px</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function InventoryDesignCard({ block, blockSize, hovered, onHover, onLeave, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('application/json', JSON.stringify({ source: 'inventory', blockId: block.id }))
        onDragStart()
      }}
      onMouseEnter={() => onHover(block.id)}
      onMouseLeave={onLeave}
      className="flex flex-col items-center gap-1 rounded-xl border-2 cursor-grab transition-all p-1.5"
      style={{
        background:   '#111128',
        borderColor:  hovered ? '#1499cc' : (block.activeSynergy ? '#00d49a55' : '#36366a'),
      }}
    >
      <div className="rounded-lg overflow-hidden border flex-shrink-0"
        style={{ borderColor: hovered ? '#1499cc55' : '#36366a44' }}>
        <Block block={block} size={blockSize} />
      </div>
      <div className="text-center w-full">
        <div className="font-black text-gray-300 leading-tight truncate" style={{ fontSize: 9 }}>
          {block.name}
        </div>
        <div className="font-bold text-gray-600 leading-tight capitalize" style={{ fontSize: 8 }}>
          {block.type.replace(/_/g, ' ')}
        </div>
      </div>
    </div>
  )
}
