import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { useShopStore } from '../store/shopStore'
import { GRID_STYLES, BLOCK_TYPES, PIXEL_COLORS } from '../lib/constants'
import { motion, AnimatePresence } from 'framer-motion'

const SPECIAL_BLOCK_KEYS  = ['overflow', 'mirror', 'catalyst', 'void', 'amplifier', 'resonator', 'reactor', 'conductor', 'prism']
const SPECIAL_PIXEL_KEYS  = ['rainbow', 'silver', 'gold', 'neon']
const PIXEL_PACK_SIZES    = [10, 25, 50, 100]
const PIXEL_PACK_COSTS    = { 10: 30, 25: 70, 50: 130, 100: 240 }
const TEMPLATE_SLOT_COST  = 200

export default function Shop() {
  const { gold, addGold, unlockAchievements, achievements } = useUserStore()
  const { activeGridStyle, setGridStyle, isBlockUnlocked, isPixelUnlocked, unlockBlock, unlockPixel } = useShopStore()
  const [toast, setToast] = useState(null)

  function buy(cost, label, onSuccess) {
    if (gold < cost) return
    addGold(-cost)
    onSuccess()
    setToast(label)
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div className="min-h-screen bg-game-bg px-4 py-8">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="btn btn-secondary text-sm px-4 py-2">← Back</Link>
            <h1 className="text-4xl font-black text-white pixel-heading">Shop</h1>
          </div>
          <div className="card-sm text-right px-4 py-2">
            <div className="text-pixel-yellow font-black text-xl">{gold.toLocaleString()}</div>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-widest">gold</div>
          </div>
        </div>

        {/* Grid Styles */}
        <Section title="Grid Styles">
          <p className="text-xs font-semibold text-gray-600 mb-3">One active at a time. Active style shown with a blue border.</p>
          {Object.entries(GRID_STYLES).map(([key, style]) => {
            const active    = activeGridStyle === key
            const owned     = key === 'base' || active
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
                      if (style.cost === 0 || gold >= style.cost) {
                        if (style.cost > 0 && !active) buy(style.cost, style.label, () => setGridStyle(key))
                        else setGridStyle(key)
                      }
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

        {/* Special Blocks */}
        <Section title="Special Blocks (Unlock for in-level use)">
          {SPECIAL_BLOCK_KEYS.map(key => {
            const bt     = BLOCK_TYPES[key]
            const owned  = isBlockUnlocked(key)
            const canAff = gold >= bt.shopCost
            return (
              <div key={key} className={`card flex items-center justify-between gap-4 ${owned ? 'border-pixel-green/40' : ''}`} style={{ padding: '1rem 1.25rem' }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-black text-sm">{bt.label}</span>
                    {owned && <span className="text-pixel-green text-xs font-black">✓</span>}
                  </div>
                  <div className="text-gray-500 text-xs font-semibold mt-0.5 leading-snug">{bt.desc}</div>
                  {owned && <div className="text-gray-600 text-xs mt-0.5">In-level cost: {bt.levelCost} px</div>}
                </div>
                <button
                  onClick={() => buy(bt.shopCost, bt.label, () => unlockBlock(key))}
                  disabled={owned || !canAff}
                  className={`btn flex-shrink-0 text-sm px-4 py-2 ${owned ? 'btn-secondary opacity-50 cursor-default' : canAff ? 'btn-primary' : 'btn-secondary opacity-40 cursor-not-allowed'}`}
                >
                  {owned ? 'Owned' : `${bt.shopCost} g`}
                </button>
              </div>
            )
          })}
        </Section>

        {/* Special Pixels */}
        <Section title="Special Pixel Unlocks">
          {SPECIAL_PIXEL_KEYS.map(key => {
            const px     = PIXEL_COLORS[key]
            const owned  = isPixelUnlocked(key)
            const cost   = { rainbow: 1000, silver: 400, gold: 600, neon: 500 }[key] ?? 500
            const canAff = gold >= cost
            return (
              <div key={key} className={`card flex items-center justify-between gap-4 ${owned ? 'border-pixel-green/40' : ''}`} style={{ padding: '1rem 1.25rem' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-lg flex-shrink-0 border-2 border-black/20" style={{ backgroundColor: px.hex }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-black text-sm">{px.label}</span>
                      {owned && <span className="text-pixel-green text-xs font-black">✓</span>}
                    </div>
                    <div className="text-gray-500 text-xs font-semibold">{px.desc ?? `${px.label} pixel — unlocks in BlockEditor`}</div>
                    {owned && <div className="text-gray-600 text-xs">In-level cost: {px.cost} px each</div>}
                  </div>
                </div>
                <button
                  onClick={() => {
                    buy(cost, px.label + ' Pixel', () => {
                      unlockPixel(key)
                      if (key === 'rainbow' && !achievements.has('rainbow_unlock')) unlockAchievements(['rainbow_unlock'])
                    })
                  }}
                  disabled={owned || !canAff}
                  className={`btn flex-shrink-0 text-sm px-4 py-2 ${owned ? 'btn-secondary opacity-50 cursor-default' : canAff ? 'btn-primary' : 'btn-secondary opacity-40 cursor-not-allowed'}`}
                >
                  {owned ? 'Owned' : `${cost} g`}
                </button>
              </div>
            )
          })}
        </Section>

        {/* Pixel Packs */}
        <Section title="Pixel Packs (mixed colors)">
          {PIXEL_PACK_SIZES.map(qty => {
            const cost   = PIXEL_PACK_COSTS[qty]
            const canAff = gold >= cost
            return (
              <div key={qty} className="card flex items-center justify-between gap-4" style={{ padding: '1rem 1.25rem' }}>
                <div>
                  <span className="text-white font-black text-sm">{qty} pixels</span>
                  <div className="text-gray-500 text-xs font-semibold mt-0.5">{qty} colored pixels — added to your next level start</div>
                </div>
                <button
                  onClick={() => buy(cost, `Pixel Pack ×${qty}`, () => {})}
                  disabled={!canAff}
                  className={`btn text-sm px-4 py-2 ${canAff ? 'btn-primary' : 'btn-secondary opacity-40 cursor-not-allowed'}`}
                >
                  {cost} g
                </button>
              </div>
            )
          })}
        </Section>

        {/* Other */}
        <Section title="Other">
          <div className="card flex items-center justify-between gap-4" style={{ padding: '1rem 1.25rem' }}>
            <div>
              <span className="text-white font-black text-sm">Template Slot +1</span>
              <div className="text-gray-500 text-xs font-semibold mt-0.5">Adds one more saved block template slot (base: 5)</div>
            </div>
            <button
              onClick={() => buy(TEMPLATE_SLOT_COST, 'Template Slot', () => {})}
              disabled={gold < TEMPLATE_SLOT_COST}
              className={`btn text-sm px-4 py-2 ${gold >= TEMPLATE_SLOT_COST ? 'btn-primary' : 'btn-secondary opacity-40 cursor-not-allowed'}`}
            >
              {TEMPLATE_SLOT_COST} g
            </button>
          </div>
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
