import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { useShopStore } from '../store/shopStore'
import { DESIGNS, ALL_SERIES } from '../data/designLibrary'
import { GRID_STYLES, BLOCK_TYPES, BLOCK_TYPE_VISUAL } from '../lib/constants'
import { useDesignUnlocks } from '../lib/designUnlocks'
import { DesignMiniThumb, DesignTooltipBody } from '../components/ui/DeckSelector'
import { SYNERGY_DEFS, TYPE_LABELS } from '../engine/designSynergies'

const TABS = ['templates', 'blocks', 'grids', 'synergies']

const GATED_BLOCK_TYPES = ['overflow', 'mirror', 'catalyst', 'void']

// Synergies that are visible immediately without any discovery requirement
const BASIC_SYNERGY_IDS = new Set([
  'DOUBLE_DOWN', 'REACTOR_NETWORK', 'ECHO_CHAMBER', 'SPECIALIST', 'BEE_AND_FLOWER',
])

const TYPE_COLORS = {
  exact_count:     '#ffd166',
  adjacency_pair:  '#f03e4e',
  long_range:      '#00d49a',
  core_radius:     '#fb923c',
  block_type_count:'#6366f1',
  cross_family:    '#f472b6',
  meta_synergy:    '#a78bfa',
}

function getSynergyHint(def) {
  if (!def) return 'Mysterious combination'
  switch (def.type) {
    case 'adjacency_pair':
      return `Place "${def.designA}" directly next to "${def.designB}"`
    case 'long_range':
      return def.series
        ? `Two ${def.series} designs at least ${def.minDist} cells apart`
        : `${def.seriesA ?? def.designA} and ${def.seriesB ?? def.designB} far apart`
    case 'core_radius': {
      const core = def.coreDesignId ?? `any ${def.coreSeries}`
      return `${core} + ${def.requiredSatellites}+ ${def.satelliteSeries} within ${def.radius} cells`
    }
    case 'block_type_count':
      return def.blockType
        ? `${def.required}+ blocks with the "${def.blockType}" effect`
        : `5+ blocks of the same effect type`
    case 'cross_family': {
      const parts = (def.requires ?? []).map(r => r.designId ?? `${r.count ?? 1} ${r.series}`)
      return `Cross-family: ${parts.join(' + ')}`
    }
    case 'meta_synergy':
      return `Requires: ${(def.requires ?? []).join(' + ')} both active`
    default:
      return def.desc ?? 'Mysterious combination'
  }
}

function getBonusSummary(def) {
  if (!def) return ''
  if (def.type === 'core_radius')
    return `Core +${Math.round(def.ownCore * 100)}% · Ring +${Math.round(def.ownSatellite * 100)}%`
  return `+${Math.round((def.own ?? 0) * 100)}%${def.radiation ? ` · radiates +${Math.round(def.radiation.amount * 100)}%` : ''}`
}

const ALL_SYNERGY_IDS = Object.keys(SYNERGY_DEFS)

