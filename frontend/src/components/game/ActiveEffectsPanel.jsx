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
  series_count:     'ANY POSITION',
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

// ── Short bonus line ──────────────────────────────────────────────────────────
function bonusSummary(def) {
  if (!def) return ''
  if (def.type === 'core_radius') {
    return `core +${Math.round(def.ownCore * 100)}% · ring +${Math.round(def.ownSatellite * 100)}%`
  }
  let s = `+${Math.round(def.own * 100)}% output`
  if (def.radiation) s += ` · radiates +${Math.round(def.radiation.amount * 100)}%`
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
  const { grid, addPixels, grantRandomBlock } = useGameStore()
  const { activeGridStyle, unlockedBlocks }   = useShopStore()
  const { addGold }                           = useUserStore()
  const { unlockedDesigns }                   = useDesignUnlocks()
  const [openId, setOpenId] = useState(null)

  const { activeList } = useMemo(
    () => buildSynergyData(grid, activeGridStyle === 'neural'),
    [grid, activeGridStyle]
  )

  // ── Synergy activation → sound + reward ────────────────────────────────────
  const prevActiveIds = useRef(new Set())
  useEffect(() => {
    const nowActive = new Set(activeList.filter(s => s.active).map(s => s.id))
    for (const id of nowActive) {
      if (!prevActiveIds.current.has(id)) {
        const def = SYNERGY_DEFS[id]
        playSynergyActivate(def?.type)

        // Dispatch reward (fire-once per activation)
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
    prevActiveIds.current = nowActive
  }, [activeList]) // eslint-disable-line react-hooks/exhaustive-deps

  const relevant = activeList.filter(s => s.active || s.progress > 0)

  if (relevant.length === 0) return (
    <div data-tutorial="active-effects" className="rounded-xl border-2 border-game-border px-3 py-2" style={{ background: '#0a0a1a' }}>
      <div className="text-xs font-black uppercase tracking-widest text-gray-600 mb-1">Synergies</div>
      <div className="text-xs text-gray-700 font-semibold">Place designs to activate synergies</div>
    </div>
  )

  return (
    <div data-tutorial="active-effects" className="rounded-xl border-2 border-game-border overflow-hidden" style={{ background: '#0a0a1a' }}>
      <div className="px-3 py-2 border-b border-game-border">
        <div className="text-xs font-black uppercase tracking-widest text-gray-500">Active Effects</div>
      </div>
      <div className="flex flex-col gap-0.5 p-1.5 max-h-72 overflow-y-auto">
        {relevant.map(s => {
          const def       = SYNERGY_DEFS[s.id]
          const pct       = Math.min(s.progress / s.required, 1)
          const isOpen    = openId === s.id
          const typeLabel = TYPE_LABELS[def?.type] ?? ''
          const typeColor = TYPE_COLORS[def?.type] ?? '#888'

          return (
            <div key={s.id}>
              <button
                onClick={() => setOpenId(isOpen ? null : s.id)}
                className={`w-full rounded-lg px-2 py-1.5 text-left transition
                  ${s.active ? 'bg-pixel-green/10 border border-pixel-green/30' : 'bg-white/3 border border-game-border'}
                  ${isOpen ? 'rounded-b-none border-b-0' : ''}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-xs font-black truncate ${s.active ? 'text-pixel-green' : 'text-gray-400'}`}>
                    {s.active ? '✦ ' : ''}{s.name}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-[10px] font-bold ${s.active ? 'text-pixel-green/80' : 'text-gray-600'}`}>
                      {s.progress}/{s.required}
                    </span>
                    <span className={`text-[10px] font-black transition-transform ${isOpen ? 'rotate-180' : ''} ${s.active ? 'text-pixel-green/60' : 'text-gray-600'}`}>▼</span>
                  </div>
                </div>

                <div className="mt-1 h-0.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${s.active ? 'bg-pixel-green' : 'bg-gray-600'}`}
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>

                {s.active && def && !isOpen && (
                  <div className="text-[10px] text-pixel-green/60 mt-0.5 font-semibold">
                    {bonusSummary(def)}
                  </div>
                )}
              </button>

              {isOpen && (
                <div className={`px-2 py-2 rounded-b-lg border border-t-0 flex flex-col gap-1.5
                  ${s.active ? 'border-pixel-green/30 bg-pixel-green/5' : 'border-game-border bg-white/2'}`}
                >
                  {typeLabel && (
                    <span
                      className="self-start text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest"
                      style={{ background: typeColor + '22', color: typeColor, border: `1px solid ${typeColor}44` }}
                    >
                      {typeLabel}
                    </span>
                  )}

                  {s.active && def && (
                    <div className="text-[10px] text-pixel-green font-bold">{bonusSummary(def)}</div>
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
