import { useState, useMemo, useCallback } from 'react'
import { DESIGNS } from '../../data/designLibrary'
import { BLOCK_TYPES, BLOCK_TYPE_VISUAL } from '../../lib/constants'
import { tooltipPos } from '../../lib/tooltipPos'
import { DesignMiniThumb, DesignTooltipBody } from './DeckSelector'

const MAX_SHOP_DECK = 8

export default function ShopDeckSelector({ unlockedDesigns, onConfirm, levelNumber }) {
  const [selected, setSelected]     = useState([])
  const [seriesFilter, setFilter]   = useState('all')
  const [hoveredId, setHoveredId]   = useState(null)
  const [mousePos, setMousePos]     = useState({ x: 0, y: 0 })
  const handleMouseMove = useCallback((e) => setMousePos({ x: e.clientX, y: e.clientY }), [])

  const allSeries = useMemo(() => {
    const s = new Set(unlockedDesigns.map(d => d.series))
    return ['all', ...s]
  }, [unlockedDesigns])

  const filtered = useMemo(() =>
    unlockedDesigns.filter(d => seriesFilter === 'all' || d.series === seriesFilter),
    [unlockedDesigns, seriesFilter]
  )

  function toggle(id) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= MAX_SHOP_DECK) return prev
      return [...prev, id]
    })
  }

  const hoveredDesign = hoveredId ? DESIGNS.find(d => d.id === hoveredId) : null
  const tipW = 172
  const { x: tipX, y: tipY } = tooltipPos(mousePos.x, mousePos.y, tipW, 280)

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4"
      style={{ background: 'rgba(3,3,14,0.92)' }}
      onMouseMove={handleMouseMove}
    >
      <div className="card w-full max-w-2xl max-h-[92vh] flex flex-col" style={{ padding: '1.5rem' }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: '#3c3c72' }}>
              Level {levelNumber}
            </div>
            <h2 className="text-2xl font-black pixel-heading" style={{ color: '#ddd8f8' }}>Shop Deck</h2>
            <p className="text-xs mt-1" style={{ color: '#3c3c72' }}>
              Pick up to {MAX_SHOP_DECK} designs — these will be available to buy in the level shop
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <div className="font-black text-2xl" style={{ color: selected.length >= MAX_SHOP_DECK ? '#fbbf24' : '#ddd8f8' }}>
              {selected.length}/{MAX_SHOP_DECK}
            </div>
            <div className="text-xs font-bold uppercase" style={{ color: '#3c3c72' }}>selected</div>
          </div>
        </div>

        {/* Selected strip */}
        {selected.length > 0 && (
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {selected.map(id => {
              const d = DESIGNS.find(x => x.id === id)
              if (!d) return null
              return (
                <button
                  key={id}
                  onClick={() => setSelected(prev => prev.filter(x => x !== id))}
                  className="rounded-lg border px-1.5 py-1 flex items-center gap-1.5 transition"
                  style={{ background: '#6366f115', borderColor: '#6366f144' }}
                  title="Click to remove"
                >
                  <DesignMiniThumb design={d} size={18} />
                  <span className="text-[10px] font-black" style={{ color: '#ddd8f8' }}>{d.name}</span>
                  <span className="text-[9px]" style={{ color: '#f87171' }}>×</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Series filter */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {allSeries.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="text-xs font-black px-2 py-1 rounded-lg border transition capitalize"
              style={seriesFilter === s
                ? { background: '#6366f120', borderColor: '#6366f1', color: '#6366f1' }
                : { background: 'transparent', borderColor: '#1e1e48', color: '#3c3c72' }
              }
            >
              {s}
            </button>
          ))}
        </div>

        {/* Design grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))' }}>
            {filtered.map(design => {
              const isSelected = selected.includes(design.id)
              const typeColor  = BLOCK_TYPE_VISUAL?.[design.blockType]?.color ?? '#6366f1'
              return (
                <button
                  key={design.id}
                  onClick={() => toggle(design.id)}
                  onMouseEnter={() => setHoveredId(design.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="rounded-xl border flex flex-col items-center gap-1.5 p-2 transition"
                  style={{
                    background: isSelected ? '#6366f118' : '#0c0c28',
                    borderColor: isSelected ? '#6366f1' : '#1e1e48',
                    boxShadow: isSelected ? 'var(--glow-indigo)' : 'none',
                    opacity: !isSelected && selected.length >= MAX_SHOP_DECK ? 0.35 : 1,
                  }}
                >
                  <DesignMiniThumb design={design} size={44} />
                  <div className="text-[9px] font-black text-center leading-tight" style={{ color: '#ddd8f8' }}>
                    {design.name}
                  </div>
                  <div className="text-[8px] font-bold capitalize" style={{ color: typeColor }}>
                    {BLOCK_TYPES[design.blockType]?.label ?? design.blockType}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-4 pt-4 border-t" style={{ borderColor: '#1e1e48' }}>
          <button
            onClick={() => onConfirm(selected)}
            disabled={selected.length === 0}
            className="btn btn-primary flex-1 text-base"
            style={selected.length === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
          >
            Start Level →
          </button>
          {selected.length > 0 && (
            <button
              onClick={() => setSelected([])}
              className="btn btn-secondary text-sm px-4"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDesign && (
        <div
          style={{ position: 'fixed', left: tipX, top: tipY, width: tipW, zIndex: 90, pointerEvents: 'none', background: '#0c0c28', border: '1px solid #1e1e48', borderRadius: 12, padding: '0.625rem', display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          <DesignTooltipBody design={hoveredDesign} />
        </div>
      )}
    </div>
  )
}
