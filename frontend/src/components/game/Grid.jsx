import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useGridCellSize } from '../../hooks/useGridCellSize'
import BlockSlot from './BlockSlot'
import Block from './Block'
import RadialWheel from './RadialWheel'
import { GRID_SIZE, TICK_MS } from '../../lib/constants'
import { DESIGNS } from '../../data/designLibrary'
import { DesignTooltipBody } from '../ui/DeckSelector'
import { playBlockPlace } from '../../lib/audio'

const WAVE_DIRS = [
  { dir: 'up',         icon: '↑', label: 'Up' },
  { dir: 'up-right',   icon: '↗', label: 'UR' },
  { dir: 'right',      icon: '→', label: 'Right' },
  { dir: 'down-right', icon: '↘', label: 'DR' },
  { dir: 'down',       icon: '↓', label: 'Down' },
  { dir: 'down-left',  icon: '↙', label: 'DL' },
  { dir: 'left',       icon: '←', label: 'Left' },
  { dir: 'up-left',    icon: '↖', label: 'UL' },
]

export default function Grid() {
  const { grid, inventory, placeBlock, moveBlock, removeBlock, setWaveDir, replaceBlock } = useGameStore()
  const cellSize = useGridCellSize()

  const [pulsingSlots, setPulsingSlots] = useState(new Set())
  // wheel: null | { type: 'empty'|'occupied'|'add', row, col, x, y }
  const [wheel, setWheel]       = useState(null)
  // movingBlock: null | { blockId, fromRow, fromCol }
  const [movingBlock, setMoving] = useState(null)
  // descPanel: null | { block, design, x, y }
  const [descPanel, setDescPanel] = useState(null)

  const handleBlockRightClick = useCallback((row, col, block, e) => {
    const design = DESIGNS.find(d => d.id === block.designId)
    if (!design) return
    setDescPanel({ block, design, x: e.clientX, y: e.clientY })
  }, [])

  useEffect(() => {
    if (!descPanel) return
    function onKey(e) { if (e.key === 'Escape') setDescPanel(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [descPanel])

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
        label: block.name ?? block.type.replace(/_/g, ' '),
        color: '#1499cc',
        onClick: () => {
          if (wheel.type === 'add') {
            replaceBlock(wheel.row, wheel.col, block.id)
          } else {
            placeBlock(block.id, wheel.row, wheel.col)
          }
          playBlockPlace()
          dismiss()
        },
      }))
    }

    // Occupied cell action wheel — no Paint option (designs have fixed art)
    if (wheel.type === 'occupied') {
      const occupant = grid[wheel.row]?.[wheel.col]
      if (!occupant) return []
      return [
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
          icon: '⇄',
          label: 'Replace',
          color: '#00d49a',
          onClick: () => {
            setWheel({ type: 'add', row: wheel.row, col: wheel.col, x: wheel.x, y: wheel.y })
          },
        },
        {
          icon: '〰',
          label: 'Wave',
          color: '#a066f0',
          onClick: () => {
            setWheel({ type: 'wave', row: wheel.row, col: wheel.col, x: wheel.x, y: wheel.y })
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

    // Wave direction picker
    if (wheel.type === 'wave') {
      const occupant = grid[wheel.row]?.[wheel.col]
      if (!occupant) return []
      const cur = occupant.waveDir ?? 'up'
      return WAVE_DIRS.map(({ dir, icon, label }) => ({
        icon,
        label,
        color: dir === cur ? '#ffd166' : '#a066f0',
        onClick: () => {
          setWaveDir(occupant.id, dir)
          dismiss()
        },
      }))
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
              selectedBlockId={null}
              onBlockSelect={null}
              pulsing={pulsingSlots.has(`${r}-${c}`)}
              onCellClick={handleCellClick}
              onBlockRightClick={handleBlockRightClick}
              moveTarget={!!movingBlock && !grid[r][c]}
              moveSource={movingBlock?.fromRow === r && movingBlock?.fromCol === c}
            />
          ))
        )}
      </div>

      {movingBlock && (
        <p className="text-xs text-gray-600 text-center select-none">
          Click an empty cell to place · click the block to cancel
        </p>
      )}

      {wheel && items.length > 0 && (
        <RadialWheel x={wheel.x} y={wheel.y} items={items} onDismiss={dismiss} />
      )}

      {/* Right-click design description panel */}
      {descPanel && (() => {
        const tipW = 180
        const margin = 12
        const x = descPanel.x + margin + tipW > window.innerWidth
          ? descPanel.x - tipW - margin
          : descPanel.x + margin
        const y = Math.min(descPanel.y - 8, window.innerHeight - 320)
        return (
          <>
            <div className="fixed inset-0 z-[55]" onClick={() => setDescPanel(null)} />
            <div
              style={{ position: 'fixed', left: x, top: y, width: tipW, zIndex: 56, background: '#0d0d22' }}
              className="rounded-xl border-2 border-pixel-blue/40 p-3 flex flex-col gap-2"
            >
              <DesignTooltipBody design={descPanel.design} />
              {descPanel.block.activeSynergy && (
                <div className="text-xs text-pixel-green font-bold border-t border-game-border pt-1">
                  ✦ {descPanel.block.activeSynergy.replace(/_/g, ' ')} active
                </div>
              )}
              <div className="text-[10px] text-gray-700 border-t border-game-border pt-1">right-click to close</div>
            </div>
          </>
        )
      })()}
    </div>
  )
}
