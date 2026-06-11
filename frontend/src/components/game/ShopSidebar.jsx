import { useState, useCallback } from 'react'
import { useGameStore, getRandomBlockCost } from '../../store/gameStore'
import { useShopStore } from '../../store/shopStore'
import { DESIGNS, getDesignLevelCost } from '../../data/designLibrary'
import { useDesignUnlocks } from '../../lib/designUnlocks'
import { getOwnedBlockTypes, BLOCK_TYPES, BLOCK_TYPE_VISUAL } from '../../lib/constants'
import { DesignTooltipBody } from '../ui/DeckSelector'
import { tooltipPos } from '../../lib/tooltipPos'
import { playPurchase } from '../../lib/audio'

export default function ShopSidebar({ deckDesignIds = [] }) {
  const {
    totalPixelsProduced, pixelsSpentInShop,
    buyDesignFromShop, buyRandomDesign, designBuyCounts = {}, randomBuyCount, sellBlock,
  } = useGameStore()
  const { activeGridStyle, unlockedBlocks } = useShopStore()
  const { unlockedDesigns } = useDesignUnlocks()

  const [flashId, setFlashId]         = useState(null)   // designId that just flashed
  const [flashOk, setFlashOk]         = useState(false)
  const [randomFlash, setRandomFlash] = useState(null)
  const [lastRandom, setLastRandom]   = useState(null)
  const [sellFlash, setSellFlash]     = useState(null)
  const [sellOver, setSellOver]       = useState(false)
  const [hoveredId, setHoveredId]     = useState(null)
  const [hoveredRandom, setHoveredRandom] = useState(false)
  const [mousePos, setMousePos]       = useState({ x: 0, y: 0 })
  const handleMouseMove = useCallback((e) => setMousePos({ x: e.clientX, y: e.clientY }), [])

  const balance  = Math.floor(totalPixelsProduced - pixelsSpentInShop)
  const bargain  = activeGridStyle === 'bargain'
  const typePool = getOwnedBlockTypes(unlockedDesigns, unlockedBlocks ?? [])

  const randomCost = (() => {
    const base = getRandomBlockCost(randomBuyCount)
    return bargain ? Math.floor(base * 0.8) : base
  })()
  const nextRandomCost = getRandomBlockCost(randomBuyCount + 1)

  // Deduplicate deck by designId for display
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

  function handleBuyRandom() {
    const unlockedIds = unlockedDesigns.map(d => d.id)
    const block = buyRandomDesign(unlockedIds, deckDesignIds, typePool)
    if (block) {
      try { playPurchase() } catch {}
      setLastRandom(DESIGNS.find(x => x.id === block.designId) ?? null)
      setRandomFlash('ok')
    } else {
      setRandomFlash('fail')
    }
    setTimeout(() => setRandomFlash(null), 1200)
  }

  function handleSellDragOver(e) { e.preventDefault(); setSellOver(true) }
  function handleSellDragLeave() { setSellOver(false) }
  function handleSellDrop(e) {
    e.preventDefault(); setSellOver(false)
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (!data.blockId) return
      const refund = sellBlock(data.blockId)
      setSellFlash(refund > 0 ? `+${refund}px` : '0px')
      setTimeout(() => setSellFlash(null), 1200)
    } catch {}
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
              {/* Top row: thumb + name */}
              <div className="flex items-center gap-1.5">
                <DesignThumb design={design} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-black text-white leading-tight truncate">{design.name}</div>
                  <div className="text-[9px] font-bold capitalize leading-none" style={{ color: typeColor }}>
                    {BLOCK_TYPES[design.blockType]?.label ?? design.blockType.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              {/* Bottom row: cost + buy count */}
              <div className="flex items-center justify-between">
                <div className="text-[9px] text-gray-600">{buyCount}/2</div>
                <div className={`text-[12px] font-black ${canAfford && !maxed ? 'text-neon-yellow' : 'text-gray-600'}`}>
                  {maxed ? 'MAX' : `${cost}px`}
                </div>
              </div>
            </div>
          )
        })}

        {/* Divider if there are deck cards */}
        {deckDesigns.length > 0 && (
          <div className="border-t border-game-border my-0.5" />
        )}

        {/* Random block */}
        <div
          onMouseEnter={() => setHoveredRandom(true)}
          onMouseLeave={() => setHoveredRandom(false)}
          onClick={handleBuyRandom}
          className="rounded-xl border flex flex-col gap-1 p-1.5 cursor-pointer transition"
          style={{
            background: randomFlash === 'ok' ? '#6366f118' : randomFlash === 'fail' ? '#f8717118' : '#0c0c28',
            borderColor: randomFlash === 'ok' ? '#6366f1' : randomFlash === 'fail' ? '#f87171'
                         : hoveredRandom ? '#6366f188'
                         : balance >= randomCost ? '#1e1e48' : '#1a1a38',
            opacity: balance >= randomCost ? 1 : 0.45,
          }}
        >
          <div className="flex items-center gap-1.5">
            <div className="flex items-center justify-center flex-shrink-0 rounded overflow-hidden"
              style={{ width: 32, height: 32, background: '#0a0a1a', border: '1px solid #1e1e48' }}>
              {randomFlash === 'ok' && lastRandom
                ? <DesignThumb design={lastRandom} size={32} />
                : <span className="text-gray-500 font-black" style={{ fontSize: 18 }}>?</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-black text-neon-indigo leading-tight">Random</div>
              <div className="text-[9px] text-gray-600 leading-snug">×2 each buy</div>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-[9px] text-gray-700">next: {nextRandomCost.toLocaleString()}px</div>
            <div className={`text-[12px] font-black ${balance >= randomCost ? 'text-neon-yellow' : 'text-gray-600'}`}>
              {randomCost.toLocaleString()}px
            </div>
          </div>
        </div>
      </div>

      {/* Sell zone */}
      <div
        onDragOver={handleSellDragOver}
        onDragLeave={handleSellDragLeave}
        onDrop={handleSellDrop}
        className="flex-shrink-0 border-t-2 transition-colors"
        style={{
          background: sellOver ? 'rgba(248,113,113,0.15)' : '#06061a',
          borderTopColor: sellOver ? '#f87171' : '#1e1e48',
          minHeight: 48,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '6px 8px',
        }}
      >
        {sellFlash ? (
          <div className="text-sm font-black text-neon-yellow">{sellFlash}</div>
        ) : (
          <>
            <div className={`text-[11px] font-black ${sellOver ? 'text-neon-red' : 'text-gray-600'}`}>
              {sellOver ? 'DROP TO SELL' : '↓ Sell (20%)'}
            </div>
            <div className="text-[9px] text-gray-700">drag block here</div>
          </>
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

      {/* Random tooltip */}
      {hoveredRandom && !hoveredDesign && (
        <div
          style={{ position: 'fixed', left: tipX, top: tipY, width: tipW, zIndex: 90, pointerEvents: 'none', background: '#0c0c28' }}
          className="rounded-xl border border-game-border p-2.5 flex flex-col gap-1.5"
        >
          <div className="text-sm font-black text-neon-indigo">Random Design</div>
          <div className="text-xs text-gray-400 leading-snug">
            Surprise design from your collection with a randomly assigned block type. Cost doubles each purchase.
          </div>
          <div className="text-xs text-neon-yellow font-bold">{randomCost.toLocaleString()}px</div>
          <div className="text-[10px] text-gray-600">Next: {nextRandomCost.toLocaleString()}px</div>
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
