import { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function RadialWheel({ x, y, items, onDismiss }) {
  if (!items || items.length === 0) return null

  const n = items.length
  // Scale radius with item count so they don't overlap
  const radius = n <= 3 ? 72 : n <= 6 ? 86 : 102

  // Clamp center so items never go off-screen
  const pad = radius + 44
  const cx = Math.max(pad, Math.min(window.innerWidth  - pad, x))
  const cy = Math.max(pad, Math.min(window.innerHeight - pad, y))

  // Dismiss on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onDismiss() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  return (
    <>
      {/* Invisible dismiss backdrop */}
      <div className="fixed inset-0 z-50" onClick={onDismiss} />

      {/* Wheel hub + arms */}
      <div
        className="fixed z-50 pointer-events-none"
        style={{ left: cx, top: cy, transform: 'translate(-50%, -50%)' }}
      >
        {/* Hub dot */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute rounded-full border-2 border-white/30"
          style={{ width: 10, height: 10, left: -5, top: -5, background: '#ffffff20' }}
        />

        {items.map((item, i) => {
          // Distribute items in a full circle, start from top (−90°)
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2
          const ix = Math.round(Math.cos(angle) * radius)
          const iy = Math.round(Math.sin(angle) * radius)
          const col = item.color ?? '#1499cc'

          return (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.025, type: 'spring', stiffness: 420, damping: 26 }}
              className="absolute pointer-events-auto"
              style={{ left: ix - 28, top: iy - 28 }}
            >
              <button
                onClick={e => { e.stopPropagation(); item.onClick() }}
                className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5
                  transition-transform duration-100 hover:scale-110 active:scale-95 select-none"
                style={{
                  background: col + '22',
                  border: `2px solid ${col}`,
                  boxShadow: `0 0 14px ${col}44, inset 0 1px 0 #ffffff14`,
                }}
              >
                {item.icon  && <span className="text-lg leading-none">{item.icon}</span>}
                {item.content}
                <span
                  className="font-black uppercase leading-tight text-center"
                  style={{ fontSize: 8, color: col, marginTop: item.content ? 1 : 0 }}
                >
                  {item.label}
                </span>
              </button>
            </motion.div>
          )
        })}
      </div>
    </>
  )
}
