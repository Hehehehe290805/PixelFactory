import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import BlockSlot from './BlockSlot'
import { GRID_SIZE, TICK_MS } from '../../lib/constants'

export default function Grid({ selectedBlockId, onBlockSelect }) {
  const { grid, inventory } = useGameStore()
  // Track which slots pulsed this tick
  const [pulsingSlots, setPulsingSlots] = useState(new Set())

  // Every tick, pulse all active blocks
  useEffect(() => {
    const interval = setInterval(() => {
      const active = new Set()
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const block = grid[r][c]
          if (block && block.pauseTimer === 0 && block.pixelCount > 0) {
            active.add(`${r}-${c}`)
          }
        }
      }
      setPulsingSlots(active)
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [grid])

  function handleInventoryDragStart(e, blockId) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      source: 'inventory',
      blockId,
    }))
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Grid */}
      <div
        className="border border-game-border rounded-lg overflow-hidden"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 48px)` }}
      >
        {Array.from({ length: GRID_SIZE }, (_, r) =>
          Array.from({ length: GRID_SIZE }, (_, c) => (
            <BlockSlot
              key={`${r}-${c}`}
              row={r}
              col={c}
              block={grid[r][c]}
              selectedBlockId={selectedBlockId}
              onBlockSelect={onBlockSelect}
              pulsing={pulsingSlots.has(`${r}-${c}`)}
            />
          ))
        )}
      </div>

      {/* Tip */}
      <p className="text-xs text-gray-600 text-center">
        Drag blocks from inventory · Right-click to remove · Click to select/edit
      </p>
    </div>
  )
}
