import { useMemo, useState } from 'react'
import { buildSynergyData, SYNERGY_DEFS } from '../../engine/designSynergies'
import { useGameStore } from '../../store/gameStore'
import { useShopStore } from '../../store/shopStore'

function synergyRequirementText(def) {
  if (!def) return ''
  switch (def.type) {
    case 'series_count':
      return `${def.required} ${def.series} designs anywhere on the grid`
    case 'exact_count':
      return `${def.required} copies of the same design on the grid`
    case 'adjacency_pair': {
      const aLabel = def.designA ?? def.seriesA
      const bLabel = def.designB ?? def.seriesB
      return `any ${aLabel} placed adjacent to any ${bLabel}`
    }
    case 'row_series':
      return `${def.required} ${def.series} designs in the same row`
    default:
      return def.desc ?? ''
  }
}

export default function ActiveEffectsPanel() {
  const { grid } = useGameStore()
  const { activeGridStyle } = useShopStore()
  const [openId, setOpenId] = useState(null)

  const { activeList } = useMemo(
    () => buildSynergyData(grid, activeGridStyle === 'neural'),
    [grid, activeGridStyle]
  )

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
          const def = SYNERGY_DEFS[s.id]
          const pct = Math.min(s.progress / s.required, 1)
          const isOpen = openId === s.id

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

                {/* Active bonus — shown when not expanded */}
                {s.active && def && !isOpen && (
                  <div className="text-[10px] text-pixel-green/60 mt-0.5 font-semibold">
                    +{Math.round(def.own * 100)}% output
                    {def.radiation && ` · radiates +${Math.round(def.radiation.amount * 100)}%`}
                  </div>
                )}
              </button>

              {/* Dropdown detail */}
              {isOpen && (
                <div
                  className={`px-2 py-2 rounded-b-lg border border-t-0 flex flex-col gap-1
                    ${s.active ? 'border-pixel-green/30 bg-pixel-green/5' : 'border-game-border bg-white/2'}`}
                >
                  {s.active && def && (
                    <div className="text-[10px] text-pixel-green font-bold">
                      +{Math.round(def.own * 100)}% output
                      {def.radiation && ` · radiates +${Math.round(def.radiation.amount * 100)}%`}
                    </div>
                  )}
                  <div className="text-[10px] text-gray-500 leading-snug">
                    <span className="text-gray-600 font-bold uppercase tracking-wide">Requires: </span>
                    {synergyRequirementText(def)}
                  </div>
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
