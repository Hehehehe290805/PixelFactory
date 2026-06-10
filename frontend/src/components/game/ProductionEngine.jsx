import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useUserStore } from '../../store/userStore'
import { useShopStore } from '../../store/shopStore'
import { computeTick } from '../../engine/productionEngine'
import { checkProduction, checkFullGrid } from '../../engine/achievementEngine'
import { TICK_MS } from '../../lib/constants'

export default function ProductionEngine({ requiredOutput }) {
  const {
    grid, levelActive, levelComplete,
    addPixels, setPxPerSecond, tickCooldowns, completeLevel, updateBlockSynergies,
    gameSpeed, gamePaused,
  } = useGameStore()

  const { achievements, unlockAchievements, user } = useUserStore()
  const { activeGridStyle } = useShopStore()

  const gridRef          = useRef(grid)
  const levelActiveRef   = useRef(levelActive)
  const levelCompleteRef = useRef(levelComplete)
  const totalRef         = useRef(0)
  const requiredRef      = useRef(requiredOutput)
  const achievementsRef  = useRef(achievements)
  const gridStyleRef     = useRef(activeGridStyle)
  const gridTickRef      = useRef(0)
  const gameSpeedRef     = useRef(gameSpeed)
  const gamePausedRef    = useRef(gamePaused)
  const userRef          = useRef(user)

  useEffect(() => { gridRef.current = grid },                  [grid])
  useEffect(() => { levelActiveRef.current = levelActive },    [levelActive])
  useEffect(() => { levelCompleteRef.current = levelComplete }, [levelComplete])
  useEffect(() => { requiredRef.current = requiredOutput },     [requiredOutput])
  useEffect(() => { achievementsRef.current = achievements },   [achievements])
  useEffect(() => { gridStyleRef.current = activeGridStyle },   [activeGridStyle])
  useEffect(() => { gameSpeedRef.current = gameSpeed },         [gameSpeed])
  useEffect(() => { gamePausedRef.current = gamePaused },       [gamePaused])
  useEffect(() => { userRef.current = user },                   [user])
  useEffect(() => { totalRef.current = 0; gridTickRef.current = 0 }, [requiredOutput])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!levelActiveRef.current || levelCompleteRef.current) return
      if (gamePausedRef.current) return

      tickCooldowns(TICK_MS)
      gridTickRef.current++

      const { totalThisTick, totalPxPerSec, synergyMap } = computeTick(gridRef.current, {
        activeGridStyle: gridStyleRef.current,
        gridTick: gridTickRef.current,
      })

      updateBlockSynergies(synergyMap)
      setPxPerSecond(totalPxPerSec * gameSpeedRef.current)

      const scaled = totalThisTick * gameSpeedRef.current
      if (scaled > 0) {
        addPixels(scaled)
        totalRef.current += scaled
        if (totalRef.current >= requiredRef.current) completeLevel()
      }

      // Achievements only fire when user is logged in
      if (!userRef.current) return

      const prodKeys = checkProduction({ totalPixelsProduced: totalRef.current, currentPxPerSecond: totalPxPerSec, unlockedKeys: achievementsRef.current })
      if (prodKeys.length) unlockAchievements(prodKeys)

      const gridKeys = checkFullGrid({ grid: gridRef.current, unlockedKeys: achievementsRef.current })
      if (gridKeys.length) unlockAchievements(gridKeys)

    }, TICK_MS)

    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
