import { useMemo, useState, useEffect, useRef } from 'react'
import { buildSynergyData, SYNERGY_DEFS } from '../../engine/designSynergies'
import { useGameStore } from '../../store/gameStore'
import { useShopStore } from '../../store/shopStore'
import { useUserStore } from '../../store/userStore'
import { useDesignUnlocks } from '../../lib/designUnlocks'
import { playSynergyActivate, playDesignUnlock } from '../../lib/audio'
import { getOwnedBlockTypes } from '../../lib/constants'

// ── Type labels & colors ──────────────────────────────────────────────────────
const TYPE_LABELS = {
  series_count:     'ZONE CLUSTER',
  exact_count:      'DUPLICATES',
  adjacency_pair:   'ADJACENT',
  row_series:       'SAME ROW',
  column_series:    'SAME COLUMN',
  long_range:       'LONG RANGE',
  core_radius:      'RADIUS',
  block_type_count: 'BLOCK TYPE',
  cross_family:     'CROSS FAMILY',
  meta_synergy:     'META',
}

const TYPE_COLORS = {
  series_count:     '#1499cc',
  exact_count:      '#ffd166',
  adjacency_pair:   '#f03e4e',
  row_series:       '#a066f0',
  column_series:    '#c84ff0',
  long_range:       '#00d49a',
  core_radius:      '#ff9f43',
  block_type_count: '#54a0ff',
  cross_family:     '#ff6b9d',
  meta_synergy:     '#ffd166',
}

// ── Setup instruction text ────────────────────────────────────────────────────
function synergySetupText(def) {
  if (!def) return ''
  switch (def.type) {
    case 'series_count':
      if (def.maxSpan) {
        return `Place ${def.required} unique ${def.series} designs within any ${def.maxSpan}×${def.maxSpan} zone on the grid.`
      }
      return `Place ${def.required} unique ${def.series} designs anywhere on the grid.`
    case 'exact_count':
      return `Place ${def.required} copies of the exact same design anywhere on the grid.`
    case 'adjacency_pair': {
      const aLabel = `"${def.designA}"`
      const bLabel = `"${def.designB}"`
      return `Place ${aLabel} directly next to ${bLabel} (must share a side — not diagonal).`
    }
    case 'row_series':
      return `Place ${def.required} ${def.series} designs in the same horizontal row.`
    case 'column_series':
      return `Place ${def.required} ${def.series} designs in the same vertical column.`
    case 'long_range': {
      const dist = def.minDist
      if (def.series) return `Place 2 ${def.series} designs at least ${dist} cells apart (Manhattan distance).`
      const aLabel = def.designA ? `"${def.designA}"` : `a ${def.seriesA} design`
      const bLabel = def.designB ? `"${def.designB}"` : `a ${def.seriesB} design`
      return `Place ${aLabel} and ${bLabel} at least ${dist} cells apart.`
    }
    case 'core_radius': {
      const coreLabel = def.coreDesignId ? `"${def.coreDesignId}"` : `any ${def.coreSeries}`
      const satLabel  = def.satelliteSeries ?? 'matching designs'
      return `Place ${coreLabel} as the core, then place ${def.requiredSatellites}+ ${satLabel} designs within ${def.radius} cells of it.`
    }
    case 'block_type_count':
      return def.blockType
        ? `Place ${def.required} blocks with the "${def.blockType}" effect anywhere on the grid.`
        : `Place ${def.required} blocks of the same effect type anywhere on the grid.`
    case 'cross_family': {
      if (!def.requires) return def.desc ?? ''
      const parts = def.requires.map(r => {
        if (r.designId) return `"${r.designId}"`
        return `${r.count ?? 1}× ${r.series} design${(r.count ?? 1) > 1 ? 's' : ''}`
      })
      const tail = def.requireAdjacent ? ' — the two named designs must be adjacent.' : ' — all placed anywhere on the grid.'
      return `Place ${parts.join(', ')}${tail}`
    }
    case 'meta_synergy': {
      const names = (def.requires ?? []).map(id => SYNERGY_DEFS[id]?.name ?? id)
      return `Activate both ${names.join(' and ')} simultaneously.`
    }
    default:
      return def.desc ?? ''
  }
}

// ── Level display helpers ─────────────────────────────────────────────────────
const LEVEL_MULTS = [0, 1.0, 1.6, 2.2]
const LEVEL_DOTS  = ['', '●', '●●', '●●●']
const LEVEL_COLORS = ['', '#00d49a', '#1499cc', '#a066f0']

function levelLabel(level) {
  if (!level || level < 1) return null
  return { dots: LEVEL_DOTS[level], color: LEVEL_COLORS[level], label: `Lv.${level}` }
}

