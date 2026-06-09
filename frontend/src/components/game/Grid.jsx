import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useGridCellSize } from '../../hooks/useGridCellSize'
import BlockSlot from './BlockSlot'
import Block from './Block'
import RadialWheel from './RadialWheel'
import { GRID_SIZE, TICK_MS } from '../../lib/constants'

export default function Grid({ selectedBlockId, onBlockSelect }) {
  const { grid, inventory, placeBlock, moveBlock, removeBlock } = useGameStore()
  const cellSize = useGridCellSize()

  const [pulsingSlots, setPulsingSlots] = useState(new Set())
  // wheel: null | { type: 'empty'|'occupied'|'add', row, col, x, y }
  const [wheel, setWheel]       = useState(null)
  // movingBlock: null | { blockId, fromRow, fromCol }
  const [movingBlock, setMoving] = useState(null)

  // Production pulse tracker
  useEffect(() => {
    const interval = setInterval(() => {
      const active = new Set()
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const b = grid[r][c]
          if (b && b.pauseTimer === 0 && b.pixelCount > 0) active.add(`${r}-${c}`)
        }
      }
      setPulsingSlots(active)
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [grid])

  // ── Cell click handler ────────────────────────────────────────────────────
  function handleCellClick(row, col, e) {
    const x = e.clientX
    const y = e.clientY

    // Move-mode: complete the move on a valid destination
    if (movingBlock) {
      const dest = grid[row][col]
      if (!dest) {
        moveBlock(movingBlock.fromRow, movingBlock.fromCol, row, col)
        setMoving(null)
      } else if (movingBlock.fromRow === row && movingBlock.fromCol === col) {
        setMoving(null) // cancel by clicking the same block
      }
      return
    }

    const hasBlock = !!grid[row][col]
    setWheel({ type: hasBlock ? 'occupied' : 'empty', row, col, x, y })
  }

  function dismiss() { setWheel(null) }

  // ── Build wheel items ─────────────────────────────────────────────────────
  function buildItems() {
    if (!wheel) return []

    // Inventory picker (used for empty cell and for "Add" on occupied cell)
    if (wheel.type === 'empty' || wheel.type === 'add') {
      if (inventory.length === 0) return []
      return inventory.slice(0, 9).map(block => ({
        content: <Block block={block} size={32} />,
        label: block.type.replace(/_/g, ' '),
        color: '#1499cc',
        onClick: () => {
          if (wheel.type === 'add') removeBlock(wheel.row, wheel.col)
          placeBlock(block.id, wheel.row, wheel.col)
          if (block.pixelCount === 0) onBlockSelect?.(block.id)
          dismiss()
        },
      }))
    }

    // Occupied cell action wheel
    if (wheel.type === 'occupied') {
      const occupant = grid[wheel.row]?.[wheel.col]
      if (!occupant) return []
      return [
        {
          icon: '✏️',
          label: 'Paint',
          color: '#ffd166',
          onClick: () => {
            onBlockSelect?.(occupant.id)
            dismiss()
          },
        },
        {
          icon: '↔',
          label: 'Move',
          color: '#1499cc',
          onClick: () => {
            setMoving({ blockId: occupant.id, fromRow: wheel.row, fromCol: wheel.col })
            dismiss()
          },
        },
        {
          icon: '🔄',
          label: 'Add',
          color: '#00d49a',
          onClick: () => {
            // Show inventory picker to replace this block
            setWheel({ type: 'add', row: wheel.row, col: wheel.col, x: wheel.x, y: wheel.y })
          },
        },
        {
          icon: '✕',
          label: 'Remove',
          color: '#f03e4e',
          onClick: () => {
            removeBlock(wheel.row, wheel.col)
            dismiss()
          },
        },
      ]
    }

    return []
  }

  const items = buildItems()

  // Auto-dismiss if no items (e.g. empty inventory when clicking empty cell)
  useEffect(() => {
    if (wheel && items.length === 0) dismiss()
  }, [wheel]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-1">
      <div
        className="border border-game-border rounded-lg overflow-hidden"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)` }}
      >
        {Array.from({ length: GRID_SIZE }, (_, r) =>
          Array.from({ length: GRID_SIZE }, (_, c) => (
            <BlockSlot
              key={`${r}-${c}`}
              row={r} col={c}
              block={grid[r][c]}
              cellSize={cellSize}
              selectedBlockId={selectedBlockId}
              onBlockSelect={onBlockSelect}
              pulsing={pulsingSlots.has(`${r}-${c}`)}
              onCellClick={handleCellClick}
              moveTarget={!!movingBlock && !grid[r][c]}
              moveSource={movingBlock?.fromRow === r && movingBlock?.fromCol === c}
            />
          ))
        )}
      </div>

      <p className="text-xs text-gray-600 text-center">
        {movingBlock
          ? 'Click an empty cell to place · click the block to cancel'
          : 'Click a cell for options · drag to place or move'}
      </p>

      {wheel && items.length > 0 && (
        <RadialWheel x={wheel.x} y={wheel.y} items={items} onDismiss={dismiss} />
      )}
    </div>
  )
}
