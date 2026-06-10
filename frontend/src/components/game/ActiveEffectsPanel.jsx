import { useMemo, useState, useEffect, useRef } from 'react'
import { buildSynergyData, SYNERGY_DEFS } from '../../engine/designSynergies'
import { useGameStore } from '../../store/gameStore'
import { useShopStore } from '../../store/shopStore'
import { playSynergyActivate } from '../../lib/audio'

// Human-readable type labels for the badge shown in the dropdown
const TYPE_LABELS = {
  series_count:     'ANY POSITION',
  exact_count:      'DUPLICATES',
  adjacency_pair:   'ADJACENT',
  row_series:       'SAME ROW',
  long_range:       'LONG RANGE',
  core_radius:      'RADIUS',
  block_type_count: 'BLOCK TYPE',
}

const TYPE_COLORS = {
  series_count:     '#1499cc',
  exact_count:      '#ffd166',
  adjacency_pair:   '#f03e4e',
  row_series:       '#a066f0',
  long_range:       '#00d49a',
  core_radius:      '#ff9f43',
  block_type_count: '#54a0ff',
}

// Actionable "how to set this up" text shown in the dropdown
function synergySetupText(def) {
  if (!def) return ''
  switch (def.type) {
    case 'series_count':
      return `Place ${def.required} ${def.series} designs anywhere on the grid.`
    case 'exact_count':
      return `Place ${def.required} copies of the same design anywhere on the grid.`
    case 'adjacency_pair': {
      const aLabel = def.designA ? `"${def.designA}"` : `any ${def.seriesA} design`
      const bLabel = def.designB ? `"${def.designB}"` : `any ${def.seriesB} design`
      return `Place ${aLabel} directly next to ${bLabel} (must touch on a side — not diagonal).`
    }
    case 'row_series':
      return `Place ${def.required} ${def.series} designs in the same horizontal row.`
    case 'long_range': {
      const dist = def.minDist
      if (def.series) {
        return `Place 2 ${def.series} designs at least ${dist} cells apart (Manhattan distance). Spread them across the grid.`
      }
      const aLabel = def.designA ? `"${def.designA}"` : `a ${def.seriesA} design`
      const bLabel = def.designB ? `"${def.designB}"` : `a ${def.seriesB} design`
      return `Place ${aLabel} and ${bLabel} at least ${dist} cells apart. The farther they are, the better.`
    }
    case 'core_radius': {
      const coreLabel = def.coreDesignId ? `"${def.coreDesignId}"` : `a ${def.coreSeries} design`
      const satLabel  = def.satelliteSeries ?? 'matching'
      return `Place ${coreLabel} anywhere as the core. Then place ${def.requiredSatellites}+ ${satLabel} designs within ${def.radius} cells of it (Manhattan distance).`
    }
    case 'block_type_count':
      return `Place ${def.required} blocks that use the "${def.blockType}" effect anywhere on the grid. Any series works.`
    default:
      return def.desc ?? ''
  }
}

// Short bonus summary for collapsed row
function bonusSummary(def) {
  if (!def) return ''
  if (def.type === 'core_radius') {
    return `core +${Math.round(def.ownCore * 100)}% · ring +${Math.round(def.ownSatellite * 100)}%`
  }
  let s = `+${Math.round(def.own * 100)}% output`
  if (def.radiation) s += ` · radiates +${Math.round(def.radiation.amount * 100)}%`
  return s
}

export default function ActiveEffectsPanel() {
  const { grid } = useGameStore()
  const { activeGridStyle } = useShopStore()
  const [openId, setOpenId] = useState(null)

  const { activeList } = useMemo(
    () => buildSynergyData(grid, activeGridStyle === 'neural'),
    [grid, activeGridStyle]
  )

  // Fire a sound whenever a synergy transitions from inactive → active
  const prevActiveIds = useRef(new Set())
  useEffect(() => {
    const nowActive = new Set(activeList.filter(s => s.active).map(s => s.id))
    for (const id of nowActive) {
      if (!prevActiveIds.current.has(id)) {
        const def = SYNERGY_DEFS[id]
        playSynergyActivate(def?.type)
      }
    }
    prevActiveIds.current = nowActive
  }, [activeList])

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
          const def    = SYNERGY_DEFS[s.id]
          const pct    = Math.min(s.progress / s.required, 1)
          const isOpen = openId === s.id
          const typeLabel = TYPE_LABELS[def?.type] ?? ''
          const typeColor = TYPE_COLORS[def?.type] ?? '#888'

          return (
            <div key={s.id}>
              {/* Clickable header row */}
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
                    <span className={`text-[10px] font-black transition-transform ${isOpen ? 'rotate-180' : ''} ${s.active ? 'text-pixel-green/60' : 'text-gray-600'}`}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-1 h-0.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${s.active ? 'bg-pixel-green' : 'bg-gray-600'}`}
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>

                {/* Active bonus — shown when collapsed */}
                {s.active && def && !isOpen && (
                  <div className="text-[10px] text-pixel-green/60 mt-0.5 font-semibold">
                    {bonusSummary(def)}
                  </div>
                )}
              </button>

              {/* Dropdown detail */}
              {isOpen && (
                <div
                  className={`px-2 py-2 rounded-b-lg border border-t-0 flex flex-col gap-1.5
                    ${s.active ? 'border-pixel-green/30 bg-pixel-green/5' : 'border-game-border bg-white/2'}`}
                >
                  {/* Type badge */}
                  {typeLabel && (
                    <span
                      className="self-start text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest"
                      style={{ background: typeColor + '22', color: typeColor, border: `1px solid ${typeColor}44` }}
                    >
                      {typeLabel}
                    </span>
                  )}

                  {/* Active bonus */}
                  {s.active && def && (
                    <div className="text-[10px] text-pixel-green font-bold">
                      {bonusSummary(def)}
                    </div>
                  )}

                  {/* How to set it up */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black uppercase tracking-wide text-gray-600">How to activate</span>
                    <span className="text-[10px] text-gray-400 leading-snug">
                      {synergySetupText(def)}
                    </span>
                  </div>

                  {/* Still-needed counter */}
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
