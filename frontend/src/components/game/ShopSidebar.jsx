import { useGameStore } from '../../store/gameStore'
import { PIXEL_COLORS } from '../../lib/constants'

const PIXEL_PACKS = [
  { qty: 10,  cost: 20  },
  { qty: 25,  cost: 45  },
  { qty: 50,  cost: 85  },
  { qty: 100, cost: 160 },
]

const SPEED_PACKS = [
  { speed: 0.5, label: '0.5×', cost: 50,  desc: 'Slow' },
  { speed: 2,   label: '2×',   cost: 100, desc: 'Fast' },
  { speed: 5,   label: '5×',   cost: 250, desc: 'Turbo' },
  { speed: 10,  label: '10×',  cost: 600, desc: 'Max' },
]

export default function ShopSidebar() {
  const {
    totalPixelsProduced, pixelsSpentInShop, pixelInventory,
    purchasedSpeeds, buyShopItem, purchaseSpeed,
  } = useGameStore()

  const balance = Math.floor(totalPixelsProduced - pixelsSpentInShop)

  function handleBuyMixed(qty, cost) {
    if (!buyShopItem(cost)) return
    const inv = { ...useGameStore.getState().pixelInventory }
    const cols = ['white', 'red', 'yellow', 'green', 'blue', 'orange', 'violet']
    const per = Math.floor(qty / cols.length)
    const rem = qty - per * cols.length
    cols.forEach(c => { inv[c] = (inv[c] ?? 0) + per })
    inv.white = (inv.white ?? 0) + rem
    useGameStore.setState({ pixelInventory: inv })
  }

  function handleBuyColor(color, qty, cost) {
    if (!buyShopItem(cost)) return
    const inv = { ...useGameStore.getState().pixelInventory }
    inv[color] = (inv[color] ?? 0) + qty
    useGameStore.setState({ pixelInventory: inv })
  }

  function handleBuySpeed(speed, cost) {
    if (purchasedSpeeds.has(speed)) return
    if (!buyShopItem(cost)) return
    purchaseSpeed(speed)
  }

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

        {/* Mixed pixel packs */}
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-gray-600 mb-1.5">Mixed Packs</div>
          <div className="grid grid-cols-2 gap-1.5">
            {PIXEL_PACKS.map(({ qty, cost }) => (
              <button
                key={qty}
                onClick={() => handleBuyMixed(qty, cost)}
                disabled={balance < cost}
                className={`rounded-xl border-2 flex flex-col items-center py-2 gap-0.5 transition
                  ${balance >= cost
                    ? 'border-game-border hover:border-pixel-blue cursor-pointer'
                    : 'border-game-border opacity-40 cursor-not-allowed'}`}
                style={{ background: '#0d0d22' }}
              >
                <span className="text-sm font-black text-white">+{qty}</span>
                <span className="text-xs font-bold text-pixel-blue">{cost}px</span>
              </button>
            ))}
          </div>
        </div>

        {/* Per-color packs */}
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-gray-600 mb-1.5">Colors — 10 for 30px</div>
          <div className="flex flex-col gap-1">
            {Object.entries(PIXEL_COLORS)
              .filter(([, meta]) => !meta.special)
              .map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => handleBuyColor(key, 10, 30)}
                  disabled={balance < 30}
                  className={`rounded-xl border flex items-center gap-2 px-2.5 py-1.5 transition
                    ${balance >= 30
                      ? 'hover:border-game-border2 cursor-pointer'
                      : 'opacity-40 cursor-not-allowed'}`}
                  style={{ background: '#0d0d22', borderColor: meta.hex + '55' }}
                >
                  <div className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{ backgroundColor: meta.hex }} />
                  <span className="text-xs font-bold flex-1 text-left capitalize" style={{ color: meta.hex }}>{key}</span>
                  <span className="text-xs font-black text-gray-500">{pixelInventory[key] ?? 0}</span>
                </button>
              ))}
          </div>
        </div>

        {/* Speed boosts */}
        <div className="pb-3">
          <div className="text-xs font-black uppercase tracking-widest text-gray-600 mb-1.5">Speed Boosts</div>
          <div className="flex flex-col gap-1">
            {SPEED_PACKS.map(({ speed, label, cost, desc }) => {
              const bought = purchasedSpeeds.has(speed)
              return (
                <button
                  key={speed}
                  onClick={() => handleBuySpeed(speed, cost)}
                  disabled={bought || balance < cost}
                  className={`rounded-xl border-2 flex items-center gap-2 px-2.5 py-1.5 transition
                    ${bought
                      ? 'border-pixel-green/40 cursor-default'
                      : balance >= cost
                        ? 'border-game-border hover:border-pixel-yellow cursor-pointer'
                        : 'border-game-border opacity-40 cursor-not-allowed'}`}
                  style={{ background: bought ? 'rgba(0,212,154,0.06)' : '#0d0d22' }}
                >
                  <span className={`text-sm font-black w-8 flex-shrink-0 ${bought ? 'text-pixel-green' : 'text-white'}`}>{label}</span>
                  <span className="text-xs text-gray-500 flex-1">{desc}</span>
                  {bought
                    ? <span className="text-pixel-green font-black text-xs">✓</span>
                    : <span className="text-pixel-yellow font-black text-xs">{cost}px</span>
                  }
                </button>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
