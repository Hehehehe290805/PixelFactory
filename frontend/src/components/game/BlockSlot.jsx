import { useState, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import Block from './Block'
import { playBlockPlace } from '../../lib/audio'

const HOVER_DELAY_MS = 1500

export default function BlockSlot({
  row, col, block, cellSize = 48,
  selectedBlockId, onBlockSelect, pulsing,
  onCellClick,
  onBlockHoverStart,   // (block, clientX, clientY) — called after HOVER_DELAY_MS
  onBlockHoverEnd,     // () — called on mouse leave
  moveTarget = false,
  moveSource = false,
}) {
  const { placeBlock, removeBlock, moveBlock, sellBlock } = useGameStore()
  const [dragOver, setDragOver] = useState(false)
  const hoverTimerRef = useRef(null)

  function handleMouseEnter(e) {
    if (!block || !onBlockHoverStart) return
    const { clientX, clientY } = e
    hoverTimerRef.current = setTimeout(() => {
      onBlockHoverStart(block, clientX, clientY)
    }, HOVER_DELAY_MS)
  }

  function handleMouseLeave() {
    clearTimeout(hoverTimerRef.current)
    onBlockHoverEnd?.()
    setDragOver(false)
  }

  function handleDragOver(e) { e.preventDefault(); setDragOver(true) }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.source === 'inventory') {
        placeBlock(data.blockId, row, col)
        playBlockPlace()
      } else if (data.source === 'grid' && (data.fromRow !== row || data.fromCol !== col)) {
        moveBlock(data.fromRow, data.fromCol, row, col)
      }
    } catch {}
  }

  function handleDragStart(e) {
    if (!block) return
    e.dataTransfer.setData('application/json', JSON.stringify({
      source: 'grid', blockId: block.id, fromRow: row, fromCol: col,
    }))
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleClick(e) {
    if (onCellClick) {
      onCellClick(row, col, e)
    } else if (block) {
      onBlockSelect?.(block.id === selectedBlockId ? null : block.id)
    }
  }

  const isSelected = block && block.id === selectedBlockId

  let borderColor = '#36366a'
  let bgColor = block ? '#0d0d1e' : '#0a0a18'

  if (moveSource) {
    borderColor = '#ffd166'
    bgColor = 'rgba(255,209,102,0.08)'
  } else if (moveTarget) {
    borderColor = '#1499cc'
    bgColor = 'rgba(20,153,204,0.15)'
  } else if (dragOver) {
    borderColor = '#1499cc'
    bgColor = 'rgba(20,153,204,0.10)'
  } else if (isSelected) {
    borderColor = '#1499cc99'
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`relative border transition-colors duration-100 ${moveTarget ? 'cursor-cell' : 'cursor-pointer'}`}
      style={{ width: cellSize, height: cellSize, borderColor, backgroundColor: bgColor }}
    >
      {block && (
        <div draggable onDragStart={handleDragStart} style={{ width: '100%', height: '100%' }}>
          <Block block={block} size={cellSize} showPulse={pulsing} />
        </div>
      )}

      {moveTarget && (
        <div
          className="absolute inset-0 rounded-sm pointer-events-none"
          style={{ border: '2px dashed #1499cc88', animation: 'blockFillUp 1.2s ease-in-out infinite' }}
        />
      )}

      {moveSource && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-pixel-yellow font-black text-xs bg-black/60 rounded px-1">↔</div>
        </div>
      )}
    </div>
  )
}
