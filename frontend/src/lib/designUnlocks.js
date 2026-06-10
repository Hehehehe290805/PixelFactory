// ── Design Unlock System ───────────────────────────────────────────────────────
// Replaces the old CAMPAIGN_PIXEL_UNLOCKS / CAMPAIGN_BLOCK_UNLOCKS system.
// Players unlock designs (not bare block types) through gameplay progression.

import { DESIGNS, getStarterDesigns, getCampaignChoiceDesigns } from '../data/designLibrary'
import { useUserStore }  from '../store/userStore'
import { useShopStore }  from '../store/shopStore'

// ── Starter designs (given at tutorial completion) ────────────────────────────
export function getStarterDesignIds() {
  return getStarterDesigns().map(d => d.id)
}

// ── Campaign choice pairs ─────────────────────────────────────────────────────
// Returns [designA_id, designB_id] for the choice offered at a given level.
// Choices are offered every 5 levels starting at level 5.
const CHOICE_PAIRS = (() => {
  const pool = getCampaignChoiceDesigns()
  const pairs = []
  for (let i = 0; i < pool.length - 1; i += 2) {
    pairs.push([pool[i].id, pool[i + 1].id])
  }
  return pairs
})()

export function getChoicePairForLevel(levelNumber) {
  if (levelNumber % 5 !== 0) return null
  const pairIndex = Math.floor(levelNumber / 5) - 1  // level 5 → index 0
  if (pairIndex < 0 || pairIndex >= CHOICE_PAIRS.length) return null
  return CHOICE_PAIRS[pairIndex]
}

// ── Shop block type gate ──────────────────────────────────────────────────────
// These block types are gated behind the permanent shop (the player must buy
// the "unlock" before shop designs of that type appear in the deck selector).
export const SHOP_GATED_BLOCK_TYPES = new Set([
  'overflow', 'mirror', 'catalyst', 'void',
])

// ── computeUnlockedDesigns ────────────────────────────────────────────────────
// Returns Set<designId> of all designs the player can currently use.
export function computeUnlockedDesigns({
  unlockedDesignIds = [],       // from userStore (DB-persisted)
  unlockedBlockTypes = [],      // from shopStore (shop purchases)
  endlessMinutes = 0,
  quizCorrect = 0,
}) {
  const unlocked = new Set(unlockedDesignIds)

  // Starters are always unlocked (no condition)
  for (const id of getStarterDesignIds()) unlocked.add(id)

  // Special designs earned by playing
  if (endlessMinutes >= 20) unlocked.add('rainbow_prism')
  if (quizCorrect >= 25)    unlocked.add('crystal_star')
  if (quizCorrect >= 50)    unlocked.add('nebula_design')

  // Shop-only designs: only unlocked if player bought them in the permanent shop
  // (they come in via unlockedDesignIds from userStore already)

  // Block-type gate: shop designs of gated types are only accessible if the
  // player has bought that block type unlock in the permanent shop
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

  const unlockedDesigns = DESIGNS.filter(d => unlockedSet.has(d.id))

  // Next unlock hint for Campaign page
  const nextChoiceAt = (() => {
    // Find the lowest level×5 milestone that would offer a new pair
    for (let level = 5; level <= 200; level += 5) {
      const pair = getChoicePairForLevel(level)
      if (!pair) continue
      if (!unlockedSet.has(pair[0]) && !unlockedSet.has(pair[1])) return level
    }
    return null
  })()

  return { isDesignUnlocked, unlockedDesigns, unlockedSet, nextChoiceAt }
}

// ── Design choice modal trigger ───────────────────────────────────────────────
// Returns the choice pair if a choice should be shown after completing this level.
// Returns null if no choice should be shown (pair already chosen or N/A).
export function shouldShowDesignChoice(levelNumber, unlockedDesignIds = []) {
  const pair = getChoicePairForLevel(levelNumber)
  if (!pair) return null
  // Show only if neither design in the pair is already unlocked
  const alreadyHaveA = unlockedDesignIds.includes(pair[0])
  const alreadyHaveB = unlockedDesignIds.includes(pair[1])
  if (alreadyHaveA && alreadyHaveB) return null
  if (alreadyHaveA) return null   // already picked A, skip
  if (alreadyHaveB) return null   // already picked B, skip
  return pair
}
