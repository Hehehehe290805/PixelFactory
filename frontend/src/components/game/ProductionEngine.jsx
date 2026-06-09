import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import { computeTick } from '../../engine/productionEngine'
import { TICK_MS } from '../../lib/constants'

export default function ProductionEngine({ requiredOutput }) {
  const { grid, levelActive, levelComplete, addPixels, setPxPerSecond, tickCooldowns, completeLevel } = useGameStore()

  // Use refs to avoid stale closure in setInterval
  const gridRef = useRef(grid)
  const levelActiveRef = useRef(levelActive)
  const levelCompleteRef = useRef(levelComplete)
  const totalRef = useRef(0)

  useEffect(() => { gridRef.current = grid }, [grid])
  useEffect(() => { levelActiveRef.current = levelActive }, [levelActive])
  useEffect(() => { levelCompleteRef.current = levelComplete }, [levelComplete])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!levelActiveRef.current || levelCompleteRef.current) return

      tickCooldowns(TICK_MS)

      const { totalThisTick, totalPxPerSecond } = computeTick(gridRef.current)

      if (totalThisTick > 0) {
        addPixels(totalThisTick)
        totalRef.current += totalThisTick
        setPxPerSecond(totalPxPerSecond)

        if (totalRef.current >= requiredOutput) {
          completeLevel()
        }
      } else {
        setPxPerSecond(0)
      }
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [requiredOutput]) // only re-mount if requiredOutput changes

  // Sync totalRef to store on mount
  useEffect(() => {
    totalRef.current = 0
  }, [requiredOutput])

  return null
}
