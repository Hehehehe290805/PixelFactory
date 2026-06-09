import { useState, useRef, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore'
import { PIXEL_COLORS, BLOCK_CANVAS_SIZE } from '../../lib/constants'

const CELL_PX = 16 // each pixel cell in the editor

export default function BlockEditor({ blockId, onClose }) {
  const { grid, inventory, updateBlockPixels } = useGameStore()

  // Find block in either grid or inventory
  const block =
    inventory.find(b => b.id === blockId) ??
    grid.flat().find(b => b && b.id === blockId)

  const [selectedColor, setSelectedColor] = useState('white')
  const [isErasing, setIsErasing] = useState(false)
  const painting = useRef(false)

  if (!block) return null

  const layout = block.pixelLayout

  function paint(r, c) {
    const newLayout = layout.map(row => [...row])
    newLayout[r][c] = isErasing ? null : selectedColor
    updateBlockPixels(blockId, newLayout)
  }

  function handleMouseDown(r, c) {
    painting.current = true
    paint(r, c)
  }

  function handleMouseEnter(r, c) {
    if (painting.current) paint(r, c)
  }

  function handleMouseUp() {
    painting.current = false
  }

  function clearAll() {
    const empty = Array.from({ length: BLOCK_CANVAS_SIZE }, () =>
      Array(BLOCK_CANVAS_SIZE).fill(null)
    )
    updateBlockPixels(blockId, empty)
  }

  function fillAll() {
    if (isErasing) return
    const filled = Array.from({ length: BLOCK_CANVAS_SIZE }, () =>
      Array(BLOCK_CANVAS_SIZE).fill(selectedColor)
    )
    updateBlockPixels(blockId, filled)
  }

  const colorList = Object.entries(PIXEL_COLORS)

  return (
    <div className="bg-game-card border border-game-border rounded-xl p-3 select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 uppercase tracking-widest">Pixel Editor</span>
        <button onClick={onClose} className="text-gray-600 hover:text-white text-xs transition">✕</button>
      </div>

      {/* 16×16 painting canvas */}
      <div
        className="border border-game-border rounded overflow-hidden cursor-crosshair"
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
            const color = layout[r]?.[c]
            return (
              <div
                key={`${r}-${c}`}
                onMouseDown={() => handleMouseDown(r, c)}
                onMouseEnter={() => handleMouseEnter(r, c)}
                style={{
                  width: CELL_PX,
                  height: CELL_PX,
                  backgroundColor: color ? PIXEL_COLORS[color]?.hex : '#0f0f1a',
                  borderRight: '1px solid #1a1a2e',
                  borderBottom: '1px solid #1a1a2e',
                }}
              />
            )
          })
        )}
      </div>

      {/* Stats */}
      <div className="text-xs text-gray-500 mt-1 mb-2">
        {block.pixelCount} / {BLOCK_CANVAS_SIZE * BLOCK_CANVAS_SIZE} pixels filled
      </div>

      {/* Color palette */}
      <div className="flex flex-wrap gap-1 mb-2">
        {colorList.map(([key, meta]) => (
          <button
            key={key}
            title={meta.label}
            onClick={() => { setSelectedColor(key); setIsErasing(false) }}
            className={`rounded transition ${selectedColor === key && !isErasing ? 'ring-2 ring-white' : ''}`}
            style={{ width: 18, height: 18, backgroundColor: meta.hex }}
          />
        ))}
        <button
          title="Eraser"
          onClick={() => setIsErasing(e => !e)}
          className={`rounded border text-xs flex items-center justify-center transition ${isErasing ? 'border-white text-white' : 'border-game-border text-gray-500 hover:border-gray-400'}`}
          style={{ width: 18, height: 18, fontSize: 10 }}
        >
          ✕
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={fillAll}
          className="flex-1 text-xs bg-game-bg hover:bg-game-border text-gray-400 hover:text-white py-1 rounded border border-game-border transition"
        >
          Fill All
        </button>
        <button
          onClick={clearAll}
          className="flex-1 text-xs bg-game-bg hover:bg-red-900/30 text-gray-400 hover:text-red-400 py-1 rounded border border-game-border transition"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
