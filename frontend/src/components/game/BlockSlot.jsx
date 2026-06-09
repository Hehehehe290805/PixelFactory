import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import Block from './Block'

export default function BlockSlot({ row, col, block, selectedBlockId, onBlockSelect, pulsing }) {
  const { placeBlock, removeBlock, moveBlock } = useGameStore()
  const [dragOver, setDragOver] = useState(false)

  function handleDragOver(e) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const data = JSON.parse(e.dataTransfer.getData('application/json'))

    if (data.source === 'inventory') {
      placeBlock(data.blockId, row, col)
    } else if (data.source === 'grid') {
      if (data.fromRow !== row || data.fromCol !== col) {
        moveBlock(data.fromRow, data.fromCol, row, col)
      }
    }
  }

  function handleDragStart(e) {
    if (!block) return
    e.dataTransfer.setData('application/json', JSON.stringify({
      source: 'grid',
      blockId: block.id,
      fromRow: row,
      fromCol: col,
    }))
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleClick() {
    if (block) {
      onBlockSelect(block.id === selectedBlockId ? null : block.id)
    }
  }

  function handleRightClick(e) {
    e.preventDefault()
    if (block) removeBlock(row, col)
  }

  const isSelected = block && block.id === selectedBlockId

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={handleRightClick}
      onClick={handleClick}
      className={`
        relative border transition-colors duration-100
        ${dragOver ? 'border-pixel-blue bg-pixel-blue/10' : isSelected ? 'border-pixel-blue/70' : 'border-game-border grid-slot-hover'}
        ${!block ? 'bg-game-bg' : 'bg-game-card'}
      `}
      style={{ width: 48, height: 48 }}
    >
      {block ? (
        <div
          draggable
          onDragStart={handleDragStart}
          style={{ width: '100%', height: '100%' }}
        >
          <Block block={block} size={48} showPulse={pulsing} />
        </div>
      ) : null}
    </div>
  )
}
