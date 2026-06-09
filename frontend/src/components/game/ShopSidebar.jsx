import { useUserStore } from '../../store/userStore'
import { useGameStore } from '../../store/gameStore'
import { PIXEL_COLORS } from '../../lib/constants'

const PIXEL_PACKS = [
  { qty: 10, cost: 30 }, { qty: 25, cost: 70 }, { qty: 50, cost: 130 }, { qty: 100, cost: 240 },
]

function buyMixed(qty, cost) {
  const { gold, addGold } = useUserStore.getState()
  if (gold < cost) return
  addGold(-cost)
  const inv = { ...useGameStore.getState().pixelInventory }
  const cols = ['white', 'red', 'yellow', 'green', 'blue', 'orange', 'violet']
  const per = Math.floor(qty / 7)
  const rem = qty - per * 7
  cols.forEach(c => { inv[c] = (inv[c] ?? 0) + per })
  inv['white'] = (inv['white'] ?? 0) + rem
  useGameStore.setState({ pixelInventory: inv })
}

function buyColor(color, qty, cost) {
  const { gold, addGold } = useUserStore.getState()
  if (gold < cost) return
  addGold(-cost)
  const inv = { ...useGameStore.getState().pixelInventory }
  inv[color] = (inv[color] ?? 0) + qty
  useGameStore.setState({ pixelInventory: inv })
}

export default function ShopSidebar() {
  const gold = useUserStore(s => s.gold)
  const pixelInventory = useGameStore(s => s.pixelInventory)

  return (
    <div
      className="flex flex-col flex-shrink-0 border-r-2 border-game-border overflow-y-auto"
      style={{ width: 188, background: '#0a0a1e' }}
    >
      {/* Header + gold */}
      <div className="px-3 pt-3 pb-2 border-b-2 border-game-border flex-shrink-0" style={{ background: '#111128' }}>
        <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Shop</div>
        <div className="flex items-center gap-1.5">
          <span className="text-pixel-yellow font-black text-lg leading-none">{gold}</span>
          <span className="text-xs font-bold text-gray-600 uppercase">gold</span>
        </div>
      </div>

      {/* Mixed packs */}
      <div className="px-2 pt-2">
        <div className="text-xs font-black uppercase tracking-widest text-gray-600 mb-1.5">Mixed Packs</div>
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {PIXEL_PACKS.map(({ qty, cost }) => (
            <button
              key={qty}
              onClick={() => buyMixed(qty, cost)}
              disabled={gold < cost}
              className={`rounded-xl border-2 flex flex-col items-center py-2 gap-0.5 transition
                ${gold >= cost
                  ? 'border-game-border hover:border-pixel-blue cursor-pointer'
                  : 'border-game-border opacity-40 cursor-not-allowed'}`}
              style={{ background: '#0d0d22' }}
            >
              <span className="text-sm font-black text-white">{qty}</span>
              <span className="text-xs font-bold text-pixel-yellow">{cost}g</span>
            </button>
          ))}
        </div>

        {/* Per-color packs */}
        <div className="text-xs font-black uppercase tracking-widest text-gray-600 mb-1.5">Colors — 10 for 25g</div>
        <div className="flex flex-col gap-1 pb-3">
          {Object.entries(PIXEL_COLORS)
            .filter(([, meta]) => !meta.special)
            .map(([key, meta]) => (
              <button
                key={key}
                onClick={() => buyColor(key, 10, 25)}
                disabled={gold < 25}
                className={`rounded-xl border flex items-center gap-2 px-2.5 py-1.5 transition
                  ${gold >= 25
                    ? 'hover:border-game-border2 cursor-pointer'
                    : 'opacity-40 cursor-not-allowed'}`}
                style={{ background: '#0d0d22', borderColor: meta.hex + '55' }}
              >
                <div className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{ backgroundColor: meta.hex }} />
                <span className="text-xs font-bold flex-1 text-left" style={{ color: meta.hex }}>{key}</span>
                <span className="text-xs font-black text-gray-500">{pixelInventory[key] ?? 0}</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}
