import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { useShopStore } from '../store/shopStore'
import { GRID_STYLES, BLOCK_TYPES } from '../lib/constants'
import { getShopDesigns } from '../data/designLibrary'
import { DesignMiniThumb } from '../components/ui/DeckSelector'
import { motion, AnimatePresence } from 'framer-motion'

// Block types gated behind permanent shop unlock (enable shop designs of that type in deck)
const GATED_BLOCK_TYPES = ['overflow', 'mirror', 'catalyst', 'void']
const GATED_BLOCK_COSTS = { overflow: 300, mirror: 250, catalyst: 350, void: 200 }

const SPEED_ITEMS = [
  { speed: 0.5, label: '0.5× Slow',  cost: 150,  desc: 'Half game speed — more time to think' },
  { speed: 2,   label: '2× Fast',    cost: 250,  desc: 'Double game speed and timer' },
  { speed: 5,   label: '5× Turbo',   cost: 500,  desc: '5× game speed and timer' },
  { speed: 10,  label: '10× Max',    cost: 1000, desc: '10× game speed and timer' },
]

export default function Shop() {
  const navigate = useNavigate()
  const { gold, addGold, unlockedDesigns: unlockedDesignIds = [], unlockDesign } = useUserStore()
  const { activeGridStyle, setGridStyle, unlockedBlocks, unlockBlock, purchasedSpeeds, purchaseSpeed, isBlockTypeUnlocked } = useShopStore()
  const [toast, setToast] = useState(null)

  function buy(cost, label, onSuccess) {
    if (gold < cost) return
    addGold(-cost)
    onSuccess()
    setToast(label)
    setTimeout(() => setToast(null), 2500)
  }

  const shopDesigns = getShopDesigns()

  return (
    <div className="min-h-screen bg-game-bg px-4 py-8">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="btn btn-secondary text-sm px-4 py-2">← Back</button>
            <h1 className="text-4xl font-black text-white pixel-heading">Shop</h1>
          </div>
          <div className="card-sm text-right px-4 py-2">
            <div className="text-pixel-yellow font-black text-xl">{gold.toLocaleString()}</div>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-widest">gold</div>
          </div>
        </div>

        {/* Grid Styles */}
        <Section title="Grid Styles">
          <p className="text-xs font-semibold text-gray-600 mb-3">One active at a time.</p>
          {Object.entries(GRID_STYLES).map(([key, style]) => {
            const active    = activeGridStyle === key
            const canAfford = gold >= style.cost
            return (
              <div key={key}
                className="card flex items-center justify-between gap-4 transition"
                style={{ padding: '1rem 1.25rem', borderColor: active ? '#1499cc' : undefined }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-black text-sm">{style.label}</span>
                    {active && <span className="text-xs font-black text-pixel-blue">● ACTIVE</span>}
                  </div>
                  <div className="text-gray-500 text-xs font-semibold mt-0.5">{style.desc}</div>
                </div>
                {key === 'base' ? (
                  <button onClick={() => setGridStyle('base')} className="btn btn-secondary text-xs px-3 py-2">Default</button>
                ) : (
                  <button
                    onClick={() => {
                      if (active) return
                      if (style.cost > 0 && !active) buy(style.cost, style.label, () => setGridStyle(key))
                      else setGridStyle(key)
                    }}
                    disabled={!canAfford && !active}
                    className={`btn text-xs px-3 py-2 ${active ? 'btn-secondary opacity-50' : canAfford ? 'btn-primary' : 'btn-secondary opacity-40 cursor-not-allowed'}`}
                  >
                    {active ? 'Active' : `${style.cost} g`}
                  </button>
                )}
              </div>
            )
          })}
        </Section>

        {/* Block Type Unlocks (gate for shop designs) */}
        <Section title="Block Type Unlocks">
          <p className="text-xs font-semibold text-gray-600 mb-3">
            Unlocking a block type enables shop designs of that type to appear in your deck selector.
          </p>
          {GATED_BLOCK_TYPES.map(key => {
            const bt     = BLOCK_TYPES[key]
            const owned  = isBlockTypeUnlocked(key)
            const cost   = GATED_BLOCK_COSTS[key]
            const canAff = gold >= cost
            return (
              <div key={key} className={`card flex items-center justify-between gap-4 ${owned ? 'border-pixel-green/40' : ''}`} style={{ padding: '1rem 1.25rem' }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-black text-sm">{bt.label}</span>
                    {owned && <span className="text-pixel-green text-xs font-black">✓</span>}
                  </div>
                  <div className="text-gray-500 text-xs font-semibold mt-0.5 leading-snug">{bt.desc}</div>
                </div>
                <button
                  onClick={() => buy(cost, bt.label, () => unlockBlock(key))}
                  disabled={owned || !canAff}
                  className={`btn flex-shrink-0 text-sm px-4 py-2 ${owned ? 'btn-secondary opacity-50 cursor-default' : canAff ? 'btn-primary' : 'btn-secondary opacity-40 cursor-not-allowed'}`}
                >
                  {owned ? 'Owned' : `${cost} g`}
                </button>
              </div>
            )
          })}
        </Section>

        {/* Shop-Only Designs */}
        <Section title="Exclusive Designs (30)">
          <p className="text-xs font-semibold text-gray-600 mb-3">
            Special designs unavailable through campaign. Buy to add to your permanent collection.
          </p>
          <div className="space-y-2">
            {shopDesigns.map(design => {
              const owned  = unlockedDesignIds.includes(design.id)
              const cost   = design.shopCost
              const canAff = gold >= cost
              return (
                <div key={design.id}
                  className={`card flex items-center gap-3 ${owned ? 'border-pixel-green/40' : ''}`}
                  style={{ padding: '0.875rem 1rem' }}
                >
                  <DesignMiniThumb design={design} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-black text-sm">{design.name}</span>
                      {owned && <span className="text-pixel-green text-xs font-black">✓</span>}
                    </div>
                    <div className="text-gray-500 text-xs leading-snug">{design.desc}</div>
                    <div className="text-gray-600 text-[10px] capitalize">{design.series} · {design.blockType.replace(/_/g, ' ')}</div>
                  </div>
                  <button
                    onClick={() => buy(cost, design.name, () => unlockDesign(design.id))}
                    disabled={owned || !canAff}
                    className={`btn flex-shrink-0 text-sm px-3 py-2 ${owned ? 'btn-secondary opacity-50 cursor-default' : canAff ? 'btn-primary' : 'btn-secondary opacity-40 cursor-not-allowed'}`}
                  >
                    {owned ? 'Owned' : `${cost} g`}
                  </button>
                </div>
              )
            })}
          </div>
        </Section>

        {/* Speed Boosts */}
        <Section title="Speed Boosts (permanent)">
          <p className="text-xs font-semibold text-gray-600 mb-3">Both production and the timer run at the chosen speed.</p>
          {SPEED_ITEMS.map(({ speed, label, cost, desc }) => {
            const owned  = purchasedSpeeds.includes(speed)
            const canAff = gold >= cost
            return (
              <div key={speed} className={`card flex items-center justify-between gap-4 ${owned ? 'border-pixel-green/40' : ''}`} style={{ padding: '1rem 1.25rem' }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-black text-sm">{label}</span>
                    {owned && <span className="text-pixel-green text-xs font-black">✓ Unlocked</span>}
                  </div>
                  <div className="text-gray-500 text-xs font-semibold mt-0.5">{desc}</div>
                </div>
                <button
                  onClick={() => buy(cost, label, () => purchaseSpeed(speed))}
                  disabled={owned || !canAff}
                  className={`btn flex-shrink-0 text-sm px-4 py-2 ${owned ? 'btn-secondary opacity-50 cursor-default' : canAff ? 'btn-primary' : 'btn-secondary opacity-40 cursor-not-allowed'}`}
                >
                  {owned ? 'Owned' : `${cost} g`}
                </button>
              </div>
            )
          })}
        </Section>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-pixel-green text-black font-black text-sm px-5 py-3 rounded-2xl shadow-2xl z-50"
          >
            ✓ {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}