export default function Profile() {
  const { user, discoveredSynergies = [] } = useUserStore()
  const { isDesignUnlocked, unlockedDesigns } = useDesignUnlocks()
  const { activeGridStyle, purchasedGridStyles = ['base'], isBlockTypeUnlocked } = useShopStore()

  // A synergy is "known" if it's basic, or the player has discovered/revealed it
  const knownSynergies = new Set([
    ...BASIC_SYNERGY_IDS,
    ...discoveredSynergies,
  ])

  const [tab, setTab]               = useState('templates')
  const [seriesFilter, setSeriesFilter] = useState('all')
  const [synergyFilter, setSynergyFilter] = useState('all')
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
            <div className="text-xs text-gray-600 uppercase font-bold">templates</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs font-black px-4 py-1.5 rounded-lg border transition capitalize
                ${tab === t
                  ? 'bg-neon-indigo/20 border-neon-indigo text-neon-indigo'
                  : 'border-void-border text-gray-500 hover:text-white'}`}
            >
              {t}
              {t === 'synergies' && (
                <span className="ml-1 opacity-60">
                  {knownSynergies.size}/{ALL_SYNERGY_IDS.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TEMPLATES TAB ──────────────────────────────────────────────────── */}
        {tab === 'templates' && (
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

        {/* ── BLOCKS TAB ─────────────────────────────────────────────────────── */}
        {tab === 'blocks' && (
          <div>
            <p className="text-xs text-gray-600 font-semibold mb-4">
              Block types define the effect each design has when placed. Basic types are always available.
              Shop-only types require a one-time unlock in the <Link to="/shop" className="text-pixel-blue hover:underline">Shop</Link>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(BLOCK_TYPES).map(([key, bt]) => {
                const vis     = BLOCK_TYPE_VISUAL[key]
                const isGated = GATED_BLOCK_TYPES.includes(key)
                const owned   = isBlockTypeUnlocked(key)
                return (
                  <div
                    key={key}
                    className="rounded-xl p-3 flex items-start gap-3 border-2 transition"
                    style={{
                      background:  owned ? '#0a0f1a' : '#080810',
                      borderColor: owned ? (vis?.color ?? '#00d49a') + '55' : '#1e1e3a',
                    }}
                  >
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded font-black text-[10px]"
                      style={{
                        width: 36, height: 36,
                        background: owned ? (vis?.color ?? '#5c7abf') + '22' : '#111128',
                        color: owned ? (vis?.color ?? '#5c7abf') : '#4a5568',
                        border: `${vis?.borderWidth ?? 2}px ${vis?.borderStyle ?? 'solid'} ${owned ? (vis?.color ?? '#5c7abf') + '88' : '#2a2a4a'}`,
                      }}
                    >
                      {vis?.label ?? key.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black" style={{ color: owned ? '#e2e8f0' : '#4a5568' }}>
                          {bt.label}
                        </span>
                        {isGated && !owned && (
                          <span className="text-[10px] font-black text-pixel-yellow">Shop unlock</span>
                        )}
                        {owned && (
                          <span className="text-[10px] font-black" style={{ color: vis?.color ?? '#00d49a' }}>✓</span>
                        )}
                      </div>
                      <p className="text-[11px] leading-snug mt-0.5" style={{ color: owned ? '#718096' : '#3a3a5a' }}>
                        {bt.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {/* ── SYNERGIES TAB ──────────────────────────────────────────────────── */}
        {tab === 'synergies' && (
          <div>
            {/* Progress */}
            <div className="flex items-center gap-3 mb-5 p-3 rounded-xl border" style={{ background: '#0c0c28', borderColor: '#1e1e48' }}>
              <div className="flex-1">
                <div className="flex justify-between text-xs font-bold mb-1" style={{ color: '#7b78a8' }}>
                  <span>Synergies Discovered</span>
                  <span style={{ color: '#ddd8f8' }}>{knownSynergies.size} / {ALL_SYNERGY_IDS.length}</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ transform: `scaleX(${knownSynergies.size / ALL_SYNERGY_IDS.length})` }}
                  />
                </div>
              </div>
              <Link to="/shop" className="btn btn-secondary text-xs px-3 py-1.5">
                Roll Scrolls →
              </Link>
            </div>

            {/* Type filter */}
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {['all', ...Object.keys(TYPE_LABELS)].map(t => (
                <button
                  key={t}
                  onClick={() => setSynergyFilter(t)}
                  className="text-xs font-black px-2 py-1 rounded-lg border transition"
                  style={synergyFilter === t
                    ? { background: (TYPE_COLORS[t] ?? '#6366f1') + '20', borderColor: TYPE_COLORS[t] ?? '#6366f1', color: TYPE_COLORS[t] ?? '#6366f1' }
                    : { background: 'transparent', borderColor: '#1e1e48', color: '#3c3c72' }
                  }
                >
                  {t === 'all' ? 'All' : TYPE_LABELS[t] ?? t}
                </button>
              ))}
            </div>

            {/* Synergy cards */}
            <div className="flex flex-col gap-2">
              {ALL_SYNERGY_IDS
                .filter(id => synergyFilter === 'all' || SYNERGY_DEFS[id]?.type === synergyFilter)
                .map(id => {
                  const def     = SYNERGY_DEFS[id]
                  const known   = knownSynergies.has(id)
                  const typeCol = TYPE_COLORS[def?.type] ?? '#6366f1'
                  const typeLabel = TYPE_LABELS[def?.type] ?? def?.type ?? ''

                  return (
                    <div
                      key={id}
                      className="rounded-xl border flex gap-3 p-3 transition"
                      style={{
                        background: known ? '#0c0c28' : '#08081c',
                        borderColor: known ? typeCol + '44' : '#1e1e48',
                        borderLeft: `4px solid ${known ? typeCol : '#1e1e48'}`,
                        opacity: known ? 1 : 0.7,
                      }}
                    >
                      {/* Type badge */}
                      <div className="flex-shrink-0 pt-0.5">
                        <span
                          className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest"
                          style={{
                            background: (known ? typeCol : '#2e2e60') + '22',
                            color: known ? typeCol : '#3c3c72',
                            border: `1px solid ${(known ? typeCol : '#2e2e60')}44`,
                          }}
                        >
                          {typeLabel}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-black text-sm" style={{ color: known ? '#ddd8f8' : '#3c3c72' }}>
                            {known ? def.name : '??? Unknown Synergy'}
                          </div>
                          {known && def && (
                            <div className="text-xs font-bold flex-shrink-0" style={{ color: typeCol }}>
                              {getBonusSummary(def)}
                            </div>
                          )}
                        </div>

                        <div className="text-xs mt-1" style={{ color: known ? '#7b78a8' : '#2e2e60' }}>
                          {known ? getSynergyHint(def) : 'Activate this synergy in a level — or reveal it with a Synergy Scroll from the Shop'}
                        </div>

                        {known && def?.reward && (
                          <div className="text-[10px] mt-1 font-bold" style={{ color: '#fbbf24' }}>
                            {def.reward.type === 'random_block' ? '🎁 Rewards a free random block on first activation' :
                             def.reward.type === 'pixels'       ? `✨ Rewards +${def.reward.amount?.toLocaleString()} pixels on first activation` :
                             def.reward.type === 'gold'         ? `💰 Rewards +${def.reward.amount}g on first activation` : null}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
