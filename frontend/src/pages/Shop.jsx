import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { useShopStore } from '../store/shopStore'
import { GRID_STYLES, BLOCK_TYPES } from '../lib/constants'
import { DESIGNS, getShopDesigns } from '../data/designLibrary'
import { DesignMiniThumb } from '../components/ui/DeckSelector'
import { motion, AnimatePresence } from 'framer-motion'
import { SYNERGY_DEFS, TYPE_LABELS } from '../engine/designSynergies'

// Block types gated behind permanent shop unlock (enable shop designs of that type in deck)
const GATED_BLOCK_TYPES = ['overflow', 'mirror', 'catalyst', 'void']
const GATED_BLOCK_COSTS = { overflow: 300, mirror: 250, catalyst: 350, void: 200 }

const SPEED_ITEMS = [
  { speed: 0.5, label: '0.5× Slow',  cost: 150,  desc: 'Half game speed — more time to think' },
  { speed: 2,   label: '2× Fast',    cost: 250,  desc: 'Double game speed and timer' },
  { speed: 5,   label: '5× Turbo',   cost: 500,  desc: '5× game speed and timer' },
  { speed: 10,  label: '10× Max',    cost: 1000, desc: '10× game speed and timer' },
]

function getDesignRollCost(rollCount) {
  return Math.min(100 * (rollCount + 1), 1000)
}

function getSynergyScrollCost(scrollCount) {
  return Math.min(50 + scrollCount * 25, 500)
}

// Synergies the player always knows — not eligible for scroll reveal
const BASIC_SYNERGY_IDS = new Set(['DOUBLE_DOWN', 'REACTOR_NETWORK', 'ECHO_CHAMBER', 'SPECIALIST', 'BEE_AND_FLOWER'])

