import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { DESIGNS, ALL_SERIES } from '../data/designLibrary'
import { useDesignUnlocks } from '../lib/designUnlocks'
import { DesignMiniThumb, DesignTooltipBody } from '../components/ui/DeckSelector'

const COLOR_HEX = {
  red:'#f03e4e', orange:'#f59342', yellow:'#ffd166', green:'#00d49a',
  blue:'#1499cc', violet:'#a066f0', white:'#f0f0fa', silver:'#9db4cc',
  gold:'#ffc000', neon:'#39ff14', rainbow:'#ff6b9d',
}

export default function Profile() {
  const { user } = useUserStore()
  const { isDesignUnlocked, unlockedDesigns } = useDesignUnlocks()
  const [seriesFilter, setSeriesFilter] = useState('all')
  const [hoveredId, setHoveredId]       = useState(null)
  const [mousePos, setMousePos]         = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }, [])

  const filtered = seriesFilter === 'all'
    ? DESIGNS
    : DESIGNS.filter(d => d.series === seriesFilter)

  const hoveredDesign = hoveredId ? DESIGNS.find(d => d.id === hoveredId) : null
  const unlockedCount = unlockedDesigns.length

  if (!user) {
    return (
      <div className="min-h-screen bg-game-bg flex items-center justify-center">
        <div className="card text-center max-w-sm mx-4" style={{ padding: '2rem' }}>
          <div className="text-2xl font-black text-white mb-3 pixel-heading">Design Collection</div>
          <p className="text-gray-500 text-sm mb-6">Log in to track your unlocked designs across sessions.</p>
          <Link to="/" className="btn btn-primary text-base">← Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-game-bg px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="btn btn-secondary text-sm px-4 py-2">← Back</Link>
            <div>
              <h1 className="text-3xl font-black text-white pixel-heading">Collection</h1>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">
                {unlockedCount} / {DESIGNS.length} designs unlocked
              </p>
            </div>
          </div>
          <div className="card-sm px-4 py-2 text-right">
            <div className="text-xl font-black text-white">{unlockedCount}</div>
            <div className="text-xs text-gray-600 uppercase font-bold">unlocked</div>
          </div>
        </div>

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
            return (
              <div
                key={design.id}
                onMouseEnter={() => setHoveredId(design.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`rounded-xl border-2 flex flex-col items-center p-1.5 gap-1 transition cursor-default
                  ${hoveredId === design.id
                    ? 'border-pixel-blue bg-pixel-blue/5'
                    : unlocked ? 'border-pixel-green/30 bg-pixel-green/5' : 'border-game-border'}`}
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

        {/* Hover tooltip — fixed, follows cursor, never affects layout */}
        {hoveredDesign && (() => {
          const tipW = 176
          const margin = 16
          const x = mousePos.x + margin + tipW > window.innerWidth
            ? mousePos.x - tipW - margin
            : mousePos.x + margin
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
                    {hoveredDesign.unlockSource === 'starter'         ? 'Complete the tutorial' :
                     hoveredDesign.unlockSource === 'campaign_choice'  ? 'Earn by completing campaign levels' :
                     hoveredDesign.unlockSource === 'shop'            ? 'Available in the Shop' :
                     hoveredDesign.unlockSource === 'endless_20min'   ? 'Survive 20 min in Endless' :
                     hoveredDesign.unlockSource === 'quiz_25'         ? 'Answer 25 quiz questions correctly' :
                     hoveredDesign.unlockSource === 'quiz_50'         ? 'Answer 50 quiz questions correctly' :
                     'Special unlock'}
                  </div>
                </>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
