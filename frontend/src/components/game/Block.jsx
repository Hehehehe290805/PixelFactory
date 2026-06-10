import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BLOCK_CANVAS_SIZE, PIXEL_COLORS } from '../../lib/constants'

const CELL = 3

const SET_COLORS = {
  PRIMARY: '#e63946', MIDNIGHT: '#9b5de5', PHILIPPINES: '#ffd166',
  GRASS: '#06d6a0',   SUNSET: '#f4a261',   SILVER_MIST: '#9db4cc',
  NEON_RUSH: '#39ff14', AURORA: '#a0c4ff',  SUNRISE: '#ffc000',
  OCEAN: '#1499cc',   FIRE: '#f03e4e',     ROYAL: '#a066f0',
  EMBER: '#f59342',   TROPICS: '#00d49a',  CORAL: '#f87171',
}

// Maps waveDir to CSS animation name + transform-origin
const WAVE_MAP = {
  up:         { anim: 'pixelWaveV', origin: 'bottom center' },
  down:       { anim: 'pixelWaveV', origin: 'top center' },
  left:       { anim: 'pixelWaveH', origin: 'right center' },
  right:      { anim: 'pixelWaveH', origin: 'left center' },
  'up-left':  { anim: 'pixelWaveD', origin: 'bottom right' },
  'up-right': { anim: 'pixelWaveD', origin: 'bottom left' },
  'down-left':{ anim: 'pixelWaveD', origin: 'top right' },
  'down-right':{ anim: 'pixelWaveD', origin: 'top left' },
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
  const [floatKey, setFloatKey] = useState(0)

  useEffect(() => { drawCanvas() }, [block.pixelLayout])

  useEffect(() => {
    if (showPulse && block.pixelCount > 0) {
      setPulsing(true)
      const t = setTimeout(() => setPulsing(false), 350)
      return () => clearTimeout(t)
    }
  }, [showPulse])

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

  const canvasSize   = BLOCK_CANVAS_SIZE * CELL
  const fillRatio    = Math.min(1, block.pixelCount / (BLOCK_CANVAS_SIZE * BLOCK_CANVAS_SIZE))
  const domColor     = getDominantColor(block.pixelLayout, block.pixelCount)
  const fillHex      = domColor ? (PIXEL_COLORS[domColor]?.hex ?? '#118ab2') : '#118ab2'
  const isActive     = showPulse && block.pixelCount > 0 && block.pauseTimer === 0
  const waveDir      = block.waveDir ?? 'up'
  const waveConf     = WAVE_MAP[waveDir] ?? WAVE_MAP.up
  // Cycle duration: 37.5 / pixelCount seconds (1 pixel per cycle at base rate), clamped
  const cycleDuration = block.pixelCount > 0
    ? Math.max(0.4, Math.min(8, 37.5 / block.pixelCount))
    : 3

  const floatAmount = `+${Math.max(1, Math.round(block.pixelCount / 37.5))}`

  return (
    <div
      onClick={onClick}
      className="relative rounded cursor-pointer select-none"
      style={{
        width: size, height: size,
        boxShadow: pulsing ? `0 0 10px 3px ${fillHex}66` : undefined,
        transition: 'box-shadow 0.35s ease-out',
      }}
    >
      {/* Clipped inner layer — canvas + overlays */}
      <div className="absolute inset-0 rounded overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          style={{ width: size, height: size, imageRendering: 'pixelated', display: 'block' }}
        />

        {/* Pixel-fill indicator */}
        {fillRatio > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              height: `${fillRatio * 100}%`,
              backgroundColor: `${fillHex}10`,
              transition: 'height 0.2s ease-out',
            }}
          />
        )}

        {/* Directional wave */}
        {isActive && (
          <div
            className="absolute inset-0 pointer-events-none"
            onAnimationIteration={() => setFloatKey(k => k + 1)}
            style={{
              background: `linear-gradient(
                ${waveDir === 'right' || waveDir === 'left' ? '90deg' : '0deg'},
                transparent 0%,
                rgba(255,255,255,0.55) 50%,
                transparent 100%
              )`,
              mixBlendMode: 'screen',
              transformOrigin: waveConf.origin,
              animation: `${waveConf.anim} ${cycleDuration.toFixed(2)}s ease-in-out infinite`,
            }}
          />
        )}
      </div>

      {/* Float — rises above the block on each wave cycle */}
      <AnimatePresence>
        {floatKey > 0 && (
          <motion.div
            key={floatKey}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -20 }}
            exit={{}}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="absolute pointer-events-none select-none font-black text-pixel-green"
            style={{ fontSize: 10, bottom: '100%', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', zIndex: 50 }}
          >
            {floatAmount}
          </motion.div>
        )}
      </AnimatePresence>

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
          style={{
            backgroundColor: PIXEL_COLORS[block.colorCheckerColor]?.hex ?? '#fff',
            opacity: block.colorCheckerTriggered ? 1 : 0.5,
          }}
          title={`Target: ${block.colorCheckerColor}${block.colorCheckerTriggered ? ' ✓' : ''}`}
        />
      )}

      {/* Focus color indicator (top-left, for focus blocks) */}
      {block.type === 'focus' && block.focusColor && (
        <div
          className="absolute top-0 left-0 w-2 h-2 rounded-br-sm"
          style={{ backgroundColor: PIXEL_COLORS[block.focusColor]?.hex ?? '#fff', opacity: 0.8 }}
          title={`Focus: ${block.focusColor}`}
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
