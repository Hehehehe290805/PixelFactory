import { useState, useCallback } from 'react'
import { useGameStore, getRandomBlockCost } from '../../store/gameStore'
import { useShopStore } from '../../store/shopStore'
import { DESIGNS, getDesignLevelCost } from '../../data/designLibrary'
import { useDesignUnlocks } from '../../lib/designUnlocks'
import { getOwnedBlockTypes, BLOCK_TYPE_VISUAL } from '../../lib/constants'
import { DesignTooltipBody } from '../ui/DeckSelector'
import { tooltipPos } from '../../lib/tooltipPos'
import { playPurchase } from '../../lib/audio'

export default function ShopSidebar({ deckDesignIds = [], isEndless = false }) {
  const {
    totalPixelsProduced, pixelsSpentInShop, randomBuyCount,
    buyDesignFromShop, designBuyCounts = {},
    extractBlock, returnBlocksToInventory, grantRandomBlock,
    buyRandomDesign,
  } = useGameStore()
  const { activeGridStyle, unlockedBlocks } = useShopStore()
  const { unlockedDesigns } = useDesignUnlocks()

  const [flashId, setFlashId]   = useState(null)
  const [flashOk, setFlashOk]   = useState(false)
  const [hoveredId, setHoveredId] = useState(null)
  const [mousePos, setMousePos]   = useState({ x: 0, y: 0 })
  const handleMouseMove = useCallback((e) => setMousePos({ x: e.clientX, y: e.clientY }), [])

  // Trade zone state
  const [tradeSlots, setTradeSlots] = useState([null, null, null])
  const [tradeDragOver, setTradeDragOver] = useState(null) // slot index

  const balance  = Math.floor(totalPixelsProduced - pixelsSpentInShop)
  const bargain  = activeGridStyle === 'bargain'
  const typePool = getOwnedBlockTypes(unlockedDesigns, unlockedBlocks ?? [])

  const deckDesigns = [...new Set(deckDesignIds)]
    .map(id => DESIGNS.find(d => d.id === id))
    .filter(Boolean)

  function handleBuyDesign(design) {
    const cost = getDesignLevelCost(design, bargain)
    const bought = buyDesignFromShop(design.id, cost, typePool)
    if (bought) {
      try { playPurchase() } catch {}
      setFlashId(design.id); setFlashOk(true)
    } else {
      setFlashId(design.id); setFlashOk(false)
    }
    setTimeout(() => setFlashId(null), 700)
  }

  // ── Random block (endless mode) ──────────────────────────────────────────────
  const [randFlash, setRandFlash] = useState(null)
  const randCost = getRandomBlockCost(randomBuyCount ?? 0)
  const canAffordRand = balance >= randCost

  function handleBuyRandom() {
    const ids = unlockedDesigns.map(d => d.id)
    const deck = deckDesignIds
    const bought = buyRandomDesign(ids, deck, typePool)
    if (bought) {
      try { playPurchase() } catch {}
      setRandFlash('ok')
    } else {
      setRandFlash('no')
    }
    setTimeout(() => setRandFlash(null), 700)
  }

  // ── Trade zone handlers ──────────────────────────────────────────────────────
  const filledSlots = tradeSlots.filter(Boolean)
  const allFilled   = filledSlots.length === 3

  function handleTradeDrop(e, idx) {
    e.preventDefault()
    setTradeDragOver(null)
    if (tradeSlots[idx]) return
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (!data.blockId) return
      const block = extractBlock(data.blockId)
      if (!block) return
      setTradeSlots(prev => { const n = [...prev]; n[idx] = block; return n })
    } catch {}
  }

  function handleSlotDragStart(e, idx) {
    const block = tradeSlots[idx]
    if (!block) return
    // Return block to inventory so drag-to-grid works normally
    returnBlocksToInventory([block])
    setTradeSlots(prev => { const n = [...prev]; n[idx] = null; return n })
    e.dataTransfer.setData('application/json', JSON.stringify({ source: 'inventory', blockId: block.id }))
  }

  function handleCompleteTrade() {
    if (!allFilled) return
    const ids = unlockedDesigns.map(d => d.id)
    grantRandomBlock(ids, typePool)
    setTradeSlots([null, null, null])
    try { playPurchase() } catch {}
  }

  function handleCancelTrade() {
    returnBlocksToInventory(tradeSlots)
    setTradeSlots([null, null, null])
  }

  const hoveredDesign = hoveredId ? DESIGNS.find(d => d.id === hoveredId) : null
  const tipW = 172
  const { x: tipX, y: tipY } = tooltipPos(mousePos.x, mousePos.y, tipW, 280)

  return (
    <div
      data-tutorial="shop-sidebar"
      className="flex flex-col gap-0 overflow-hidden flex-shrink-0 border-r-2 border-game-border"
      style={{ width: 164, background: '#06061a' }}
      onMouseMove={handleMouseMove}
    >
      {/* Header */}
      <div className="px-2 pt-3 pb-2 border-b border-game-border flex-shrink-0">
        <div className="text-xs font-black uppercase tracking-widest text-gray-600 mb-0.5">Shop</div>
        <div className="text-sm font-black text-white">{balance.toLocaleString()}</div>
        <div className="text-[10px] font-bold text-gray-600 uppercase">pixels</div>
      </div>

      {/* Deck design cards */}
      <div className="flex-1 overflow-y-auto py-1.5 px-1.5 flex flex-col gap-1">
        {deckDesigns.map(design => {
          const cost       = getDesignLevelCost(design, bargain)
          const canAfford  = balance >= cost
          const buyCount   = designBuyCounts[design.id] ?? 0
          const maxed      = buyCount >= 2
          const isFl       = flashId === design.id
          const typeColor  = BLOCK_TYPE_VISUAL?.[design.blockType]?.color ?? '#6366f1'

          return (
            <div
              key={design.id}
              onMouseEnter={() => setHoveredId(design.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => !maxed && handleBuyDesign(design)}
              className="rounded-xl border transition-all cursor-pointer flex flex-col gap-1 p-1.5"
              style={{
                background: isFl ? (flashOk ? '#34d39918' : '#f8717118') : '#0c0c28',
                borderColor: isFl
                  ? (flashOk ? '#34d399' : '#f87171')
                  : maxed ? '#2e2e60'
                  : hoveredId === design.id && canAfford ? typeColor + '88'
                  : '#1e1e48',
                opacity: maxed ? 0.4 : canAfford ? 1 : 0.55,
                cursor: maxed ? 'not-allowed' : canAfford ? 'pointer' : 'default',
              }}
            >
              <div className="flex items-center gap-1.5">
                <DesignThumb design={design} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-black text-white leading-tight truncate">{design.name}</div>
                  <div className="text-[9px] font-bold capitalize leading-none text-gray-600">{design.series}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[9px] text-gray-600">{buyCount}/2</div>
                <div className={`text-[12px] font-black ${canAfford && !maxed ? 'text-neon-yellow' : 'text-gray-600'}`}>
                  {maxed ? 'MAX' : `${cost}px`}
                </div>
              </div>
            </div>
          )
        })}

        {/* Random block button (endless mode) */}
        {isEndless && (
          <div
            onClick={canAffordRand ? handleBuyRandom : undefined}
            className="rounded-xl border transition-all flex flex-col items-center gap-0.5 p-2 mt-1"
            style={{
              background: randFlash === 'ok' ? '#34d39918' : randFlash === 'no' ? '#f8717118' : '#0c0c28',
              borderColor: randFlash === 'ok' ? '#34d399' : randFlash === 'no' ? '#f87171'
                : canAffordRand ? '#6366f1aa' : '#1e1e48',
              opacity: canAffordRand ? 1 : 0.45,
              cursor: canAffordRand ? 'pointer' : 'default',
            }}
          >
            <div className="text-base">🎲</div>
            <div className="text-[10px] font-black text-white">Random Block</div>
            <div className={`text-[11px] font-black ${canAffordRand ? 'text-neon-yellow' : 'text-gray-600'}`}>
              {randCost.toLocaleString()}px
            </div>
          </div>
        )}
      </div>

      {/* Trade zone — 3 blocks → 1 random */}
      <div className="flex-shrink-0 border-t-2 border-game-border px-1.5 pt-1.5 pb-2" style={{ background: '#06061a' }}>
        <div className="text-[9px] font-black uppercase tracking-widest text-gray-700 mb-1.5 text-center">
          Trade 3 → Random
        </div>

        {/* 3 slots */}
        <div className="flex gap-1 mb-1.5">
          {tradeSlots.map((block, idx) => (
            <div
              key={idx}
              onDragOver={e => { e.preventDefault(); setTradeDragOver(idx) }}
              onDragLeave={() => setTradeDragOver(null)}
              onDrop={e => handleTradeDrop(e, idx)}
              className="flex-1 rounded-lg border flex items-center justify-center transition-colors"
              style={{
                height: 38,
                borderColor: tradeDragOver === idx ? '#6366f1' : block ? '#6366f144' : '#1e1e48',
                background: tradeDragOver === idx ? '#6366f110' : block ? '#0c0c28' : '#08081c',
              }}
            >
              {block ? (
                <div
                  draggable
                  onDragStart={e => handleSlotDragStart(e, idx)}
                  style={{ cursor: 'grab' }}
                >
                  <DesignThumb design={DESIGNS.find(d => d.id === block.designId)} size={28} />
                </div>
              ) : (
                <span className="text-[10px] font-black text-gray-700">{idx + 1}</span>
              )}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        {allFilled ? (
          <button
            onClick={handleCompleteTrade}
            className="w-full rounded-lg py-1 text-[10px] font-black transition"
            style={{ background: '#6366f1', color: '#fff' }}
          >
            Get Random →
          </button>
        ) : filledSlots.length > 0 ? (
          <button
            onClick={handleCancelTrade}
            className="w-full rounded-lg py-1 text-[10px] font-black transition"
            style={{ background: '#1e1e48', color: '#f87171' }}
          >
            Cancel
          </button>
        ) : (
          <div className="text-[9px] text-gray-700 text-center">drag blocks here</div>
        )}
      </div>

      {/* Design tooltip */}
      {hoveredDesign && (
        <div
          style={{ position: 'fixed', left: tipX, top: tipY, width: tipW, zIndex: 90, pointerEvents: 'none', background: '#0c0c28' }}
          className="rounded-xl border border-game-border p-2.5 flex flex-col gap-1.5"
        >
          <DesignTooltipBody design={hoveredDesign} cost={getDesignLevelCost(hoveredDesign, bargain)} />
        </div>
      )}
    </div>
  )
}

function DesignThumb({ design, size }) {
  if (!design?.pixelLayout) return <div style={{ width: size, height: size }} className="bg-gray-800 rounded" />
  const cellSize = size / 16
  const HEX = {
    red:'#f03e4e', orange:'#f59342', yellow:'#ffd166', green:'#00d49a',
    blue:'#6366f1', violet:'#a066f0', white:'#f0f0fa', silver:'#9db4cc',
    gold:'#ffc000', neon:'#39ff14', rainbow:'#ff6b9d',
  }
  return (
    <div style={{ width: size, height: size, flexShrink: 0 }} className="rounded overflow-hidden">
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(16, ${cellSize}px)` }}>
        {design.pixelLayout.flat().map((c, i) => (
          <div key={i} style={{ width: cellSize, height: cellSize, backgroundColor: c ? HEX[c] ?? '#888' : 'transparent' }} />
        ))}
      </div>
    </div>
  )
}
