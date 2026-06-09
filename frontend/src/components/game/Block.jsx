import { useRef, useEffect, useState } from 'react'
import { BLOCK_CANVAS_SIZE, PIXEL_COLORS } from '../../lib/constants'

const CELL = 3

const SET_COLORS = {
  PRIMARY: '#e63946', MIDNIGHT: '#9b5de5', PHILIPPINES: '#ffd166',
  GRASS: '#06d6a0',   SUNSET: '#f4a261',
}

function getDominantColor(pixelLayout, pixelCount) {
  if (pixelCount === 0) return null
  const counts = {}
  for (const row of pixelLayout) {
    for (const color of row) {
      if (color && color !== 'white') counts[color] = (counts[color] ?? 0) + 1
    }
  }
  let best = null, bestN = 0
  for (const [color, n] of Object.entries(counts)) {
    if (n > bestN) { best = color; bestN = n }
  }
  return best
}

export default function Block({ block, size = 48, showPulse = false, onClick }) {
  const canvasRef = useRef(null)
  const [pulsing, setPulsing] = useState(false)

  useEffect(() => { drawCanvas() }, [block.pixelLayout])

  useEffect(() => {
    if (showPulse && block.pixelCount > 0) {
      setPulsing(true)
      const t = setTimeout(() => setPulsing(false), 350)
      return () => clearTimeout(t)
    }
  }, [showPulse])

  // Cycle duration = time to produce ~1 pixel (37.5 / pixelCount), clamped to 0.4–8s
  const cycleDuration = block.pixelCount > 0
    ? Math.max(0.4, Math.min(8, 37.5 / block.pixelCount))
    : 3

  function drawCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (let r = 0; r < BLOCK_CANVAS_SIZE; r++) {
      for (let c = 0; c < BLOCK_CANVAS_SIZE; c++) {
        const color = block.pixelLayout[r]?.[c]
        if (color && PIXEL_COLORS[color]) {
          ctx.fillStyle = PIXEL_COLORS[color].hex
          ctx.fillRect(c * CELL, r * CELL, CELL, CELL)
        }
      }
    }
  }

  const canvasSize = BLOCK_CANVAS_SIZE * CELL
  const fillRatio  = Math.min(1, block.pixelCount / (BLOCK_CANVAS_SIZE * BLOCK_CANVAS_SIZE))
  const domColor   = getDominantColor(block.pixelLayout, block.pixelCount)
  const fillHex    = domColor ? (PIXEL_COLORS[domColor]?.hex ?? '#118ab2') : '#118ab2'
  const isActive   = showPulse && block.pixelCount > 0 && block.pauseTimer === 0

  return (
    <div
      onClick={onClick}
      className="relative rounded overflow-hidden cursor-pointer select-none"
      style={{
        width: size, height: size,
        boxShadow: pulsing ? `0 0 10px 3px ${fillHex}66` : undefined,
        transition: 'box-shadow 0.35s ease-out',
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{ width: size, height: size, imageRendering: 'pixelated', display: 'block' }}
      />

      {/* Static pixel-count fill overlay */}
      {fillRatio > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: `${fillRatio * 100}%`,
            backgroundColor: `${fillHex}12`,
            transition: 'height 0.2s ease-out',
          }}
        />
      )}

      {/* Production cycle fill animation — rises bottom-to-top */}
      {isActive && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${fillHex}55 0%, ${fillHex}20 60%, transparent 100%)`,
            transformOrigin: 'bottom center',
            animation: `blockFillUp ${cycleDuration.toFixed(2)}s ease-in-out infinite`,
          }}
        />
      )}

      {/* Active set badge (top-right dot) */}
      {block.activeSet && (
        <div
          className="absolute top-0 right-0 w-2 h-2 rounded-bl-sm"
          style={{ backgroundColor: SET_COLORS[block.activeSet] ?? '#fff' }}
          title={block.activeSet}
        />
      )}

      {/* Color checker target dot (top-left) */}
      {block.type === 'color_checker' && block.colorCheckerColor && (
        <div
          className="absolute top-0 left-0 w-2 h-2 rounded-br-sm"
          style={{ backgroundColor: PIXEL_COLORS[block.colorCheckerColor]?.hex ?? '#fff', opacity: block.colorCheckerTriggered ? 1 : 0.5 }}
          title={`Target: ${block.colorCheckerColor}${block.colorCheckerTriggered ? ' ✓' : ''}`}
        />
      )}

      {/* Move cooldown overlay */}
      {block.pauseTimer > 0 && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-white text-xs font-bold">{Math.ceil(block.pauseTimer / 1000)}s</span>
        </div>
      )}

      {/* Type badge */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-center" style={{ fontSize: 7, lineHeight: '10px' }}>
        <span className="text-gray-300 uppercase tracking-wider">{block.type.replace('_', '').slice(0, 4)}</span>
      </div>
    </div>
  )
}
