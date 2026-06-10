import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { useShopStore } from '../store/shopStore'
import { DESIGNS, ALL_SERIES } from '../data/designLibrary'
import { GRID_STYLES, BLOCK_TYPE_VISUAL } from '../lib/constants'
import { useDesignUnlocks } from '../lib/designUnlocks'
import { DesignMiniThumb, DesignTooltipBody } from '../components/ui/DeckSelector'

const TABS = ['blocks', 'grids', 'templates']

export default function Profile() {
  const { user } = useUserStore()
  const { isDesignUnlocked, unlockedDesigns } = useDesignUnlocks()
  const { activeGridStyle, purchasedGridStyles = ['base'] } = useShopStore()

  const [tab, setTab]               = useState('blocks')
  const [seriesFilter, setSeriesFilter] = useState('all')
  const [hoveredId, setHoveredId]   = useState(null)
  const [mousePos, setMousePos]     = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e) => setMousePos({ x: e.clientX, y: e.clientY }), [])

  const filtered = seriesFilter === 'all'
    ? DESIGNS
    : DESIGNS.filter(d => d.series === seriesFilter)

  const hoveredDesign  = hoveredId ? DESIGNS.find(d => d.id === hoveredId) : null
  const unlockedCount  = unlockedDesigns.length

  if (!user) {
    return (
      <div className="min-h-screen bg-game-bg flex items-center justify-center">
        <div className="card text-center max-w-sm mx-4" style={{ padding: '2rem' }}>
          <div className="text-2xl font-black text-white mb-3 pixel-heading">Collection</div>
          <p className="text-gray-500 text-sm mb-6">Log in to track your collection across sessions.</p>
          <Link to="/" className="btn btn-primary text-base">← Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-game-bg px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <Link to="/" className="btn btn-secondary text-sm px-4 py-2">← Back</Link>
            <h1 className="text-3xl font-black text-white pixel-heading">Collection</h1>
          </div>
          <div className="card-sm px-4 py-2 text-right">
            <div className="text-xl font-black text-white">{unlockedCount}</div>
            <div className="text-xs text-gray-600 uppercase font-bold">designs</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs font-black px-4 py-1.5 rounded-lg border transition capitalize
                ${tab === t
                  ? 'bg-pixel-blue/20 border-pixel-blue text-pixel-blue'
                  : 'border-game-border text-gray-500 hover:text-white'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── BLOCKS TAB ─────────────────────────────────────────────────────── */}
        {tab === 'blocks' && (
          <>
            {/* Series filter */}
            <div className="flex gap-1.5 flex-wrap mb-4">
              {['all', ...ALL_SERIES].map(s => (
                <button
                  key={s}
                  onClick={() => setSeriesFilter(s)}
                  className={`text-xs font-black px-2.5 py-1 rounded-lg border transition capitalize
                    ${seriesFilter === s
                      ? 'bg-pixel-blue/20 border-pixel-blue text-pixel-blue'
                      : 'border-game-border text-gray-500 hover:text-white'}`}
                >
                  {s}
                  {s !== 'all' && (
                    <span className="ml-1 opacity-50">
                      {DESIGNS.filter(d => d.series === s && isDesignUnlocked(d.id)).length}/
                      {DESIGNS.filter(d => d.series === s).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Design grid */}
            <div
              className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10"
              onMouseMove={handleMouseMove}
            >
              {filtered.map(design => {
                const unlocked = isDesignUnlocked(design.id)
                const typeVis  = BLOCK_TYPE_VISUAL[design.blockType]
                return (
                  <div
                    key={design.id}
                    onMouseEnter={() => setHoveredId(design.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="rounded-xl flex flex-col items-center p-1.5 gap-1 transition cursor-default relative"
                    style={{
                      borderWidth:  typeVis?.borderWidth ?? 2,
                      borderStyle:  unlocked ? (typeVis?.borderStyle ?? 'solid') : 'solid',
                      borderColor:  hoveredId === design.id
                        ? '#1499cc'
                        : unlocked ? (typeVis?.color ?? '#00d49a') + '55' : '#1e1e3a',
                      background: hoveredId === design.id ? '#0d1a2e' : unlocked ? '#0a0f1a' : '#080810',
                    }}
                  >
                    {unlocked ? (
                      <DesignMiniThumb design={design} size={36} />
                    ) : (
                      <div
                        className="rounded overflow-hidden"
                        style={{ width: 36, height: 36, background: '#111128', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <span className="text-gray-700 font-black text-lg">?</span>
                      </div>
                    )}
                    <span
                      className="text-[9px] font-black text-center leading-tight truncate w-full"
                      style={{ color: unlocked ? '#a0aec0' : '#4a5568' }}
                    >
                      {unlocked ? design.name : '???'}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Hover tooltip */}
            {hoveredDesign && (() => {
              const tipW   = 176
              const margin = 16
              const x = mousePos.x + margin + tipW > window.innerWidth
                ? mousePos.x - tipW - margin : mousePos.x + margin
              const y = Math.min(mousePos.y - 8, window.innerHeight - 280)
              const unlocked = isDesignUnlocked(hoveredDesign.id)
              return (
                <div
                  style={{ position: 'fixed', left: x, top: y, width: tipW, zIndex: 200, pointerEvents: 'none', background: '#0d0d22' }}
                  className="rounded-xl border-2 border-game-border p-3 flex flex-col gap-2"
                >
                  {unlocked ? (
                    <DesignTooltipBody design={hoveredDesign} />
                  ) : (
                    <>
                      <div className="w-16 h-16 mx-auto rounded-xl bg-gray-900 flex items-center justify-center">
                        <span className="text-gray-600 text-3xl font-black">?</span>
                      </div>
                      <div className="text-sm font-black text-gray-600">???</div>
                      <div className="text-xs text-gray-700 capitalize">{hoveredDesign.series}</div>
                      <div className="text-xs text-gray-700 leading-snug">
                        {hoveredDesign.unlockSource === 'starter'          ? 'Complete the tutorial' :
                         hoveredDesign.unlockSource === 'campaign_choice'  ? 'Earn by completing campaign levels' :
                         hoveredDesign.unlockSource === 'shop'             ? 'Available in the Shop' :
                         hoveredDesign.unlockSource === 'endless_20min'    ? 'Survive 20 min in Endless' :
                         hoveredDesign.unlockSource === 'quiz_25'          ? 'Answer 25 quiz questions correctly' :
                         hoveredDesign.unlockSource === 'quiz_50'          ? 'Answer 50 quiz questions correctly' :
                         'Special unlock'}
                      </div>
                    </>
                  )}
                </div>
              )
            })()}
          </>
        )}

        {/* ── GRIDS TAB ──────────────────────────────────────────────────────── */}
        {tab === 'grids' && (
          <div>
            <p className="text-xs text-gray-600 font-semibold mb-4">
              Grid styles modify rules for the entire grid. Purchase in the <Link to="/shop" className="text-pixel-blue hover:underline">Shop</Link>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(GRID_STYLES).map(([key, style]) => {
                const owned  = purchasedGridStyles.includes(key)
                const active = activeGridStyle === key
                return (
                  <div
                    key={key}
                    className="rounded-xl p-3 flex flex-col gap-1 border-2 transition"
                    style={{
                      background:   active ? '#0d1a2e' : owned ? '#0a0f1a' : '#080810',
                      borderColor:  active ? '#1499cc' : owned ? '#00d49a55' : '#1e1e3a',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-white">{style.label}</span>
                      {active && (
                        <span className="text-[10px] font-black text-pixel-blue border border-pixel-blue/40 rounded px-1.5 py-0.5">
                          ACTIVE
                        </span>
                      )}
                      {!active && owned && (
                        <span className="text-[10px] font-black text-pixel-green">✓ owned</span>
                      )}
                      {!owned && key !== 'base' && (
                        <span className="text-[10px] font-black text-pixel-yellow">{style.cost}g</span>
                      )}
                      {key === 'base' && (
                        <span className="text-[10px] font-black text-gray-600">free</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug">{style.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── TEMPLATES TAB ──────────────────────────────────────────────────── */}
        {tab === 'templates' && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-5xl font-black text-gray-800">⬜</div>
            <div className="text-lg font-black text-gray-600">No templates yet</div>
            <p className="text-xs text-gray-700 text-center max-w-xs leading-relaxed">
              Save named grid layouts from a completed level to revisit your best configurations later.
            </p>
            <span className="text-[10px] font-black text-gray-700 border border-game-border rounded px-2 py-1 mt-2">
              Coming soon
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
