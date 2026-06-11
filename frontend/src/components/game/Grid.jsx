import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useGridCellSize } from '../../hooks/useGridCellSize'
import BlockSlot from './BlockSlot'
import Block from './Block'
import RadialWheel from './RadialWheel'
import { GRID_SIZE, TICK_MS, BLOCK_TYPE_VISUAL, BLOCK_TYPES } from '../../lib/constants'
import { DESIGNS } from '../../data/designLibrary'
import { SYNERGY_DEFS, getDesignSynergies } from '../../engine/designSynergies'
import { playBlockPlace } from '../../lib/audio'

const WAVE_DIRS = [
  { dir: 'up',         icon: '↑', label: 'Up' },
  { dir: 'up-right',   icon: '↗', label: 'UR' },
  { dir: 'right',      icon: '→', label: 'Right' },
  { dir: 'down-right', icon: '↘', label: 'DR' },
  { dir: 'down',       icon: '↓', label: 'Down' },
  { dir: 'down-left',  icon: '↙', label: 'DL' },
  { dir: 'left',       icon: '←', label: 'Left' },
  { dir: 'up-left',    icon: '↖', label: 'UL' },
]

export default function Grid() {
  const { grid, inventory, placeBlock, moveBlock, removeBlock, setWaveDir, sellBlock, blockRateMap, gamePaused, levelComplete, gameSpeed } = useGameStore()
  const [sellToast, setSellToast] = useState(null) // { refund, x, y }
  const cellSize = useGridCellSize()

  const [pulsingSlots, setPulsingSlots] = useState(new Set())
  const [wheel, setWheel]         = useState(null)
  const [movingBlock, setMoving]  = useState(null)
  const [synergyPanel, setSynergyPanel] = useState(null)
  // Hover overlay: shown after 1.5s of hovering an occupied cell
  const [hoverOverlay, setHoverOverlay] = useState(null) // { block, design, x, y }

  useEffect(() => {
    if (!synergyPanel) return
    function onKey(e) { if (e.key === 'Escape') setSynergyPanel(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [synergyPanel])

  // Production pulse tracker — clears when paused or level/wave is complete
  useEffect(() => {
    if (gamePaused || levelComplete) {
      setPulsingSlots(new Set())
      return
    }
    const interval = setInterval(() => {
      const active = new Set()
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const b = grid[r][c]
          if (b && b.pauseTimer === 0 && b.pixelCount > 0) active.add(`${r}-${c}`)
        }
      }
      setPulsingSlots(active)
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [grid, gamePaused, levelComplete])

  function handleCellClick(row, col, e) {
    const x = e.clientX
    const y = e.clientY

    if (movingBlock) {
      const dest = grid[row][col]
      if (!dest) {
        moveBlock(movingBlock.fromRow, movingBlock.fromCol, row, col)
        setMoving(null)
      } else if (movingBlock.fromRow === row && movingBlock.fromCol === col) {
        setMoving(null)
      }
      return
    }

    const hasBlock = !!grid[row][col]
    setWheel({ type: hasBlock ? 'occupied' : 'empty', row, col, x, y })
  }

  function dismiss() { setWheel(null); setHoverOverlay(null) }

  function buildItems() {
    if (!wheel) return []

    if (wheel.type === 'empty') {
      if (inventory.length === 0) return []
      const seen = new Set()
      const unique = inventory.filter(b => {
        if (seen.has(b.designId)) return false
        seen.add(b.designId)
        return true
      })
      return unique.slice(0, 9).map(block => ({
        content: <Block block={block} size={32} />,
        label: block.name ?? block.type.replace(/_/g, ' '),
        color: '#1499cc',
        onClick: () => {
          placeBlock(block.id, wheel.row, wheel.col)
          playBlockPlace()
          dismiss()
        },
      }))
    }

    if (wheel.type === 'occupied') {
      const occupant = grid[wheel.row]?.[wheel.col]
      if (!occupant) return []
      return [
        {
          icon: '↔',
          label: 'Move',
          color: '#1499cc',
          onClick: () => {
            setMoving({ blockId: occupant.id, fromRow: wheel.row, fromCol: wheel.col })
            dismiss()
          },
        },
        {
          icon: '〰',
          label: 'Wave',
          color: '#a066f0',
          onClick: () => {
            setWheel({ type: 'wave', row: wheel.row, col: wheel.col, x: wheel.x, y: wheel.y })
          },
        },
        {
          icon: '✦',
          label: 'Synergy',
          color: '#ffd166',
          onClick: () => {
            const design = DESIGNS.find(d => d.id === occupant.designId)
            setSynergyPanel({ block: occupant, design, x: wheel.x, y: wheel.y })
            dismiss()
          },
        },
        {
          icon: '💰',
          label: 'Sell',
          color: '#ffd166',
          onClick: () => {
            const refund = sellBlock(occupant.id)
            setSellToast({ refund, x: wheel.x, y: wheel.y })
            setTimeout(() => setSellToast(null), 1000)
            dismiss()
          },
        },
        {
          icon: '✕',
          label: 'Remove',
          color: '#f03e4e',
          onClick: () => {
            removeBlock(wheel.row, wheel.col)
            dismiss()
          },
        },
      ]
    }

    if (wheel.type === 'wave') {
      const occupant = grid[wheel.row]?.[wheel.col]
      if (!occupant) return []
      const cur = occupant.waveDir ?? 'up'
      return WAVE_DIRS.map(({ dir, icon, label }) => ({
        icon,
        label,
        color: dir === cur ? '#ffd166' : '#a066f0',
        onClick: () => {
          setWaveDir(occupant.id, dir)
          dismiss()
        },
      }))
    }

    return []
  }

  const items = buildItems()

  useEffect(() => {
    if (wheel && items.length === 0) dismiss()
  }, [wheel]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-1">
      <div
        className="border border-game-border rounded-lg overflow-hidden"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)` }}
      >
        {Array.from({ length: GRID_SIZE }, (_, r) =>
          Array.from({ length: GRID_SIZE }, (_, c) => (
            <BlockSlot
              key={`${r}-${c}`}
              row={r} col={c}
              block={grid[r][c]}
              cellSize={cellSize}
              selectedBlockId={null}
              onBlockSelect={null}
              pulsing={pulsingSlots.has(`${r}-${c}`)}
              onCellClick={handleCellClick}
              blockRate={blockRateMap?.[r]?.[c] ?? 0}
              gameSpeed={gameSpeed}
              onBlockHoverStart={(block, x, y) => {
                const design = DESIGNS.find(d => d.id === block.designId)
                setHoverOverlay({ block, design, x, y })
              }}
              onBlockHoverEnd={() => setHoverOverlay(null)}
              moveTarget={!!movingBlock && !grid[r][c]}
              moveSource={movingBlock?.fromRow === r && movingBlock?.fromCol === c}
            />
          ))
        )}
      </div>

      {movingBlock && (
        <p className="text-xs text-gray-600 text-center select-none">
          Click an empty cell to place · click the block to cancel
        </p>
      )}

      {wheel && items.length > 0 && (
        <RadialWheel x={wheel.x} y={wheel.y} items={items} onDismiss={dismiss} />
      )}

      {/* 1.5s hover overlay — block type + effect explanation */}
      {hoverOverlay && (() => {
        const { block, design, x, y } = hoverOverlay
        const typeColor = BLOCK_TYPE_VISUAL[block.type]?.color ?? '#5c7abf'
        const typeInfo  = BLOCK_TYPES[block.type]
        const panelW    = 192
        const margin    = 10
        const px = x + margin + panelW > window.innerWidth ? x - panelW - margin : x + margin
        const py = Math.min(y, window.innerHeight - 220)
        return (
          <div
            style={{
              position: 'fixed', left: px, top: py,
              width: panelW, zIndex: 57, pointerEvents: 'none',
              background: '#0d0d22',
              border: `2px solid ${typeColor}55`,
            }}
            className="rounded-xl p-3 flex flex-col gap-1.5"
          >
            {/* Design name */}
            <div className="text-sm font-black text-white leading-tight">{design?.name ?? '—'}</div>
            {/* Block type badge */}
            <div
              className="self-start text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest"
              style={{ background: typeColor + '22', color: typeColor, border: `1px solid ${typeColor}55` }}
            >
              {block.type.replace(/_/g, ' ')}
            </div>
            {/* Effect description */}
            {typeInfo?.desc && (
              <div className="text-[10px] text-gray-400 leading-snug">{typeInfo.desc}</div>
            )}
            {/* Active synergy */}
            {block.activeSynergy && (
              <div className="text-[10px] text-pixel-green font-bold border-t border-game-border pt-1">
                ✦ {SYNERGY_DEFS[block.activeSynergy]?.name ?? block.activeSynergy}
              </div>
            )}
          </div>
        )
      })()}

      {/* Sell toast — brief refund confirmation */}
      {sellToast && (
        <div
          style={{ position: 'fixed', left: sellToast.x + 12, top: sellToast.y - 28, zIndex: 60, pointerEvents: 'none' }}
          className="bg-pixel-yellow text-black text-xs font-black px-2 py-0.5 rounded-lg shadow-lg"
        >
          {sellToast.refund > 0 ? `+${sellToast.refund}px` : 'sold (0px)'}
        </div>
      )}

      {/* Synergy list panel — opened via radial wheel "Synergy" option */}
      {synergyPanel && (() => {
        const { block, design, x, y } = synergyPanel
        const panelW = 220
        const margin = 12
        const px = x + margin + panelW > window.innerWidth
          ? x - panelW - margin
          : x + margin
        const py = Math.min(y - 8, window.innerHeight - 400)
        const synergies = design ? getDesignSynergies(design) : []
        return (
          <>
            <div className="fixed inset-0 z-[55]" onClick={() => setSynergyPanel(null)} />
            <div
              style={{ position: 'fixed', left: px, top: py, width: panelW, zIndex: 56, background: '#0d0d22' }}
              className="rounded-xl border-2 border-pixel-yellow/40 p-3 flex flex-col gap-2"
            >
              {/* Block identity */}
              <div>
                <div className="text-sm font-black text-white">{design?.name ?? 'Block'}</div>
                <div className="text-xs text-pixel-blue capitalize">{block.type?.replace(/_/g, ' ')} · {design?.series}</div>
              </div>

              {/* Active synergy */}
              {block.activeSynergy && (
                <div className="text-xs font-black text-pixel-green border border-pixel-green/30 rounded-lg px-2 py-1">
                  ✦ {SYNERGY_DEFS[block.activeSynergy]?.name ?? block.activeSynergy} active
                </div>
              )}

              {/* All eligible synergies */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Eligible Synergies</div>
                {synergies.length === 0 ? (
                  <div className="text-[10px] text-gray-700">None found</div>
                ) : (
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                    {synergies.map(name => {
                      const def = Object.values(SYNERGY_DEFS).find(d => d.name === name)
                      const isActive = block.activeSynergy && SYNERGY_DEFS[block.activeSynergy]?.name === name
                      return (
                        <div
                          key={name}
                          className={`rounded-lg px-2 py-1 border ${isActive ? 'border-pixel-green/40 bg-pixel-green/5' : 'border-game-border'}`}
                        >
                          <div className={`text-[11px] font-black ${isActive ? 'text-pixel-green' : 'text-gray-300'}`}>
                            {isActive ? '✦ ' : ''}{name}
                          </div>
                          {def && (
                            <div className="text-[9px] text-gray-600 leading-snug mt-0.5">{def.desc}</div>
                          )}
                          {def?.reward && (
                            <div className="text-[9px] text-pixel-yellow font-bold mt-0.5">
                              🎁 {def.reward.type === 'random_block' ? 'Grants a free random block' : def.reward.type === 'pixels' ? `+${def.reward.amount} pixels` : `+${def.reward.amount} gold`}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="text-[10px] text-gray-700 border-t border-game-border pt-1">click outside to close</div>
            </div>
          </>
        )
      })()}
    </div>
  )
}
