import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BLOCK_CANVAS_SIZE, PIXEL_COLORS } from '../../lib/constants'

const CELL = 3 // each pixel cell rendered at 3x3 canvas pixels

export default function Block({ block, size = 48, showPulse = false, onClick }) {
  const canvasRef = useRef(null)
  const [pulsing, setPulsing] = useState(false)

  useEffect(() => {
    drawCanvas()
  }, [block.pixelLayout])

  useEffect(() => {
    if (showPulse) {
      setPulsing(true)
      const t = setTimeout(() => setPulsing(false), 400)
      return () => clearTimeout(t)
    }
  }, [showPulse])

  function drawCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const layout = block.pixelLayout

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (let r = 0; r < BLOCK_CANVAS_SIZE; r++) {
      for (let c = 0; c < BLOCK_CANVAS_SIZE; c++) {
        const color = layout[r]?.[c]
        if (color && PIXEL_COLORS[color]) {
          ctx.fillStyle = PIXEL_COLORS[color].hex
          ctx.fillRect(c * CELL, r * CELL, CELL, CELL)
        }
      }
    }
  }

  const canvasSize = BLOCK_CANVAS_SIZE * CELL // 48px

  return (
    <div
      onClick={onClick}
      className={`relative rounded overflow-hidden cursor-pointer select-none ${pulsing ? 'block-pulse' : ''}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{ width: size, height: size, imageRendering: 'pixelated', display: 'block' }}
      />

      {/* Pause timer overlay */}
      {block.pauseTimer > 0 && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-white text-xs font-bold">
            {Math.ceil(block.pauseTimer / 1000)}s
          </span>
        </div>
      )}

      {/* Type badge */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-center" style={{ fontSize: 7, lineHeight: '10px' }}>
        <span className="text-gray-300">{block.type.slice(0, 3).toUpperCase()}</span>
      </div>
    </div>
  )
}