export default function Shop() {
  const navigate = useNavigate()
  const { gold, addGold, unlockedDesigns: unlockedDesignIds = [], unlockDesign, discoveredSynergies = [], revealSynergy } = useUserStore()
  const { activeGridStyle, setGridStyle, ownGridStyle, unlockedBlocks, unlockBlock, purchasedSpeeds, purchaseSpeed, isBlockTypeUnlocked, designRollCount, incrementDesignRollCount, synergyScrollCount, incrementSynergyScrollCount } = useShopStore()
  const [toast, setToast] = useState(null)
  const [rolledDesign, setRolledDesign] = useState(null)
  const [rollFlash, setRollFlash] = useState(null)
  const [showRollModal, setShowRollModal] = useState(false)
  const [rollModalData, setRollModalData] = useState(null)
  const [revealedSynergy, setRevealedSynergy] = useState(null)  // synergy ID shown after scroll

  function buy(cost, label, onSuccess) {
    if (gold < cost) return
    addGold(-cost)
    onSuccess()
    setToast(label)
    setTimeout(() => setToast(null), 2500)
  }

  const rollCost = getDesignRollCost(designRollCount)
  const nextRollCost = getDesignRollCost(designRollCount + 1)
  const unrollableDesigns = DESIGNS.filter(d => !unlockedDesignIds.includes(d.id))
  const collectionComplete = unrollableDesigns.length === 0

  function handleDesignRoll() {
    if (gold < rollCost || collectionComplete) return
    const design = unrollableDesigns[Math.floor(Math.random() * unrollableDesigns.length)]
    addGold(-rollCost)
    unlockDesign(design.id)
    incrementDesignRollCount()
    setRolledDesign(design)
    setRollFlash('ok')
    setRollModalData({ design, type: 'design' })
    setShowRollModal(true)
    setTimeout(() => setRollFlash(null), 1500)
  }

  // Synergy scroll
  const knownSynergyIds   = new Set([...BASIC_SYNERGY_IDS, ...discoveredSynergies])
  const unknownSynergyIds = Object.keys(SYNERGY_DEFS).filter(id => !knownSynergyIds.has(id))
  const scrollCost        = getSynergyScrollCost(synergyScrollCount)
  const nextScrollCost    = getSynergyScrollCost(synergyScrollCount + 1)
  const scrollAllRevealed = unknownSynergyIds.length === 0

  function handleSynergyScroll() {
    if (gold < scrollCost || scrollAllRevealed) return
    const id = unknownSynergyIds[Math.floor(Math.random() * unknownSynergyIds.length)]
    addGold(-scrollCost)
    revealSynergy(id)
    incrementSynergyScrollCount()
    setRevealedSynergy(id)
    setToast('Synergy revealed!')
    setTimeout(() => setToast(null), 2500)
  }

  const shopDesigns = getShopDesigns()

  return (
    <div className="min-h-screen bg-game-bg">
      <div className="sticky top-0 z-10 px-4 pt-5 pb-3 border-b border-game-border" style={{ background: '#06061a' }}>
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="btn btn-secondary text-sm px-4 py-2">← Back</button>
            <h1 className="text-3xl font-black text-white pixel-heading">Shop</h1>
          </div>
          <div className="card-sm text-right px-4 py-2">
            <div className="text-pixel-yellow font-black text-xl">{gold.toLocaleString()}</div>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-widest">gold</div>
          </div>
        </div>
      </div>
      <div className="px-4 py-6">
      <div className="max-w-xl mx-auto">

        {/* Design Roll */}
        <Section title="Design Roll">
          <p className="text-xs font-semibold text-gray-600 mb-3">
            Spend gold to unlock a random design from the full collection.
            Cost increases by 100g each roll, capped at 1000g.
          </p>
          <div
            className="card flex flex-col gap-3"
            style={{ padding: '1.25rem', borderColor: rollFlash === 'ok' ? '#00d49a' : undefined }}
          >
            {/* Revealed design or placeholder */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center flex-shrink-0 rounded-xl overflow-hidden"
                style={{ width: 56, height: 56, background: '#0a0a1a', border: '2px solid #36366a' }}
              >
                {rolledDesign
                  ? <DesignMiniThumb design={rolledDesign} size={52} />
                  : <span className="text-gray-500 font-black text-2xl">?</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                {rolledDesign ? (
                  <>
                    <div className="text-sm font-black text-pixel-green">{rolledDesign.name}</div>
                    <div className="text-xs text-gray-400 capitalize">{rolledDesign.series}</div>
                    <div className="text-[10px] text-gray-600 capitalize">{rolledDesign.blockType?.replace(/_/g, ' ')}</div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-black text-white">Random Design</div>
                    <div className="text-xs text-gray-500">Any design you don't own yet</div>
                  </>
                )}
              </div>
            </div>

            {/* Roll stats */}
            <div className="flex items-center justify-between text-[10px] text-gray-600">
              <span>{unrollableDesigns.length} designs available</span>
              <span>Roll #{designRollCount + 1}</span>
            </div>

            {/* Roll button */}
            {collectionComplete ? (
              <div className="text-center text-xs font-black text-pixel-yellow py-2">
                Collection Complete!
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className={`text-lg font-black ${gold >= rollCost ? 'text-pixel-yellow' : 'text-gray-600'}`}>
                    {rollCost}g
                  </div>
                  {nextRollCost !== rollCost && (
                    <div className="text-[9px] text-gray-700">next: {nextRollCost}g</div>
                  )}
                </div>
                <button
                  onClick={handleDesignRoll}
                  disabled={gold < rollCost}
                  className={`btn text-sm px-5 py-2 ${gold >= rollCost ? 'btn-primary' : 'btn-secondary opacity-40 cursor-not-allowed'}`}
                >
                  Roll
                </button>
              </div>
            )}
          </div>
        </Section>

        {/* Synergy Compendium */}
        <Section title="Synergy Compendium">
          <p className="text-xs font-semibold mb-3" style={{ color: '#7b78a8' }}>
            Spend gold to reveal the details of one random undiscovered synergy.
            Synergies you activate in-game are discovered automatically.
          </p>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-3 text-xs font-bold" style={{ color: '#7b78a8' }}>
            <span>{knownSynergyIds.size} / {Object.keys(SYNERGY_DEFS).length} discovered</span>
            <div className="flex-1 progress-track" style={{ height: 6 }}>
              <div className="progress-fill" style={{ transform: `scaleX(${knownSynergyIds.size / Object.keys(SYNERGY_DEFS).length})` }} />
            </div>
          </div>

          {/* Last revealed synergy preview */}
          {revealedSynergy && SYNERGY_DEFS[revealedSynergy] && (
            <div className="rounded-xl p-3 mb-3 border" style={{ background: '#0c0c28', borderColor: '#a78bfa44', borderLeft: '4px solid #a78bfa' }}>
              <div className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: '#a78bfa' }}>Just Revealed</div>
              <div className="text-sm font-black" style={{ color: '#ddd8f8' }}>{SYNERGY_DEFS[revealedSynergy].name}</div>
              <div className="text-xs mt-0.5" style={{ color: '#7b78a8' }}>{TYPE_LABELS[SYNERGY_DEFS[revealedSynergy].type] ?? ''}</div>
            </div>
          )}

          <div className="card flex items-center justify-between gap-4" style={{ padding: '1rem 1.25rem' }}>
            <div className="flex items-center gap-3">
              <div className="text-2xl">📜</div>
              <div>
                <div className="font-black text-sm" style={{ color: '#ddd8f8' }}>Synergy Scroll</div>
                <div className="text-xs" style={{ color: '#7b78a8' }}>
                  {scrollAllRevealed ? 'All synergies discovered!' : `${unknownSynergyIds.length} synergies still hidden`}
                </div>
                {!scrollAllRevealed && nextScrollCost !== scrollCost && (
                  <div className="text-[9px]" style={{ color: '#3c3c72' }}>next: {nextScrollCost}g</div>
                )}
              </div>
            </div>
            {scrollAllRevealed ? (
              <div className="text-xs font-black" style={{ color: '#34d399' }}>Complete ✓</div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="font-black text-lg" style={{ color: gold >= scrollCost ? '#fbbf24' : '#3c3c72' }}>
                  {scrollCost}g
                </div>
                <button
                  onClick={handleSynergyScroll}
                  disabled={gold < scrollCost}
                  className={`btn text-sm px-4 py-2 ${gold >= scrollCost ? 'btn-primary' : 'btn-secondary opacity-40 cursor-not-allowed'}`}
                >
                  Roll
                </button>
              </div>
            )}
          </div>
        </Section>

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
                      if (style.cost > 0) buy(style.cost, style.label, () => { setGridStyle(key); ownGridStyle(key) })
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

      {/* Roll reveal modal */}
      <AnimatePresence>
        {showRollModal && rollModalData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 px-4"
            onClick={() => setShowRollModal(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="card w-full max-w-xs text-center"
              style={{ padding: '2.5rem' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-xs font-black uppercase tracking-widest text-pixel-green mb-3">
                New Design Unlocked!
              </div>

              {/* Big design preview */}
              <div
                className="mx-auto mb-4 flex items-center justify-center rounded-2xl"
                style={{ width: 96, height: 96, background: '#0a0a1a', border: '3px solid #00d49a44' }}
              >
                <DesignMiniThumb design={rollModalData.design} size={88} />
              </div>

              <div className="text-2xl font-black text-white pixel-heading mb-1">{rollModalData.design.name}</div>
              <div className="text-sm text-pixel-blue capitalize mb-1">{rollModalData.design.series} series</div>
              <div className="text-xs text-gray-500 capitalize mb-1">{rollModalData.design.blockType?.replace(/_/g, ' ')} type</div>
              {rollModalData.design.desc && (
                <div className="text-xs text-gray-400 leading-snug mt-2 mb-5">{rollModalData.design.desc}</div>
              )}

              <button
                onClick={() => setShowRollModal(false)}
                className="btn btn-primary w-full text-base"
              >
                Added to Collection
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
