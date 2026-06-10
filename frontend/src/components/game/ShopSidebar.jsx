import { useState, useRef, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useShopStore } from '../../store/shopStore'
import { DESIGNS, getDesignLevelCost } from '../../data/designLibrary'
import Block from './Block'
import { DesignTooltipBody } from '../ui/DeckSelector'

export default function ShopSidebar({ deckDesignIds = [] }) {
  const { totalPixelsProduced, pixelsSpentInShop, buyDesignFromShop } = useGameStore()
  const { activeGridStyle } = useShopStore()
  const [flash, setFlash]       = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [mousePos, setMousePos]   = useState({ x: 0, y: 0 })
  const handleMouseMove = useCallback((e) => setMousePos({ x: e.clientX, y: e.clientY }), [])

  const balance = Math.floor(totalPixelsProduced - pixelsSpentInShop)
  const bargain = activeGridStyle === 'bargain'

  function doFlash(id, ok) {
    setFlash({ id, ok })
    setTimeout(() => setFlash(f => f?.id === id ? null : f), 420)
  }

  function handleBuy(design) {
    const cost = getDesignLevelCost(design, bargain)
    const ok = buyDesignFromShop(design.id, cost)
    doFlash(design.id, ok)
  }

  // Handle drag-to-grid: on dragStart, also deduct cost if possible
  function handleDragStart(e, design) {
    const cost = getDesignLevelCost(design, bargain)
    const canAfford = balance >= cost
    if (!canAfford) { e.preventDefault(); return }
    // Speculatively buy — the grid drop handler will place it
    const ok = buyDesignFromShop(design.id, cost)
    if (!ok) { e.preventDefault(); return }
    e.dataTransfer.setData('application/json', JSON.stringify({ source: 'shop', designId: design.id }))
  }

  const deckDesigns = deckDesignIds
    .map(id => DESIGNS.find(d => d.id === id))
    .filter(Boolean)

  const hoveredDesign = hoveredId ? deckDesigns.find(d => d.id === hoveredId) : null

  const tipW = 172
  const tipX = mousePos.x + 12 + tipW > window.innerWidth
    ? mousePos.x - tipW - 12
    : mousePos.x + 12
  const tipY = Math.min(mousePos.y - 8, window.innerHeight - 300)

  return (
    <div
      className="flex flex-col gap-0 overflow-hidden flex-shrink-0 border-r-2 border-game-border"
      style={{ width: 164, background: '#080816' }}
      onMouseMove={handleMouseMove}
    >
      {/* Header */}
      <div className="px-2 pt-3 pb-2 border-b border-game-border flex-shrink-0">
        <div className="text-xs font-black uppercase tracking-widest text-gray-600 mb-0.5">Shop</div>
        <div className="text-sm font-black text-white">{balance.toLocaleString()}</div>
        <div className="text-[10px] font-bold text-gray-600 uppercase">pixels</div>
      </div>

      {/* Design list */}
      <div className="flex-1 overflow-y-auto py-1.5 flex flex-col gap-0.5 px-1.5">
        {deckDesigns.length === 0 && (
          <p className="text-xs text-gray-700 italic text-center py-4 px-1">
            No deck selected
          </p>
        )}
        {deckDesigns.map(design => {
          const cost = getDesignLevelCost(design, bargain)
          const canAfford = balance >= cost
          const isFlash = flash?.id === design.id
          const flashOk = flash?.ok

          return (
            <div
              key={design.id}
              draggable={canAfford}
              onDragStart={e => handleDragStart(e, design)}
              onMouseEnter={() => setHoveredId(design.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => handleBuy(design)}
              className="rounded-xl border-2 flex flex-col gap-1 p-1.5 cursor-pointer transition"
              style={{
                background:   isFlash ? (flashOk ? '#00d49a18' : '#f03e4e18') : '#0d0d22',
                borderColor:  isFlash ? (flashOk ? '#00d49a' : '#f03e4e')
                              : hoveredId === design.id ? '#1499cc'
                              : canAfford ? '#36366a' : '#1e1e3a',
                opacity:      canAfford ? 1 : 0.45,
              }}
            >
              {/* Mini art + name */}
              <div className="flex items-center gap-1.5">
                <DesignThumb design={design} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-black text-white truncate leading-tight">{design.name}</div>
                  <div className="text-[9px] text-gray-500 capitalize truncate">{design.blockType.replace(/_/g, ' ')}</div>
                </div>
              </div>
              {/* Cost */}
              <div className="flex items-center justify-between">
                <div className="text-[9px] text-gray-600 capitalize truncate">{design.series}</div>
                <div className={`text-[11px] font-black ${canAfford ? 'text-pixel-yellow' : 'text-gray-600'}`}>
                  {cost}px
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Hover tooltip — fixed overlay follows cursor */}
      {hoveredDesign && (
        <div
          style={{ position: 'fixed', left: tipX, top: tipY, width: tipW, zIndex: 90, pointerEvents: 'none', background: '#0d0d22' }}
          className="rounded-xl border-2 border-game-border p-3 flex flex-col gap-2"
        >
          <DesignTooltipBody design={hoveredDesign} cost={getDesignLevelCost(hoveredDesign, bargain)} />
          <div className="text-[10px] text-gray-600 font-semibold border-t border-game-border pt-1">drag or click to buy</div>
        </div>
      )}
    </div>
  )
}

// Compact design thumbnail for the sidebar
function DesignThumb({ design, size }) {
  if (!design?.pixelLayout) return <div style={{ width: size, height: size }} className="bg-gray-800 rounded" />
  const cellSize = size / 16
  const COLOR_HEX = {
    red:'#f03e4e', orange:'#f59342', yellow:'#ffd166', green:'#00d49a',
    blue:'#1499cc', violet:'#a066f0', white:'#f0f0fa', silver:'#9db4cc',
    gold:'#ffc000', neon:'#39ff14', rainbow:'#ff6b9d',
  }
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }} className="rounded overflow-hidden">
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(16, ${cellSize}px)` }}>
        {design.pixelLayout.flat().map((color, i) => (
          <div key={i} style={{ width: cellSize, height: cellSize, backgroundColor: color ? COLOR_HEX[color] ?? '#888' : 'transparent' }} />
        ))}
      </div>
    </div>
  )
}
