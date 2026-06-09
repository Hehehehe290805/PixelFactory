import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { useUserStore } from '../../store/userStore'
import { PIXEL_COLORS } from '../../lib/constants'

const PIXEL_PACKS = [
  { qty: 10,  cost: 30,  colors: ['white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white'] },
  { qty: 25,  cost: 70  },
  { qty: 50,  cost: 130 },
  { qty: 100, cost: 240 },
]

const COLOR_COSTS = { white: 1, red: 3, orange: 3, yellow: 3, green: 3, blue: 3, violet: 3 }

export default function InLevelShop({ onClose }) {
  const { pixelInventory, startLevel } = useGameStore()
  const { gold, addGold } = useUserStore()

  const store = useGameStore.getState()

  function buyPixels(qty, cost, color = null) {
    if (gold < cost) return
    addGold(-cost)
    // Add pixels to inventory
    const newInv = { ...store.pixelInventory }
    if (color) {
      newInv[color] = (newInv[color] ?? 0) + qty
    } else {
      // Mix: give half white, rest split across colors
      const perColor = Math.floor(qty / 7)
      const rem = qty - perColor * 7
      const colors = ['white', 'red', 'yellow', 'green', 'blue', 'orange', 'violet']
      for (const c of colors) newInv[c] = (newInv[c] ?? 0) + perColor
      newInv['white'] = (newInv['white'] ?? 0) + rem
    }
    useGameStore.setState({ pixelInventory: newInv })
  }

  function buyColorPixels(color, qty, cost) {
    if (gold < cost) return
    addGold(-cost)
    const newInv = { ...useGameStore.getState().pixelInventory }
    newInv[color] = (newInv[color] ?? 0) + qty
    useGameStore.setState({ pixelInventory: newInv })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card w-full max-w-sm"
        style={{ padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-black text-white pixel-heading">In-Level Shop</h2>
          <div className="card-sm px-3 py-1 text-right">
            <div className="text-pixel-yellow font-black text-lg leading-none">{gold}</div>
            <div className="text-xs font-bold text-gray-600 uppercase">gold</div>
          </div>
        </div>

        {/* Pixel packs */}
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Pixel Packs (Mixed)</h3>
        <div className="space-y-2 mb-5">
          {PIXEL_PACKS.map(({ qty, cost }) => (
            <div key={qty} className="card flex items-center justify-between" style={{ padding: '0.75rem 1rem' }}>
              <div>
                <span className="text-white font-black text-sm">{qty} pixels</span>
                <span className="text-gray-500 font-semibold text-xs ml-2">(mixed colors)</span>
              </div>
              <button
                onClick={() => buyPixels(qty, cost)}
                disabled={gold < cost}
                className={`btn text-xs px-3 py-2 ${gold >= cost ? 'btn-primary' : 'btn-secondary opacity-40 cursor-not-allowed'}`}
              >
                {cost}g
              </button>
            </div>
          ))}
        </div>

        {/* Individual color packs (10 each) */}
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Color Packs (10 each — 25 gold)</h3>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {Object.entries(PIXEL_COLORS).filter(([k]) => k !== 'rainbow').map(([key, meta]) => {
            const cost = 25
            const have = useGameStore.getState().pixelInventory[key] ?? 0
            return (
              <button
                key={key}
                onClick={() => buyColorPixels(key, 10, cost)}
                disabled={gold < cost}
                className={`card flex items-center gap-2 text-left transition ${gold >= cost ? 'hover:border-game-border2 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                style={{ padding: '0.6rem 0.75rem' }}
              >
                <div className="w-4 h-4 rounded-md flex-shrink-0 border-2 border-black/20" style={{ backgroundColor: meta.hex }} />
                <div>
                  <div className="text-xs font-black text-white capitalize">{key}</div>
                  <div className="text-xs font-semibold text-gray-600">have: {have}</div>
                </div>
              </button>
            )
          })}
        </div>

        <button onClick={onClose} className="btn btn-secondary w-full text-sm">Close Shop</button>
      </motion.div>
    </div>
  )
}
