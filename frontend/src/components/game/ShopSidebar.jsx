import { useState, useCallback } from 'react'
import { useGameStore, getRandomBlockCost } from '../../store/gameStore'
import { useShopStore } from '../../store/shopStore'
import { DESIGNS, getDesignLevelCost } from '../../data/designLibrary'
import { useDesignUnlocks } from '../../lib/designUnlocks'
import { DesignTooltipBody, DesignMiniThumb } from '../ui/DeckSelector'

export default function ShopSidebar({ deckDesignIds = [] }) {
  const {
    totalPixelsProduced, pixelsSpentInShop,
    buyDesignFromShop, buyRandomDesign, designBuyCounts,
    randomBuyCount, sellBlock,
  } = useGameStore()
  const { activeGridStyle, unlockedBlocks } = useShopStore()
  const { unlockedDesigns } = useDesignUnlocks()

  const [flash, setFlash]             = useState(null)    // { id, ok }
  const [randomFlash, setRandomFlash] = useState(null)    // 'ok'|'fail'|null
  const [lastRandom, setLastRandom]   = useState(null)
  const [sellFlash, setSellFlash]     = useState(null)    // refund amount or 'bad'
  const [sellOver, setSellOver]       = useState(false)
  const [hoveredId, setHoveredId]     = useState(null)
  const [mousePos, setMousePos]       = useState({ x: 0, y: 0 })
  const handleMouseMove = useCallback((e) => setMousePos({ x: e.clientX, y: e.clientY }), [])

  const balance  = Math.floor(totalPixelsProduced - pixelsSpentInShop)
  const bargain  = activeGridStyle === 'bargain'
  const shopUnlocked = unlockedBlocks ?? []

  const randomCost = (() => {
    const base = getRandomBlockCost(randomBuyCount)
    return bargain ? Math.floor(base * 0.8) : base
  })()

  function doFlash(id, ok) {
    setFlash({ id, ok })
    setTimeout(() => setFlash(f => f?.id === id ? null : f), 420)
  }

  function handleBuy(design) {
    const cost = getDesignLevelCost(design, bargain)
    const ok = buyDesignFromShop(design.id, cost, shopUnlocked)
    doFlash(design.id, ok)
  }

  function handleDragStart(e, design) {
    const cost = getDesignLevelCost(design, bargain)
    if (balance < cost) { e.preventDefault(); return }
    if ((designBuyCounts[design.id] ?? 0) >= 2) { e.preventDefault(); return }
    const ok = buyDesignFromShop(design.id, cost, shopUnlocked)
    if (!ok) { e.preventDefault(); return }
    e.dataTransfer.setData('application/json', JSON.stringify({ source: 'shop', designId: design.id }))
  }

  function handleBuyRandom() {
    const unlockedIds = unlockedDesigns.map(d => d.id)
    const block = buyRandomDesign(unlockedIds, deckDesignIds, shopUnlocked)
    if (block) {
      const d = DESIGNS.find(x => x.id === block.designId)
      setLastRandom(d ?? null)
      setRandomFlash('ok')
      setTimeout(() => setRandomFlash(null), 1200)
    } else {
      setRandomFlash('fail')
      setTimeout(() => setRandomFlash(null), 420)
    }
  }

  // ── Sell zone drag handlers ──────────────────────────────────────────────────
  function handleSellDragOver(e) { e.preventDefault(); setSellOver(true) }
  function handleSellDragLeave() { setSellOver(false) }
  function handleSellDrop(e) {
    e.preventDefault()
    setSellOver(false)
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      const blockId = data.blockId
      if (!blockId) return
      const refund = sellBlock(blockId)
      if (refund > 0) {
        setSellFlash(`+${refund}px`)
      } else {
        setSellFlash('0px')
      }
      setTimeout(() => setSellFlash(null), 1200)
    } catch {}
  }

  const deckDesigns = deckDesignIds
    .map(id => DESIGNS.find(d => d.id === id))
    .filter(Boolean)
    .filter(d => (designBuyCounts[d.id] ?? 0) < 2)

  // Deduplicate so same design only appears once in the list
  const uniqueDeckDesigns = deckDesigns.filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i)

  const hoveredDesign = hoveredId && hoveredId !== '__random__'
    ? DESIGNS.find(d => d.id === hoveredId)
    : null

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
        {uniqueDeckDesigns.length === 0 && deckDesignIds.length > 0 && (
          <p className="text-[10px] text-gray-700 italic text-center py-2 px-1">
            All deck designs purchased
          </p>
        )}

        {uniqueDeckDesigns.map(design => {
          const cost     = getDesignLevelCost(design, bargain)
          const canAfford = balance >= cost
          const isFlash  = flash?.id === design.id
          const flashOk  = flash?.ok
          const bought   = designBuyCounts[design.id] ?? 0

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
                background:  isFlash ? (flashOk ? '#00d49a18' : '#f03e4e18') : '#0d0d22',
                borderColor: isFlash ? (flashOk ? '#00d49a' : '#f03e4e')
                             : hoveredId === design.id ? '#1499cc'
                             : canAfford ? '#36366a' : '#1e1e3a',
                opacity: canAfford ? 1 : 0.45,
              }}
            >
              <div className="flex items-center gap-1.5">
                <DesignThumb design={design} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-black text-white truncate leading-tight">{design.name}</div>
                  <div className="text-[9px] text-gray-500 capitalize truncate italic">type: random</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[9px] text-gray-600 capitalize truncate">{design.series}</div>
                <div className="flex items-center gap-1">
                  <div className="text-[8px] text-gray-700">{bought}/2</div>
                  <div className={`text-[11px] font-black ${canAfford ? 'text-pixel-yellow' : 'text-gray-600'}`}>
                    {cost}px
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Random slot */}
        <div
          onMouseEnter={() => setHoveredId('__random__')}
          onMouseLeave={() => setHoveredId(null)}
          onClick={handleBuyRandom}
          className="rounded-xl border-2 flex flex-col gap-1 p-1.5 cursor-pointer transition mt-1"
          style={{
            background:  randomFlash === 'ok' ? '#1499cc18' : randomFlash === 'fail' ? '#f03e4e18' : '#0d0d22',
            borderColor: randomFlash === 'ok' ? '#1499cc' : randomFlash === 'fail' ? '#f03e4e'
                         : hoveredId === '__random__' ? '#1499cc88'
                         : balance >= randomCost ? '#36366a' : '#1e1e3a',
            opacity: balance >= randomCost ? 1 : 0.45,
          }}
        >
          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center justify-center flex-shrink-0 rounded overflow-hidden"
              style={{ width: 28, height: 28, background: '#0a0a1a', border: '1px solid #36366a' }}
            >
              {randomFlash === 'ok' && lastRandom
                ? <DesignThumb design={lastRandom} size={28} />
                : <span className="text-gray-500 font-black text-base">?</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-black text-pixel-blue/80 truncate leading-tight">Random</div>
              <div className="text-[9px] text-gray-600 truncate">cost ×2 each buy</div>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <div className={`text-[11px] font-black ${balance >= randomCost ? 'text-pixel-blue' : 'text-gray-600'}`}>
              {randomCost.toLocaleString()}px
            </div>
          </div>
        </div>
      </div>

      {/* Sell zone — drag any block here to sell for 20% refund */}
      <div
        onDragOver={handleSellDragOver}
        onDragLeave={handleSellDragLeave}
        onDrop={handleSellDrop}
        className="flex-shrink-0 border-t-2 border-game-border transition-colors"
        style={{
          background: sellOver ? 'rgba(240,62,78,0.15)' : '#0a0a14',
          borderTopColor: sellOver ? '#f03e4e' : undefined,
          minHeight: 48,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 8px',
        }}
      >
        {sellFlash ? (
          <div className="text-xs font-black text-pixel-yellow">{sellFlash}</div>
        ) : (
          <>
            <div className={`text-[11px] font-black ${sellOver ? 'text-red-400' : 'text-gray-700'}`}>
              {sellOver ? 'DROP TO SELL' : '↓ Sell (20%)'}
            </div>
            <div className="text-[9px] text-gray-700">drag block here</div>
          </>
        )}
      </div>

      {/* Hover tooltip */}
      {hoveredDesign && (
        <div
          style={{ position: 'fixed', left: tipX, top: tipY, width: tipW, zIndex: 90, pointerEvents: 'none', background: '#0d0d22' }}
          className="rounded-xl border-2 border-game-border p-3 flex flex-col gap-2"
        >
          <DesignTooltipBody design={hoveredDesign} cost={getDesignLevelCost(hoveredDesign, bargain)} />
          <div className="text-[10px] text-gray-600 font-semibold border-t border-game-border pt-1">drag or click to buy</div>
        </div>
      )}

      {hoveredId === '__random__' && (
        <div
          style={{ position: 'fixed', left: tipX, top: tipY, width: tipW, zIndex: 90, pointerEvents: 'none', background: '#0d0d22' }}
          className="rounded-xl border-2 border-game-border p-3 flex flex-col gap-2"
        >
          <div className="text-sm font-black text-pixel-blue">Random Design</div>
          <div className="text-xs text-gray-400 leading-snug">
            Surprise design from your collection with a random block type. Cost doubles each purchase.
          </div>
          <div className="text-xs text-pixel-blue font-bold">{randomCost.toLocaleString()}px</div>
          {randomBuyCount > 0 && (
            <div className="text-[10px] text-gray-600">Next after this: {getRandomBlockCost(randomBuyCount + 1).toLocaleString()}px</div>
          )}
        </div>
      )}
    </div>
  )
}

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
