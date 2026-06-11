// ── Design Unlock System ───────────────────────────────────────────────────────

import { DESIGNS, getStarterDesigns, getFamilyChoiceForLevel, getFamilyPackDesigns } from '../data/designLibrary'
import { useUserStore }  from '../store/userStore'
import { useShopStore }  from '../store/shopStore'

// ── Starter designs (given at tutorial completion) ────────────────────────────
export function getStarterDesignIds() {
  return getStarterDesigns().map(d => d.id)
}

// ── Shop block type gate ──────────────────────────────────────────────────────
export const SHOP_GATED_BLOCK_TYPES = new Set([
  'overflow', 'mirror', 'catalyst', 'void',
])

// ── computeUnlockedDesigns ────────────────────────────────────────────────────
export function computeUnlockedDesigns({
  unlockedDesignIds = [],
  unlockedBlockTypes = [],
  endlessMinutes = 0,
  quizCorrect = 0,
}) {
  const unlocked = new Set(unlockedDesignIds)

  for (const id of getStarterDesignIds()) unlocked.add(id)

  if (endlessMinutes >= 20) unlocked.add('rainbow_prism')
  if (quizCorrect >= 25)    unlocked.add('crystal_star')
  if (quizCorrect >= 50)    unlocked.add('nebula_design')

  const lockedShopDesigns = DESIGNS.filter(d => {
    if (d.unlockSource !== 'shop') return false
    if (SHOP_GATED_BLOCK_TYPES.has(d.blockType)) {
      return !unlockedBlockTypes.includes(d.blockType)
    }
    return false
  }).map(d => d.id)

  for (const id of lockedShopDesigns) unlocked.delete(id)

  return unlocked
}

// ── React hook ────────────────────────────────────────────────────────────────
export function useDesignUnlocks() {
  const { unlockedDesigns: unlockedDesignIds = [], endlessMinutes = 0, quizStats } = useUserStore()
  const { unlockedBlocks: unlockedBlockTypes = [] } = useShopStore()

  const quizCorrect = quizStats?.correct ?? 0

  const unlockedSet = computeUnlockedDesigns({
    unlockedDesignIds,
    unlockedBlockTypes,
    endlessMinutes,
    quizCorrect,
  })

  const isDesignUnlocked = (id) => unlockedSet.has(id)
  const unlockedDesigns  = DESIGNS.filter(d => unlockedSet.has(d.id))

  // Next family choice hint for Campaign page
  const nextChoiceAt = (() => {
    for (let level = 10; level <= 200; level += 5) {
      const entry = getFamilyChoiceForLevel(level)
      if (!entry) continue
      // Show if the player doesn't yet have any designs from BOTH offered families
      const hasA = entry.options[0] && getFamilyPackDesigns(entry.options[0]).some(d => unlockedSet.has(d.id))
      const hasB = entry.options[1] && getFamilyPackDesigns(entry.options[1]).some(d => unlockedSet.has(d.id))
      if (!hasA && !hasB) return level
    }
    return null
  })()

  return { isDesignUnlocked, unlockedDesigns, unlockedSet, nextChoiceAt }
}

// ── Family choice modal trigger ───────────────────────────────────────────────
// Returns the family choice entry if a choice should be shown after completing this level.
// Returns null if no choice for this level, or player already picked one of the families.
export function shouldShowFamilyChoice(levelNumber, unlockedDesignIds = []) {
  const entry = getFamilyChoiceForLevel(levelNumber)
  if (!entry) return null

  const unlockedSet = new Set(unlockedDesignIds)
  // Skip if player already has designs from either offered family
  const hasA = entry.options[0] && getFamilyPackDesigns(entry.options[0]).some(d => unlockedSet.has(d.id))
  const hasB = entry.options[1] && getFamilyPackDesigns(entry.options[1]).some(d => unlockedSet.has(d.id))
  if (hasA || hasB) return null

  return entry  // { level, options: ['series_a', 'series_b'] }
}
