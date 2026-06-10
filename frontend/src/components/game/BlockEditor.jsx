import { useState, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import { PIXEL_COLORS, BLOCK_CANVAS_SIZE } from '../../lib/constants'
import { useUnlocks } from '../../lib/unlocks'

const CELL_PX = 20

export default function BlockEditor({ blockId, onClose, isTutorial = false }) {
  const { grid, inventory, pixelInventory, paintPixel, clearBlock, fillBlock } = useGameStore()
  const { isPixelUnlocked } = useUnlocks()

  const block =
    inventory.find(b => b.id === blockId) ??
    grid.flat().find(b => b && b.id === blockId)

  const [selectedColor, setSelectedColor] = useState('white')
  const [isErasing, setIsErasing] = useState(false)
  const painting = useRef(false)

  if (!block) return null

  const activeColor = isErasing ? null : selectedColor

  function doPaint(r, c) { paintPixel(blockId, r, c, activeColor) }
  function handleMouseDown(r, c, e) { e.preventDefault(); painting.current = true; doPaint(r, c) }
  function handleMouseEnter(r, c) { if (painting.current) doPaint(r, c) }
  function handleMouseUp() { painting.current = false }

  return (
    <div className="card" style={{ padding: '0.875rem' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-black uppercase tracking-widest text-gray-400">Pixel Editor</span>
        {!isTutorial && (
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-xs font-semibold transition">✕ esc</button>
        )}
      </div>

      {/* Color Checker banner */}
      {block.type === 'color_checker' && block.colorCheckerColor && (
        <div
          className="mb-3 text-xs rounded-xl px-3 py-2 flex items-center gap-2 border-2 font-semibold"
          style={{
            backgroundColor: `${PIXEL_COLORS[block.colorCheckerColor]?.hex}15`,
            borderColor: `${PIXEL_COLORS[block.colorCheckerColor]?.hex}55`,
          }}
        >
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIXEL_COLORS[block.colorCheckerColor]?.hex }} />
          <span className="text-gray-300">
            Target: <b style={{ color: PIXEL_COLORS[block.colorCheckerColor]?.hex }}>{block.colorCheckerColor}</b>
            {block.colorCheckerTriggered ? ' ✓ Triggered!' : ' — need 50%+'}
          </span>
        </div>
      )}

      {/* 16×16 grid */}
      <div
        data-tutorial="editor-canvas"
        className="rounded-xl overflow-hidden cursor-crosshair border-2 border-game-border"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${BLOCK_CANVAS_SIZE}, ${CELL_PX}px)`,
          width: BLOCK_CANVAS_SIZE * CELL_PX,
        }}
      >
        {Array.from({ length: BLOCK_CANVAS_SIZE }, (_, r) =>
          Array.from({ length: BLOCK_CANVAS_SIZE }, (_, c) => {
            const color = block.pixelLayout[r]?.[c]
            return (
              <div
                key={`${r}-${c}`}
                onMouseDown={e => handleMouseDown(r, c, e)}
                onMouseEnter={() => handleMouseEnter(r, c)}
                style={{
                  width: CELL_PX, height: CELL_PX,
                  backgroundColor: color ? PIXEL_COLORS[color]?.hex : '#0a0a18',
                  borderRight: '1px solid #111128',
                  borderBottom: '1px solid #111128',
                }}
              />
            )
          })
        )}
      </div>

      <div className="text-xs font-bold text-gray-600 mt-2 mb-3">
        {block.pixelCount} / {BLOCK_CANVAS_SIZE * BLOCK_CANVAS_SIZE} pixels
      </div>

      {/* Palette — only show unlocked pixel colors */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {Object.entries(PIXEL_COLORS).map(([key, meta]) => {
          const available = pixelInventory[key] ?? 0
          // Show if unlocked by campaign/shop OR if the player already has pixels of this color
          if (!isPixelUnlocked(key) && available === 0) return null
          return (
            <button
              key={key}
              title={`${meta.label} (${available} left)`}
              onClick={() => { setSelectedColor(key); setIsErasing(false) }}
              disabled={available <= 0}
              className={`relative rounded-lg transition-transform ${selectedColor === key && !isErasing ? 'ring-2 ring-white scale-110' : ''} ${available <= 0 ? 'opacity-20' : ''}`}
              style={{ width: 22, height: 22, backgroundColor: meta.hex, border: '2px solid rgba(0,0,0,0.3)' }}
            >
              {available > 0 && available <= 9 && (
                <span className="absolute -top-1.5 -right-1.5 bg-game-bg text-white rounded-full font-black leading-none" style={{ fontSize: 7, padding: '1px 3px', border: '1px solid #36366a' }}>
                  {available}
                </span>
              )}
            </button>
          )
        })}
        <button
          title="Eraser"
          onClick={() => setIsErasing(v => !v)}
          className={`rounded-lg border-2 flex items-center justify-center transition-all
            ${isErasing
              ? 'border-pixel-red text-pixel-red bg-pixel-red/15 scale-110'
              : 'border-game-border text-gray-500 hover:border-gray-400 hover:text-gray-300'}`}
          style={{ width: 26, height: 22, fontSize: 13 }}
        >
          ⌫
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => fillBlock(blockId, selectedColor)}
          disabled={isErasing || (pixelInventory[selectedColor] ?? 0) <= 0}
          className="btn btn-secondary flex-1 text-xs py-2 disabled:opacity-30"
        >
          Fill
        </button>
        <button
          onClick={() => clearBlock(blockId)}
          className="btn btn-danger flex-1 text-xs py-2"
        >
          Clear
        </button>
      </div>

      <button
        data-tutorial="editor-done"
        onClick={onClose}
        disabled={isTutorial && block.pixelCount < 5}
        className="btn btn-primary w-full text-sm disabled:opacity-40"
      >
        {isTutorial && block.pixelCount < 5 ? `Paint ${5 - block.pixelCount} more pixel${5 - block.pixelCount !== 1 ? 's' : ''}` : 'Done'}
      </button>
    </div>
  )
}
