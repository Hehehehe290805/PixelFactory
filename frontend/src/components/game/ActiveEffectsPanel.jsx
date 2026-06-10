import { useMemo } from 'react'
import { buildSynergyData, SYNERGY_DEFS } from '../../engine/designSynergies'
import { useGameStore } from '../../store/gameStore'
import { useShopStore } from '../../store/shopStore'

export default function ActiveEffectsPanel() {
  const { grid } = useGameStore()
  const { activeGridStyle } = useShopStore()

  const { activeList } = useMemo(
    () => buildSynergyData(grid, activeGridStyle === 'neural'),
    [grid, activeGridStyle]
  )

  // Only show synergies that are either active or making visible progress (progress > 0)
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
          return (
            <div
              key={s.id}
              title={s.desc}
              className={`rounded-lg px-2 py-1.5 transition ${s.active ? 'bg-pixel-green/10 border border-pixel-green/30' : 'bg-white/3 border border-game-border'}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`text-xs font-black truncate ${s.active ? 'text-pixel-green' : 'text-gray-400'}`}>
                  {s.active ? '✦ ' : ''}{s.name}
                </span>
                <span className={`text-[10px] font-bold flex-shrink-0 ${s.active ? 'text-pixel-green/80' : 'text-gray-600'}`}>
                  {s.progress}/{s.required}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-1 h-0.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${s.active ? 'bg-pixel-green' : 'bg-gray-600'}`}
                  style={{ width: `${pct * 100}%` }}
                />
              </div>

              {/* Active bonus text */}
              {s.active && def && (
                <div className="text-[10px] text-pixel-green/60 mt-0.5 font-semibold">
                  +{Math.round(def.own * 100)}% output
                  {def.radiation && ` · radiates +${Math.round(def.radiation.amount * 100)}%`}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