// ── Short bonus line ──────────────────────────────────────────────────────────
function bonusSummary(def, level = 1) {
  if (!def) return ''
  const mult = LEVEL_MULTS[level] ?? 1.0
  if (def.type === 'core_radius') {
    return `core +${Math.round(def.ownCore * mult * 100)}% · ring +${Math.round(def.ownSatellite * mult * 100)}%`
  }
  let s = `+${Math.round(def.own * mult * 100)}% output`
  if (def.radiation) s += ` · radiates +${Math.round(def.radiation.amount * mult * 100)}%`
  return s
}

// ── Reward display ────────────────────────────────────────────────────────────
function rewardLabel(reward) {
  if (!reward) return null
  if (reward.type === 'random_block') return '🎁 Grants a free random block on activation'
  if (reward.type === 'pixels')       return `✨ Grants +${reward.amount} pixels on activation`
  if (reward.type === 'gold')         return `💰 Grants +${reward.amount} gold on activation`
  return null
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ActiveEffectsPanel() {
  const { grid, addPixels, grantRandomBlock, totalPixelsProduced } = useGameStore()
  const { activeGridStyle, unlockedBlocks }   = useShopStore()
  const { addGold, discoverSynergy }           = useUserStore()
  const { unlockedDesigns }                   = useDesignUnlocks()
  const [openId, setOpenId] = useState(null)

  const { activeList } = useMemo(
    () => buildSynergyData(grid, activeGridStyle === 'neural'),
    [grid, activeGridStyle]
  )

  // ── Synergy activation → sound + reward ────────────────────────────────────
  const prevActiveIds = useRef(new Set())  // tracks last-seen active set (for sound)
  const rewardedIds   = useRef(new Set())  // tracks synergies that already paid out this level

  // Reset rewarded set when the level resets (totalPixelsProduced goes back to 0)
  useEffect(() => {
    if (totalPixelsProduced === 0) rewardedIds.current = new Set()
  }, [totalPixelsProduced])

  useEffect(() => {
    const nowActive = new Set(activeList.filter(s => s.active).map(s => s.id))
    for (const id of nowActive) {
      // Only fire sound + reward when newly activated at level 1 (not on level-up)
      if (!prevActiveIds.current.has(id)) {
        const def = SYNERGY_DEFS[id]
        playSynergyActivate(def?.type)
        // Auto-discover on first activation this session
        discoverSynergy(id)

        // Fire reward only once per level, even if the synergy cycles inactive→active
        if (!rewardedIds.current.has(id)) {
          rewardedIds.current.add(id)
          const reward = def?.reward
          if (reward) {
            if (reward.type === 'pixels' && reward.amount) {
              addPixels(reward.amount)
            } else if (reward.type === 'gold' && reward.amount) {
              addGold(reward.amount)
            } else if (reward.type === 'random_block') {
              const ids = unlockedDesigns.map(d => d.id)
              const typePool = getOwnedBlockTypes(unlockedDesigns, unlockedBlocks ?? [])
              grantRandomBlock(ids, typePool)
              playDesignUnlock()
            }
          }
        }
      }
    }
    prevActiveIds.current = nowActive
  }, [activeList]) // eslint-disable-line react-hooks/exhaustive-deps

  const relevant = activeList
    .filter(s => s.active || s.progress > 0)
    .sort((a, b) => {
      // Active synergies always rise above in-progress ones
      if (a.active !== b.active) return a.active ? -1 : 1
      // Among active: higher level rises higher (Lv.3 > Lv.2 > Lv.1)
      if (a.active) {
        const lvDiff = (b.level ?? 1) - (a.level ?? 1)
        if (lvDiff !== 0) return lvDiff
        // Same level: higher bonus value rises higher
        const defA = SYNERGY_DEFS[a.id]
        const defB = SYNERGY_DEFS[b.id]
        return (defB?.own ?? 0) - (defA?.own ?? 0)
      }
      // Inactive: higher progress fraction rises higher
      return (b.progress / b.required) - (a.progress / a.required)
    })

  if (relevant.length === 0) return (
    <div data-tutorial="active-effects" className="rounded-xl border px-3 py-2" style={{ background: '#0a0a20', borderColor: '#1e1e48' }}>
      <div className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: '#3c3c72' }}>Synergies</div>
      <div className="text-xs font-semibold" style={{ color: '#2e2e60' }}>Place designs to activate synergies</div>
    </div>
  )

  return (
    <div data-tutorial="active-effects" className="rounded-xl border overflow-hidden" style={{ background: '#0a0a20', borderColor: '#1e1e48' }}>
      <div className="px-3 py-2 border-b" style={{ borderColor: '#1e1e48' }}>
        <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#3c3c72' }}>Active Effects</div>
      </div>
      <div className="flex flex-col gap-0.5 p-1.5 max-h-72 overflow-y-auto">
        {relevant.map(s => {
          const def       = SYNERGY_DEFS[s.id]
          const pct       = Math.min(s.progress / s.required, 1)
          const isOpen    = openId === s.id
          const typeLabel = TYPE_LABELS[def?.type] ?? ''
          const typeColor = TYPE_COLORS[def?.type] ?? '#888'
          const lv        = levelLabel(s.level)
          const lvColor   = lv?.color ?? '#00d49a'

          return (
            <div key={s.id}>
              <button
                onClick={() => setOpenId(isOpen ? null : s.id)}
                className={`w-full rounded-lg px-2 py-1.5 text-left transition ${isOpen ? 'rounded-b-none border-b-0' : ''}`}
                style={{
                  background: s.active ? (s.level > 1 ? lvColor + '14' : '#34d39914') : '#0c0c2810',
                  border: `1px solid ${s.active ? (s.level > 1 ? lvColor + '44' : '#34d39944') : '#1e1e48'}`,
                  borderLeft: s.active ? `4px solid ${typeColor}` : `4px solid #1e1e48`,
                }}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-xs font-black truncate ${s.active ? 'text-pixel-green' : 'text-gray-400'}`}
                    style={s.active && s.level > 1 ? { color: lvColor } : undefined}
                  >
                    {s.active ? '✦ ' : ''}{s.name}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Level indicator */}
                    {s.active && lv && (
                      <span
                        className="text-[9px] font-black px-1 rounded"
                        style={{ color: lvColor, background: lvColor + '22', letterSpacing: 1 }}
                      >
                        {lv.dots}
                      </span>
                    )}
                    <span className={`text-[10px] font-bold ${s.active ? 'text-pixel-green/80' : 'text-gray-600'}`}>
                      {s.progress}/{s.required}
                    </span>
                    <span className={`text-[10px] font-black transition-transform ${isOpen ? 'rotate-180' : ''} ${s.active ? 'text-pixel-green/60' : 'text-gray-600'}`}>▼</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-1 h-0.5 rounded-full overflow-hidden" style={{ background: '#1e1e48' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct * 100}%`,
                      backgroundColor: s.active ? typeColor : '#2e2e60',
                      boxShadow: s.active ? `0 0 4px ${typeColor}` : 'none',
                    }}
                  />
                </div>

                {s.active && def && !isOpen && (
                  <div className="text-[10px] mt-0.5 font-semibold" style={{ color: lvColor + 'aa' }}>
                    {bonusSummary(def, s.level)}
                  </div>
                )}
              </button>

              {isOpen && (
                <div className={`px-2 py-2 rounded-b-lg border border-t-0 flex flex-col gap-1.5
                  ${s.active ? 'border-pixel-green/30 bg-pixel-green/5' : 'border-game-border bg-white/2'}`}
                  style={s.active && s.level > 1 ? { borderColor: lvColor + '44', background: lvColor + '08' } : undefined}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {typeLabel && (
                      <span
                        className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest"
                        style={{ background: typeColor + '22', color: typeColor, border: `1px solid ${typeColor}44` }}
                      >
                        {typeLabel}
                      </span>
                    )}
                    {s.active && lv && (
                      <span
                        className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest"
                        style={{ background: lvColor + '22', color: lvColor, border: `1px solid ${lvColor}44` }}
                      >
                        {lv.label} {lv.dots}
                      </span>
                    )}
                  </div>

                  {s.active && def && (
                    <div className="text-[10px] font-bold" style={{ color: lvColor }}>
                      {bonusSummary(def, s.level)}
                    </div>
                  )}

                  {/* Next level hint */}
                  {s.active && s.level < 3 && s.l2 && (
                    <div className="text-[9px] text-gray-600">
                      Lv.{s.level + 1} at {s.level === 1 ? s.l2 : s.l3} — {(s.level === 1 ? s.l2 : s.l3) - s.progress} more needed
                    </div>
                  )}

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black uppercase tracking-wide text-gray-600">How to activate</span>
                    <span className="text-[10px] text-gray-400 leading-snug">{synergySetupText(def)}</span>
                  </div>

                  {def?.reward && (
                    <div className="text-[10px] text-pixel-yellow font-bold leading-snug">
                      {rewardLabel(def.reward)}
                    </div>
                  )}

                  {!s.active && (
                    <div className="text-[10px] text-gray-700 font-semibold">
                      {s.required - s.progress} more needed
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
