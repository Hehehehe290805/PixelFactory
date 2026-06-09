import { useState } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '../../store/userStore'
import { PIXEL_COLORS, BLOCK_CANVAS_SIZE } from '../../lib/constants'
import { sanitizePlainText } from '../../lib/validate'

const SET_COLORS = {
  PRIMARY: '#f03e4e', MIDNIGHT: '#a066f0', PHILIPPINES: '#ffd166',
  GRASS: '#00d49a',   SUNSET: '#f59342',
}

function Preview({ pixelLayout }) {
  const CELL = 10
  return (
    <div
      className="rounded-xl overflow-hidden border-2 border-game-border mx-auto"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${BLOCK_CANVAS_SIZE}, ${CELL}px)`,
        width: BLOCK_CANVAS_SIZE * CELL,
        imageRendering: 'pixelated',
      }}
    >
      {Array.from({ length: BLOCK_CANVAS_SIZE }, (_, r) =>
        Array.from({ length: BLOCK_CANVAS_SIZE }, (_, c) => {
          const color = pixelLayout[r]?.[c]
          return <div key={`${r}-${c}`} style={{ width: CELL, height: CELL, backgroundColor: color ? PIXEL_COLORS[color]?.hex : '#0a0a18' }} />
        })
      )}
    </div>
  )
}

export default function TemplateSaveModal({ block, setName, onSave, onSkip }) {
  const [name, setName_] = useState(`My ${setName}`)
  const { templates } = useUserStore()
  const setColor = SET_COLORS[setName] ?? '#888'

  const maxSlots = 5 + (templates.filter(t => t.is_official).length > 0 ? 0 : 0)
  const userTemplates = templates.filter(t => !t.is_official)
  const full = userTemplates.length >= 5

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card w-full max-w-sm text-center"
        style={{ padding: '2rem', borderColor: setColor + '66' }}
      >
        <div className="text-3xl font-black pixel-heading mb-1" style={{ color: setColor }}>
          {setName} Set!
        </div>
        <p className="text-gray-400 text-sm font-semibold mb-5">
          You discovered a new pixel set in-level. Save this block as a template?
        </p>

        <Preview pixelLayout={block.pixelLayout} />

        {full ? (
          <p className="text-xs font-semibold text-pixel-red mt-4">
            Template slots full (5/5). Buy more in the Shop.
          </p>
        ) : (
          <div className="mt-4">
            <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-1.5 text-left">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName_(sanitizePlainText(e.target.value))}
              maxLength={30}
              className="input"
            />
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button onClick={onSkip} className="btn btn-secondary flex-1 text-sm">Skip</button>
          <button
            onClick={() => onSave(sanitizePlainText(name))}
            disabled={full}
            className="btn btn-primary flex-1 text-sm disabled:opacity-40"
          >
            Save Template
          </button>
        </div>
      </motion.div>
    </div>
  )
}
