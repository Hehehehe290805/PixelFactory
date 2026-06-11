import { useState, useMemo, useCallback } from 'react'
import { DESIGNS, getDesignLevelCost } from '../../data/designLibrary'
import { useGameStore } from '../../store/gameStore'
import { MAX_DECK, BLOCK_TYPES, BLOCK_TYPE_VISUAL } from '../../lib/constants'
import { getDesignSynergies } from '../../engine/designSynergies'
import { tooltipPos } from '../../lib/tooltipPos'

// ── Deck Selector ─────────────────────────────────────────────────────────────
// Deck = up to MAX_DECK (3) unique designs.
// No pre-buy phase. Level starts with 2 copies of each selected design in inventory.

export default function DeckSelector({ levelNumber, unlockedDesigns, onConfirm, onBack, bargain = false }) {
  const { deckSelection } = useGameStore()

  const [deck, setDeck]           = useState(() => [...new Set((deckSelection ?? []).slice(0, MAX_DECK))])
  const [seriesFilter, setFilter] = useState('all')
  const [hoveredId, setHoveredId] = useState(null)
  const [mousePos, setMousePos]   = useState({ x: 0, y: 0 })

  function randomize() {
    if (!unlockedDesigns.length) return
    const count = Math.floor(Math.random() * 3) + 1
    const shuffled = [...unlockedDesigns].sort(() => Math.random() - 0.5)
    setDeck(shuffled.slice(0, Math.min(count, shuffled.length)).map(d => d.id))
  }

  const handleMouseMove = useCallback((e) => setMousePos({ x: e.clientX, y: e.clientY }), [])

  const allSeries = useMemo(() => {
    const s = new Set(unlockedDesigns.map(d => d.series))
    return ['all', ...s]
  }, [unlockedDesigns])

  const filtered = useMemo(() =>
    unlockedDesigns.filter(d => seriesFilter === 'all' || d.series === seriesFilter),
    [unlockedDesigns, seriesFilter]
  )

  function toggleDesign(id) {
    setDeck(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= MAX_DECK) return prev
      return [...prev, id]
    })
  }

  function handleConfirm() {
    if (deck.length === 0) return
    onConfirm({ designIds: deck })
  }

  const hoveredDesign = hoveredId ? DESIGNS.find(d => d.id === hoveredId) : null

  const tipW = 168
  const { x: tipX, y: tipY } = tooltipPos(mousePos.x, mousePos.y, tipW, 260)

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 px-4"
      onMouseMove={handleMouseMove}
    >
      <div className="card w-full max-w-2xl max-h-[92vh] flex flex-col" style={{ padding: '1.5rem' }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-0.5">Level {levelNumber}</div>
            <h2 className="text-2xl font-black text-white pixel-heading">Choose Your Deck</h2>
            <p className="text-xs text-gray-500 mt-1">
              Pick up to {MAX_DECK} designs — your first 6 cards
            </p>
            <p className="text-[10px] text-gray-700 mt-0.5">
              1 design = 6 copies · 2 designs = 3 each · 3 designs = 2 each
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <div className={`font-black text-xl ${deck.length >= MAX_DECK ? 'text-pixel-yellow' : 'text-white'}`}>
              {deck.length}/{MAX_DECK}
            </div>
            <div className="text-xs text-gray-600 font-bold uppercase">selected</div>
          </div>
        </div>

        {/* Selected deck strip */}
        {deck.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {deck.map((id, i) => {
              const d = DESIGNS.find(x => x.id === id)
              if (!d) return null
              return (
                <button
                  key={i}
                  onClick={() => {
                    setDeck(prev => {
                      const idx = prev.lastIndexOf(id)
                      return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
                    })
                  }}
                  title="Click to remove"
                  className="flex items-center gap-1.5 rounded-lg border-2 border-pixel-green/40 bg-pixel-green/10 px-2 py-1 hover:border-red-500/50 hover:bg-red-500/10 transition"
                >
                  <DesignMiniThumb design={d} size={20} />
                  <span className="text-[10px] font-black text-pixel-green truncate max-w-[64px]">{d.name}</span>
                  <span className="text-[10px] text-gray-600">✕</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Series filter */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {allSeries.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs font-black px-2.5 py-1 rounded-lg border transition capitalize
                ${seriesFilter === s
                  ? 'bg-pixel-blue/20 border-pixel-blue text-pixel-blue'
                  : 'border-game-border text-gray-500 hover:text-white'}`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Design grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-5 gap-2">
            {filtered.map(design => {
              const selected = deck.includes(design.id)
              const disabled = !selected && deck.length >= MAX_DECK
              return (
                <button
                  key={design.id}
                  onClick={() => !disabled && toggleDesign(design.id)}
                  onMouseEnter={() => setHoveredId(design.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`relative rounded-xl border-2 flex flex-col items-center p-1.5 gap-1 transition
                    ${selected  ? 'border-pixel-green bg-pixel-green/10'
                    : disabled  ? 'border-game-border opacity-30 cursor-not-allowed'
                                : 'border-game-border hover:border-pixel-blue cursor-pointer'}`}
                  style={{ background: selected ? undefined : '#0d0d22' }}
                >
                  <DesignMiniThumb design={design} size={44} />
                  <span className="text-[10px] font-black text-center leading-tight text-gray-300 truncate w-full">{design.name}</span>
                  {selected && (
                    <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-pixel-green flex items-center justify-center">
                      <span style={{ fontSize: 8, color: '#000', fontWeight: 900 }}>✓</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-4 flex-shrink-0">
          <button onClick={onBack} className="btn btn-secondary px-4 py-2 text-sm">← Back</button>
          <button
            onClick={randomize}
            className="btn btn-secondary px-4 py-2 text-sm flex-shrink-0"
            title="Randomly pick 1–3 designs"
          >
            🎲 Random
          </button>
          <button
            onClick={handleConfirm}
            disabled={deck.length === 0}
            className={`btn flex-1 text-base ${deck.length > 0 ? 'btn-primary' : 'btn-secondary opacity-50'}`}
          >
            {deck.length === 0 ? 'Pick at least 1' : `Start →`}
          </button>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredDesign && (
        <div
          style={{ position: 'fixed', left: tipX, top: tipY, width: tipW, zIndex: 90, pointerEvents: 'none', background: '#0d0d22' }}
          className="rounded-xl border-2 border-game-border p-3 flex flex-col gap-2"
        >
          <DesignTooltipBody design={hoveredDesign} cost={getDesignLevelCost(hoveredDesign, bargain)} />
        </div>
      )}
    </div>
  )
}

// ── Tiny design thumbnail ─────────────────────────────────────────────────────
export function DesignMiniThumb({ design, size = 32, centered = false }) {
  if (!design?.pixelLayout) return <div style={{ width: size, height: size }} className="bg-gray-800 rounded" />
  const cellSize = size / 16
  return (
    <div
      style={{ width: size, height: size, flexShrink: 0, ...(centered ? { margin: '0 auto' } : {}) }}
      className="rounded overflow-hidden"
    >
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(16, ${cellSize}px)` }}>
        {design.pixelLayout.flat().map((color, i) => (
          <div
            key={i}
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: color ? COLOR_HEX[color] ?? '#888' : 'transparent',
            }}
          />
        ))}
      </div>
    </div>
  )
}

const COLOR_HEX = {
  red:     '#f03e4e',
  orange:  '#f59342',
  yellow:  '#ffd166',
  green:   '#00d49a',
  blue:    '#1499cc',
  violet:  '#a066f0',
  white:   '#f0f0fa',
  silver:  '#9db4cc',
  gold:    '#ffc000',
  neon:    '#39ff14',
  rainbow: '#ff6b9d',
}

// ── Shared tooltip body ───────────────────────────────────────────────────────
export function DesignTooltipBody({ design, cost, blockType }) {
  const synergies = getDesignSynergies(design)
  // blockType prop = the randomly-assigned type for this instance (if known)
  const displayType = blockType ?? design.blockType
  const typeInfo    = BLOCK_TYPES[displayType]
  return (
    <>
      <DesignMiniThumb design={design} size={72} centered />
      <div className="text-sm font-black text-white leading-tight">{design.name}</div>
      <div className="flex items-center justify-between gap-1">
        <div className="text-xs font-bold capitalize" style={{ color: BLOCK_TYPE_VISUAL?.[displayType]?.color ?? '#1499cc' }}>
          {typeInfo?.label ?? displayType.replace(/_/g, ' ')}
        </div>
        <div className="text-xs text-gray-600 capitalize">{design.series}</div>
      </div>

      {/* Block type effect description */}
      {typeInfo?.desc && (
        <div className="text-[10px] text-gray-300 leading-snug py-1 px-1.5 rounded-lg" style={{ background: '#ffffff08' }}>
          {typeInfo.desc}
        </div>
      )}

      {synergies.length > 0 && (
        <div className="pt-1 border-t border-game-border">
          <div className="text-[10px] font-black uppercase tracking-wide text-gray-600 mb-1">Synergies</div>
          {synergies.map(name => (
            <div key={name} className="text-[10px] text-pixel-blue/80 leading-snug">· {name}</div>
          ))}
        </div>
      )}
      {cost != null && (
        <div className="text-xs text-pixel-yellow font-bold pt-0.5">{cost}px in shop</div>
      )}
      {!blockType && (
        <div className="text-[9px] text-gray-700 border-t border-game-border pt-1 italic">
          Actual type assigned randomly on purchase
        </div>
      )}
    </>
  )
}
