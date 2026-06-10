import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { useGridCellSize } from '../../hooks/useGridCellSize'
import Block from './Block'
import { DESIGNS } from '../../data/designLibrary'
import { BLOCK_TYPE_VISUAL, BLOCK_TYPES, GRID_SIZE } from '../../lib/constants'
import { DesignTooltipBody } from '../ui/DeckSelector'
import { tooltipPos } from '../../lib/tooltipPos'

export default function InventoryPanel({ onOpenStateChange }) {
  const { inventory, grid } = useGameStore()
  const cellSize  = useGridCellSize()
  const blockSize = Math.min(cellSize, 52)
  const [open, setOpen]         = useState(false)
  const [hoveredId, setHoveredId] = useState(null)
  const [mousePos, setMousePos]   = useState({ x: 0, y: 0 })
  const panelRef = useRef(null)

  const handleMouseMove = useCallback((e) => setMousePos({ x: e.clientX, y: e.clientY }), [])

  useEffect(() => {
    if (!open) return
    function onOutsideClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
        onOpenStateChange?.(false)
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [open, onOpenStateChange])

  function toggle() {
    const next = !open
    setOpen(next)
    onOpenStateChange?.(next)
  }

  // Count how many instances of a designId are on the grid
  function countOnGrid(designId) {
    let n = 0
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE; c++)
        if (grid[r][c]?.designId === designId) n++
    return n
  }

  // Build list of all unique designs present in inventory OR on grid
  const allDesignIds = useMemo(() => {
    const seen = new Set()
    const result = []
    for (const b of inventory) {
      if (!seen.has(b.designId)) { seen.add(b.designId); result.push(b.designId) }
    }
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE; c++) {
        const b = grid[r][c]
        if (b && !seen.has(b.designId)) { seen.add(b.designId); result.push(b.designId) }
      }
    return result
  }, [inventory, grid])

  // Pick a representative block instance for each designId (prefer in-inventory, else from grid)
  function getRepBlock(designId) {
    const inv = inventory.find(b => b.designId === designId)
    if (inv) return inv
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE; c++)
        if (grid[r][c]?.designId === designId) return grid[r][c]
    return null
  }

  const hovered       = hoveredId ? (inventory.find(b => b.id === hoveredId) ?? (() => { for (let r=0;r<GRID_SIZE;r++) for (let c=0;c<GRID_SIZE;c++) if (grid[r][c]?.id===hoveredId) return grid[r][c]; return null })()) : null
  const hoveredDesign = hovered ? DESIGNS.find(d => d.id === hovered.designId) : null

  const tipW = 168
  const { x: tipX, y: tipY } = tooltipPos(mousePos.x, mousePos.y, tipW, 240)

  return (
    <div ref={panelRef} className="relative flex-shrink-0 select-none">

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

        {/* Mini type-color chips */}
        <div className="flex-1 flex flex-wrap gap-1 overflow-hidden justify-end">
          {inventory.slice(0, 10).map(b => (
            <div
              key={b.id}
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: BLOCK_TYPE_VISUAL[b.type]?.color ?? '#5c7abf', opacity: 0.8 }}
            />
          ))}
          {inventory.length > 10 && (
            <div className="text-[10px] font-bold text-gray-600">+{inventory.length - 10}</div>
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
            className="absolute bottom-full left-0 right-0 z-20 overflow-hidden border-t-2 border-game-border"
            style={{ background: '#0a0a1e' }}
            onMouseMove={handleMouseMove}
          >
            <div className="px-2 pt-2 pb-1 flex-shrink-0 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-gray-600">In Hand</span>
              <span className="text-xs text-gray-700">{inventory.length} / {allDesignIds.length} cards</span>
            </div>
            <div className="overflow-y-auto px-2 pb-2" style={{ height: 244 }}>
              {allDesignIds.length === 0 ? (
                <p className="text-xs font-semibold text-gray-700 italic text-center py-6">No blocks yet</p>
              ) : (
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${blockSize + 8}px, 1fr))` }}
                >
                  {allDesignIds.map(designId => {
                    const rep    = getRepBlock(designId)
                    if (!rep) return null
                    const inInv  = inventory.filter(b => b.designId === designId).length
                    const onGrid = countOnGrid(designId)
                    const total  = inInv + onGrid
                    return (
                      <InventoryCard
                        key={designId}
                        block={rep}
                        blockSize={blockSize}
                        inInventory={inInv}
                        total={total}
                        deployed={inInv === 0}
                        hovered={hoveredId === rep.id}
                        onHover={setHoveredId}
                        onLeave={() => setHoveredId(null)}
                        onDragStart={() => { setOpen(false); onOpenStateChange?.(false) }}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover tooltip */}
      {hoveredDesign && open && (
        <div
          style={{ position: 'fixed', left: tipX, top: tipY, width: tipW, zIndex: 100, pointerEvents: 'none', background: '#0d0d22' }}
          className="rounded-xl border-2 border-game-border p-3 flex flex-col gap-2"
        >
          {/* Pass the instance's actual random type so tooltip shows the correct effect */}
          <DesignTooltipBody design={hoveredDesign} blockType={hovered?.type} />
          {hovered?.activeSynergy && (
            <div className="text-xs text-pixel-green font-bold border-t border-game-border pt-1">
              ✦ {hovered.activeSynergy.replace(/_/g, ' ')} active
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InventoryCard({ block, blockSize, inInventory, total, deployed, hovered, onHover, onLeave, onDragStart }) {
  const vis       = BLOCK_TYPE_VISUAL[block.type]
  const typeColor = vis?.color ?? '#5c7abf'
  const bStyle    = deployed ? 'solid' : vis?.borderStyle ?? 'solid'
  const bWidth    = vis?.borderWidth ?? 2

  return (
    <div
      draggable={!deployed}
      onDragStart={e => {
        if (deployed) { e.preventDefault(); return }
        e.dataTransfer.setData('application/json', JSON.stringify({ source: 'inventory', blockId: block.id }))
        onDragStart()
      }}
      onMouseEnter={() => onHover(block.id)}
      onMouseLeave={onLeave}
      className={`relative flex flex-col items-center rounded-xl transition-all p-1 ${deployed ? 'opacity-40 cursor-default' : 'cursor-grab'}`}
      style={{
        background:   '#111128',
        borderColor:  deployed ? '#2a2a4a' : hovered ? typeColor : typeColor + '66',
        borderStyle:  bStyle,
        borderWidth:  bWidth,
        boxShadow:    (!deployed && hovered) ? `0 0 8px ${typeColor}44` : undefined,
      }}
    >
      {/* Pixel art block */}
      <div className="rounded overflow-hidden flex-shrink-0">
        <Block block={block} size={blockSize} />
      </div>

      {/* Type label — bottom-left */}
      <div
        className="absolute bottom-1 left-1 font-black leading-none rounded-sm"
        style={{ fontSize: 7, color: typeColor, background: typeColor + '22', padding: '1px 3px' }}
      >
        {vis?.label ?? block.type.slice(0, 3).toUpperCase()}
      </div>

      {/* In-hand / total count — bottom-right */}
      <div
        className="absolute bottom-1 right-1 font-black leading-none"
        style={{ fontSize: 8, color: typeColor }}
      >
        {inInventory}/{total}
      </div>
    </div>
  )
}
