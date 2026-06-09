import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import { useUserStore } from '../../store/userStore'
import { useShopStore } from '../../store/shopStore'
import { computeTick } from '../../engine/productionEngine'
import { buildDominanceMap } from '../../engine/dominanceChecker'
import { checkSetDiscovery, checkDominance, checkProduction, checkFullGrid } from '../../engine/achievementEngine'
import { TICK_MS } from '../../lib/constants'

export default function ProductionEngine({ requiredOutput }) {
  const {
    grid, levelActive, levelComplete,
    addPixels, setPxPerSecond, tickCooldowns, completeLevel, updateBlockSets,
    gameSpeed, gamePaused,
  } = useGameStore()

  const { achievements, discoveredSets, unlockAchievements, addDiscoveredSets, user } = useUserStore()
  const { activeGridStyle } = useShopStore()

  const gridRef          = useRef(grid)
  const levelActiveRef   = useRef(levelActive)
  const levelCompleteRef = useRef(levelComplete)
  const totalRef         = useRef(0)
  const requiredRef      = useRef(requiredOutput)
  const achievementsRef  = useRef(achievements)
  const discoveredRef    = useRef(discoveredSets)
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
  useEffect(() => { discoveredRef.current = discoveredSets },   [discoveredSets])
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

      const { totalThisTick, totalPxPerSec, setMap } = computeTick(gridRef.current, {
        activeGridStyle: gridStyleRef.current,
        gridTick: gridTickRef.current,
      })

      updateBlockSets(setMap)
      setPxPerSecond(totalPxPerSec * gameSpeedRef.current)

      const scaled = totalThisTick * gameSpeedRef.current
      if (scaled > 0) {
        addPixels(scaled)
        totalRef.current += scaled
        if (totalRef.current >= requiredRef.current) completeLevel()
      }

      // Achievements only fire when the user is logged in
      if (!userRef.current) return

      // Set discovery achievements
      const activeSets = new Set()
      for (const row of setMap) for (const s of row) { if (s) activeSets.add(s) }
      if (activeSets.size > 0) {
        const setKeys = checkSetDiscovery({ newSets: activeSets, discoveredSets: discoveredRef.current, unlockedKeys: achievementsRef.current })
        if (setKeys.length) unlockAchievements(setKeys)
        addDiscoveredSets(activeSets)
      }

      const domMap  = buildDominanceMap(gridRef.current)
      const domKeys = checkDominance({ dominanceMapSize: domMap.size, unlockedKeys: achievementsRef.current })
      if (domKeys.length) unlockAchievements(domKeys)

      const prodKeys = checkProduction({ totalPixelsProduced: totalRef.current, currentPxPerSecond: totalPxPerSec, unlockedKeys: achievementsRef.current })
      if (prodKeys.length) unlockAchievements(prodKeys)

      const gridKeys = checkFullGrid({ grid: gridRef.current, unlockedKeys: achievementsRef.current })
      if (gridKeys.length) unlockAchievements(gridKeys)

    }, TICK_MS)

    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
