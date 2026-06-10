import { useState, useMemo, useCallback } from 'react'
import { DESIGNS, getDesignLevelCost } from '../../data/designLibrary'
import { createBlock, useGameStore } from '../../store/gameStore'
import { getStartingPixelBudget } from '../../lib/constants'

const MAX_DECK = 10

// ── Pre-buy phase ─────────────────────────────────────────────────────────────
function PreBuyPhase({ deck, levelNumber, onStart, onBack, bargain }) {
  const budget = getStartingPixelBudget(levelNumber)
  const [spent, setSpent]       = useState(0)
  const [preBought, setPreBought] = useState({}) // { designId: count }

  const balance = budget - spent

  function buy(designId) {
    const cost = getDesignLevelCost(DESIGNS.find(d => d.id === designId), bargain)
    if (balance < cost) return
    setSpent(s => s + cost)
    setPreBought(pb => ({ ...pb, [designId]: (pb[designId] ?? 0) + 1 }))
  }

  function handleStart() {
    // Build the starting inventory from pre-bought designs
    const startingBlocks = []
    for (const [id, count] of Object.entries(preBought)) {
      for (let i = 0; i < count; i++) {
        const b = createBlock(id)
        if (b) startingBlocks.push(b)
      }
    }
    onStart({ startingBlocks, preBoughtDesignIds: deck })
  }

  const totalPreBought = Object.values(preBought).reduce((s, n) => s + n, 0)

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 px-4">
      <div className="card w-full max-w-md max-h-[90vh] flex flex-col" style={{ padding: '1.5rem' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-0.5">Pre-Buy</div>
            <h2 className="text-xl font-black text-white pixel-heading">Starting Designs</h2>
            <p className="text-xs text-gray-500 mt-1">Buy designs from your deck to start with them in hand</p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <div className="text-pixel-yellow font-black text-xl">{balance}</div>
            <div className="text-xs text-gray-600 font-bold uppercase">px budget</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 -mx-1 px-1">
          {deck.map(designId => {
            const design = DESIGNS.find(d => d.id === designId)
            if (!design) return null
            const cost = getDesignLevelCost(design, bargain)
            const canAfford = balance >= cost
            const count = preBought[designId] ?? 0
            return (
              <button
                key={designId}
                onClick={() => buy(designId)}
                disabled={!canAfford}
                className={`w-full rounded-xl border-2 flex items-center gap-3 px-3 py-2 text-left transition
                  ${canAfford ? 'border-game-border hover:border-pixel-blue cursor-pointer' : 'border-game-border opacity-40 cursor-not-allowed'}`}
                style={{ background: '#0d0d22' }}
              >
                <DesignMiniThumb design={design} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-white truncate">{design.name}</div>
                  <div className="text-xs text-gray-500 truncate">{design.series} · {design.blockType}</div>
                </div>
                {count > 0 && <span className="text-xs font-black text-pixel-green">×{count}</span>}
                <span className="text-xs font-black text-pixel-yellow flex-shrink-0">{cost}px</span>
              </button>
            )
          })}
        </div>

        <div className="flex gap-3 mt-4 flex-shrink-0">
          <button onClick={onBack} className="btn btn-secondary px-4 py-2 text-sm">← Back</button>
          <button onClick={handleStart} className="btn btn-primary flex-1 text-base">
            {totalPreBought > 0 ? `Start with ${totalPreBought} design${totalPreBought > 1 ? 's' : ''}` : 'Start Level'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Deck Selector ─────────────────────────────────────────────────────────────
export default function DeckSelector({ levelNumber, unlockedDesigns, onConfirm, onBack, bargain = false }) {
  const { deckSelection } = useGameStore()
  const [deck, setDeck]           = useState(() => deckSelection ?? [])
  const [seriesFilter, setFilter] = useState('all')
  const [hoveredId, setHoveredId] = useState(null)
  const [mousePos, setMousePos]   = useState({ x: 0, y: 0 })
  const [phase, setPhase]         = useState('select') // 'select' | 'prebuy'

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

  const hoveredDesign = hoveredId ? DESIGNS.find(d => d.id === hoveredId) : null

  if (phase === 'prebuy') {
    return (
      <PreBuyPhase
        deck={deck}
        levelNumber={levelNumber}
        bargain={bargain}
        onStart={onConfirm}
        onBack={() => setPhase('select')}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 px-4">
      <div className="card w-full max-w-2xl max-h-[92vh] flex flex-col" style={{ padding: '1.5rem' }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-0.5">Level {levelNumber}</div>
            <h2 className="text-2xl font-black text-white pixel-heading">Choose Your Deck</h2>
            <p className="text-xs text-gray-500 mt-1">Pick up to {MAX_DECK} designs to bring into this level</p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <div className={`font-black text-xl ${deck.length >= MAX_DECK ? 'text-pixel-yellow' : 'text-white'}`}>
              {deck.length}/{MAX_DECK}
            </div>
            <div className="text-xs text-gray-600 font-bold uppercase">selected</div>
          </div>
        </div>

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
        <div className="flex-1 overflow-y-auto min-h-0" onMouseMove={handleMouseMove}>
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
                    ${selected    ? 'border-pixel-green bg-pixel-green/10'
                    : disabled    ? 'border-game-border opacity-30 cursor-not-allowed'
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

        {/* Hover tooltip — fixed, follows cursor, never affects layout */}
        {hoveredDesign && (() => {
          const tipW = 168
          const margin = 16
          const x = mousePos.x + margin + tipW > window.innerWidth
            ? mousePos.x - tipW - margin
            : mousePos.x + margin
          const y = Math.min(mousePos.y - 8, window.innerHeight - 260)
          return (
            <div
              style={{ position: 'fixed', left: x, top: y, width: tipW, zIndex: 200, pointerEvents: 'none', background: '#0d0d22' }}
              className="rounded-xl border-2 border-game-border p-3 flex flex-col gap-2"
            >
              <DesignMiniThumb design={hoveredDesign} size={80} centered />
              <div className="text-sm font-black text-white">{hoveredDesign.name}</div>
              <div className="text-xs text-gray-500 capitalize">{hoveredDesign.series}</div>
              <div className="text-xs text-pixel-blue font-bold capitalize">{hoveredDesign.blockType.replace(/_/g, ' ')}</div>
              <div className="text-xs text-gray-400 leading-snug">{hoveredDesign.desc}</div>
              <div className="text-xs text-pixel-yellow font-bold">
                {getDesignLevelCost(hoveredDesign, bargain)}px in shop
              </div>
            </div>
          )
        })()}

        {/* Footer */}
        <div className="flex gap-3 mt-4 flex-shrink-0">
          <button onClick={onBack} className="btn btn-secondary px-4 py-2 text-sm">← Back</button>
          <button
            onClick={() => deck.length > 0 && setPhase('prebuy')}
            disabled={deck.length === 0}
            className={`btn flex-1 text-base ${deck.length > 0 ? 'btn-primary' : 'btn-secondary opacity-50'}`}
          >
            {deck.length === 0 ? 'Pick at least 1' : `Confirm Deck (${deck.length}) →`}
          </button>
        </div>
      </div>
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

// Color hex values for rendering pixel art thumbnails
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
