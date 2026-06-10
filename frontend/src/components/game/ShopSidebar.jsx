import { useState } from 'react'
import { useGameStore, createBlock } from '../../store/gameStore'
import { PIXEL_COLORS, BLOCK_TYPES } from '../../lib/constants'
import { useUnlocks } from '../../lib/unlocks'

export default function ShopSidebar() {
  const {
    totalPixelsProduced, pixelsSpentInShop, pixelInventory,
    buyShopItem,
  } = useGameStore()
  const { isPixelUnlocked, isBlockUnlocked } = useUnlocks()
  const [flash, setFlash] = useState(null) // { key, ok }

  const balance = Math.floor(totalPixelsProduced - pixelsSpentInShop)

  function doFlash(key, ok) {
    setFlash({ key, ok })
    setTimeout(() => setFlash(f => f?.key === key ? null : f), 420)
  }

  function handleBuyColor(color, qty, cost) {
    const ok = buyShopItem(cost)
    doFlash(`color-${color}`, ok)
    if (!ok) return
    const inv = { ...useGameStore.getState().pixelInventory }
    inv[color] = (inv[color] ?? 0) + qty
    useGameStore.setState({ pixelInventory: inv })
  }

  function handleBuyBlock(type) {
    const bt = BLOCK_TYPES[type]
    const ok = buyShopItem(bt.levelCost)
    doFlash(`block-${type}`, ok)
    if (!ok) return
    const newBlock = createBlock(type)
    useGameStore.setState(s => ({ inventory: [...s.inventory, newBlock] }))
  }

  const availableBlocks = Object.entries(BLOCK_TYPES)
    .filter(([key]) => isBlockUnlocked(key))
    .filter(([key]) => key !== 'forge')

  return (
    <div
      className="flex flex-col flex-shrink-0 border-r-2 border-game-border overflow-y-auto"
      style={{ width: 188, background: '#0a0a1e' }}
    >
      {/* Header + pixel balance */}
      <div className="px-3 pt-3 pb-2 border-b-2 border-game-border flex-shrink-0" style={{ background: '#111128' }}>
        <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Shop</div>
        <div className="flex items-center gap-1.5">
          <span className="text-pixel-blue font-black text-lg leading-none">{balance.toLocaleString()}</span>
          <span className="text-xs font-bold text-gray-600 uppercase">pixels</span>
        </div>
        <div className="text-xs text-gray-700 mt-0.5">produced this level</div>
      </div>

      <div className="px-2 pt-2 flex flex-col gap-3">

        {/* Per-color pixel packs */}
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-gray-600 mb-1.5">Colors — 10 for 20px</div>
          <div className="flex flex-col gap-1">
            {Object.entries(PIXEL_COLORS)
              .filter(([key]) => isPixelUnlocked(key))
              .map(([key, meta]) => {
                const fk = `color-${key}`
                const canAfford = balance >= 20
                const isSuccess = flash?.key === fk && flash.ok
                const isFail    = flash?.key === fk && !flash.ok
                return (
                  <button
                    key={key}
                    onClick={() => handleBuyColor(key, 10, 20)}
                    className="rounded-xl border flex items-center gap-2 px-2.5 py-1.5 transition-all"
                    style={{
                      background: isSuccess ? '#00d49a22' : isFail ? '#f03e4e22' : '#0d0d22',
                      borderColor: isSuccess ? '#00d49a' : isFail ? '#f03e4e' : meta.hex + '55',
                      opacity: canAfford ? 1 : 0.4,
                    }}
                  >
                    <div className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{ backgroundColor: meta.hex }} />
                    <span className="text-xs font-bold flex-1 text-left capitalize" style={{ color: meta.hex }}>{key}</span>
                    <span className="text-xs font-black text-gray-500">{pixelInventory[key] ?? 0}</span>
                  </button>
                )
              })}
          </div>
        </div>

        {/* Blocks */}
        <div className="pb-3">
          <div className="text-xs font-black uppercase tracking-widest text-gray-600 mb-1.5">Blocks</div>
          <div className="flex flex-col gap-1">
            {availableBlocks.map(([key, bt]) => {
              const fk = `block-${key}`
              const canAfford = balance >= bt.levelCost
              const isSuccess = flash?.key === fk && flash.ok
              const isFail    = flash?.key === fk && !flash.ok
              return (
                <button
                  key={key}
                  onClick={() => handleBuyBlock(key)}
                  className="rounded-xl border-2 flex items-center gap-2 px-2.5 py-1.5 transition-all text-left"
                  style={{
                    background: isSuccess ? '#00d49a22' : isFail ? '#f03e4e22' : '#0d0d22',
                    borderColor: isSuccess ? '#00d49a' : isFail ? '#f03e4e' : canAfford ? '#36366a' : '#36366a',
                    opacity: canAfford ? 1 : 0.4,
                  }}
                >
                  <span className="text-xs font-black text-white flex-1 leading-tight">{bt.label}</span>
                  <span className="text-xs font-black text-pixel-blue flex-shrink-0">{bt.levelCost}px</span>
                </button>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
