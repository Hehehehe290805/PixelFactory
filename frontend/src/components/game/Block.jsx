import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BLOCK_CANVAS_SIZE } from '../../lib/constants'

const CELL = 3

// Maps waveDir to CSS animation name + transform-origin
const WAVE_MAP = {
  up:          { anim: 'pixelWaveV', origin: 'bottom center' },
  down:        { anim: 'pixelWaveV', origin: 'top center' },
  left:        { anim: 'pixelWaveH', origin: 'right center' },
  right:       { anim: 'pixelWaveH', origin: 'left center' },
  'up-left':   { anim: 'pixelWaveD', origin: 'bottom right' },
  'up-right':  { anim: 'pixelWaveD', origin: 'bottom left' },
  'down-left': { anim: 'pixelWaveD', origin: 'top right' },
  'down-right':{ anim: 'pixelWaveD', origin: 'top left' },
}

// Color hex map (design library uses these keys)
const COLOR_HEX = {
  red:'#f03e4e', orange:'#f59342', yellow:'#ffd166', green:'#00d49a',
  blue:'#1499cc', violet:'#a066f0', white:'#f0f0fa', silver:'#9db4cc',
  gold:'#ffc000', neon:'#39ff14', rainbow:'#ff6b9d',
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
        const color = block.pixelLayout?.[r]?.[c]
        if (color && COLOR_HEX[color]) {
          ctx.fillStyle = COLOR_HEX[color]
          ctx.fillRect(c * CELL, r * CELL, CELL, CELL)
        }
      }
    }
  }

  const canvasSize     = BLOCK_CANVAS_SIZE * CELL
  const fillRatio      = Math.min(1, block.pixelCount / (BLOCK_CANVAS_SIZE * BLOCK_CANVAS_SIZE))
  const fillHex        = block.dominantColor ? (COLOR_HEX[block.dominantColor] ?? '#118ab2') : '#118ab2'
  const isActive       = showPulse && block.pixelCount > 0 && block.pauseTimer === 0
  const waveDir        = block.waveDir ?? 'up'
  const waveConf       = WAVE_MAP[waveDir] ?? WAVE_MAP.up
  const cycleDuration  = 3.5
  const floatAmount    = '+1'

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
      <div className="absolute inset-0 rounded overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          style={{ width: size, height: size, imageRendering: 'pixelated', display: 'block' }}
        />

        {/* Fill ratio indicator */}
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
                transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%
              )`,
              mixBlendMode: 'screen',
              transformOrigin: waveConf.origin,
              animation: `${waveConf.anim} ${cycleDuration.toFixed(2)}s ease-in-out infinite`,
            }}
          />
        )}
      </div>

      {/* Floating +N */}
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

      {/* Active synergy dot (top-right) */}
      {block.activeSynergy && (
        <div
          className="absolute top-0 right-0 w-2 h-2 rounded-bl-sm bg-pixel-green"
          title={block.activeSynergy}
        />
      )}

      {/* Color checker triggered indicator */}
      {block.type === 'color_checker' && (
        <div
          className="absolute top-0 left-0 w-2 h-2 rounded-br-sm"
          style={{
            backgroundColor: fillHex,
            opacity: block.colorCheckerTriggered ? 1 : 0.4,
          }}
          title={block.colorCheckerTriggered ? 'Triggered ✓' : 'Not yet triggered'}
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
        <span className="text-gray-300 uppercase tracking-wider">{block.type.replace(/_/g, '').slice(0, 4)}</span>
      </div>
    </div>
  )
}
