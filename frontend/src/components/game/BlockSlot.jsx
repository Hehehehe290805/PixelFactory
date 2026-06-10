import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import Block from './Block'

export default function BlockSlot({
  row, col, block, cellSize = 48,
  selectedBlockId, onBlockSelect, pulsing,
  onCellClick,          // (row, col, event) → opens radial wheel
  onBlockRightClick,    // (row, col, block, event) → show description overlay
  moveTarget = false,
  moveSource = false,
}) {
  const { placeBlock, removeBlock, moveBlock } = useGameStore()
  const [dragOver, setDragOver] = useState(false)

  function handleDragOver(e) { e.preventDefault(); setDragOver(true) }
  function handleDragLeave() { setDragOver(false) }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.source === 'inventory') {
        const invBlock = useGameStore.getState().inventory.find(b => b.id === data.blockId)
        placeBlock(data.blockId, row, col)
        if (invBlock && invBlock.pixelCount === 0) onBlockSelect?.(data.blockId)
      } else if (data.source === 'grid' && (data.fromRow !== row || data.fromCol !== col)) {
        moveBlock(data.fromRow, data.fromCol, row, col)
      }
    } catch {}
  }

  function handleDragStart(e) {
    if (!block) return
    e.dataTransfer.setData('application/json', JSON.stringify({ source: 'grid', blockId: block.id, fromRow: row, fromCol: col }))
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleClick(e) {
    if (onCellClick) {
      onCellClick(row, col, e)
    } else if (block) {
      onBlockSelect?.(block.id === selectedBlockId ? null : block.id)
    }
  }

  function handleRightClick(e) {
    e.preventDefault()
    if (block && onBlockRightClick) onBlockRightClick(row, col, block, e)
  }

  const isSelected = block && block.id === selectedBlockId

  // Visual state priority: moveSource > moveTarget > dragOver > selected > default
  let borderColor = '#36366a'
  let bgColor = block ? '#0d0d1e' : '#0a0a18'
  let overlayStyle = null

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
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={handleRightClick}
      onClick={handleClick}
      className={`relative border transition-colors duration-100 ${moveTarget ? 'cursor-cell' : 'cursor-pointer'}`}
      style={{
        width: cellSize,
        height: cellSize,
        borderColor,
        backgroundColor: bgColor,
      }}
    >
      {block && (
        <div draggable onDragStart={handleDragStart} style={{ width: '100%', height: '100%' }}>
          <Block block={block} size={cellSize} showPulse={pulsing} />
        </div>
      )}

      {/* Move-target pulse ring */}
      {moveTarget && (
        <div
          className="absolute inset-0 rounded-sm pointer-events-none"
          style={{ border: '2px dashed #1499cc88', animation: 'blockFillUp 1.2s ease-in-out infinite' }}
        />
      )}

      {/* Move-source indicator */}
      {moveSource && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-pixel-yellow font-black text-xs bg-black/60 rounded px-1">↔</div>
        </div>
      )}
    </div>
  )
}
