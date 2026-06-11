import { useState, useCallback } from 'react'
import { useGameStore, getRandomBlockCost } from '../../store/gameStore'
import { useShopStore } from '../../store/shopStore'
import { DESIGNS } from '../../data/designLibrary'
import { useDesignUnlocks } from '../../lib/designUnlocks'
import { getOwnedBlockTypes } from '../../lib/constants'
import { DesignTooltipBody } from '../ui/DeckSelector'
import { tooltipPos } from '../../lib/tooltipPos'

export default function ShopSidebar({ deckDesignIds = [] }) {
  const {
    totalPixelsProduced, pixelsSpentInShop,
    buyRandomDesign, randomBuyCount, sellBlock,
  } = useGameStore()
  const { activeGridStyle, unlockedBlocks } = useShopStore()
  const { unlockedDesigns } = useDesignUnlocks()

  const [randomFlash, setRandomFlash] = useState(null)   // 'ok'|'fail'|null
  const [lastRandom, setLastRandom]   = useState(null)
  const [sellFlash, setSellFlash]     = useState(null)
  const [sellOver, setSellOver]       = useState(false)
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
  const nextCost = getRandomBlockCost(randomBuyCount + 1)

  function handleBuyRandom() {
    const unlockedIds = unlockedDesigns.map(d => d.id)
    const block = buyRandomDesign(unlockedIds, deckDesignIds, typePool)
    if (block) {
      setLastRandom(DESIGNS.find(x => x.id === block.designId) ?? null)
      setRandomFlash('ok')
      setTimeout(() => setRandomFlash(null), 1200)
    } else {
      setRandomFlash('fail')
      setTimeout(() => setRandomFlash(null), 420)
    }
  }

  // ── Sell zone handlers ───────────────────────────────────────────────────────
  function handleSellDragOver(e) { e.preventDefault(); setSellOver(true) }
  function handleSellDragLeave() { setSellOver(false) }
  function handleSellDrop(e) {
    e.preventDefault()
    setSellOver(false)
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (!data.blockId) return
      const refund = sellBlock(data.blockId)
      setSellFlash(refund > 0 ? `+${refund}px` : '0px')
      setTimeout(() => setSellFlash(null), 1200)
    } catch {}
  }

  const tipW = 172
  const { x: tipX, y: tipY } = tooltipPos(mousePos.x, mousePos.y, tipW, 280)

  return (
    <div
      data-tutorial="shop-sidebar"
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

      {/* Random block — the only buyable item */}
      <div className="flex-1 overflow-y-auto py-2 px-1.5 flex flex-col gap-1">
        <div
          onMouseEnter={() => setHoveredRandom(true)}
          onMouseLeave={() => setHoveredRandom(false)}
          onClick={handleBuyRandom}
          className="rounded-xl border-2 flex flex-col gap-1 p-2 cursor-pointer transition"
          style={{
            background:  randomFlash === 'ok' ? '#1499cc18' : randomFlash === 'fail' ? '#f03e4e18' : '#0d0d22',
            borderColor: randomFlash === 'ok' ? '#1499cc' : randomFlash === 'fail' ? '#f03e4e'
                         : hoveredRandom ? '#1499cc88'
                         : balance >= randomCost ? '#36366a' : '#1e1e3a',
            opacity: balance >= randomCost ? 1 : 0.45,
          }}
        >
          {/* Icon row */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center flex-shrink-0 rounded overflow-hidden"
              style={{ width: 36, height: 36, background: '#0a0a1a', border: '1px solid #36366a' }}
            >
              {randomFlash === 'ok' && lastRandom
                ? <DesignThumb design={lastRandom} size={36} />
                : <span className="text-gray-400 font-black" style={{ fontSize: 20 }}>?</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-black text-pixel-blue leading-tight">Random</div>
              <div className="text-[9px] text-gray-500 leading-snug">random type</div>
            </div>
          </div>

          {/* Cost */}
          <div className="flex items-end justify-between gap-1">
            <div className="text-[9px] text-gray-700 leading-tight">×2 each buy</div>
            <div className={`text-[13px] font-black ${balance >= randomCost ? 'text-pixel-blue' : 'text-gray-600'}`}>
              {randomCost.toLocaleString()}px
            </div>
          </div>
        </div>

        {/* Next cost preview */}
        <div className="text-[9px] text-gray-700 text-right px-1">
          next: {nextCost.toLocaleString()}px
        </div>
      </div>

      {/* Sell zone */}
      <div
        onDragOver={handleSellDragOver}
        onDragLeave={handleSellDragLeave}
        onDrop={handleSellDrop}
        className="flex-shrink-0 border-t-2 transition-colors"
        style={{
          background: sellOver ? 'rgba(240,62,78,0.18)' : '#0a0a14',
          borderTopColor: sellOver ? '#f03e4e' : '#36366a',
          minHeight: 52,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 8px',
        }}
      >
        {sellFlash ? (
          <div className="text-sm font-black text-pixel-yellow">{sellFlash}</div>
        ) : (
          <>
            <div className={`text-[11px] font-black ${sellOver ? 'text-red-400' : 'text-gray-600'}`}>
              {sellOver ? 'DROP TO SELL' : '↓ Sell (20%)'}
            </div>
            <div className="text-[9px] text-gray-700">drag block here</div>
          </>
        )}
      </div>

      {/* Random block tooltip */}
      {hoveredRandom && (
        <div
          style={{ position: 'fixed', left: tipX, top: tipY, width: tipW, zIndex: 90, pointerEvents: 'none', background: '#0d0d22' }}
          className="rounded-xl border-2 border-game-border p-3 flex flex-col gap-2"
        >
          <div className="text-sm font-black text-pixel-blue">Random Design</div>
          <div className="text-xs text-gray-400 leading-snug">
            Surprise design from your collection with a randomly assigned block type.
            Cost doubles each purchase.
          </div>
          <div className="text-xs text-pixel-blue font-bold">{randomCost.toLocaleString()}px</div>
          <div className="text-[10px] text-gray-600">Next: {nextCost.toLocaleString()}px</div>
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
    blue:'#1499cc', violet:'#a066f0', white:'#f0f0fa', silver:'#9db4cc',
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
