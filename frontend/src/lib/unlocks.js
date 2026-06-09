// Campaign-based unlock milestones.
// Completing a level (any stars) unlocks listed blocks and pixel colors.
// Shop-only items (overflow, mirror, catalyst, void; rainbow, silver, gold, neon)
// are NEVER unlocked through campaign — only via the Shop.

export const CAMPAIGN_PIXEL_UNLOCKS = {
  1:  ['red', 'blue'],            // tutorial completion
  2:  ['orange', 'yellow'],
  3:  ['green'],
  5:  ['violet'],
}

export const CAMPAIGN_BLOCK_UNLOCKS = {
  1:  ['base'],
  3:  ['doubler'],
  4:  ['cross_amp'],
  5:  ['color_checker'],
  6:  ['greedy'],
  8:  ['amplifier'],
  10: ['resonator', 'reactor'],
  15: ['echo', 'prism'],
  20: ['conductor', 'splitter'],
  25: ['focus', 'cluster'],
  30: ['forge'],
}

// Blocks and pixels unlockable ONLY via Shop (never campaign)
export const SHOP_ONLY_BLOCKS  = new Set(['overflow', 'mirror', 'catalyst', 'void'])
export const SHOP_ONLY_PIXELS  = new Set(['rainbow', 'silver', 'gold', 'neon'])

// Always available (no unlock needed)
const BASE_PIXELS = new Set(['white'])
const BASE_BLOCKS = new Set(['base'])

/**
 * Given the player's campaign progress map and shop unlock arrays,
 * returns two Sets of unlocked pixel keys and block keys.
 */
export function computeUnlocks(campaignProgress, shopPixels = [], shopBlocks = []) {
  const highestCompleted = Object.entries(campaignProgress)
    .filter(([, p]) => (p?.stars ?? 0) > 0)
    .reduce((max, [n]) => Math.max(max, parseInt(n)), 0)

  const pixels = new Set(BASE_PIXELS)
  const blocks = new Set(BASE_BLOCKS)

  // Campaign milestones
  for (const [lvl, pxs] of Object.entries(CAMPAIGN_PIXEL_UNLOCKS)) {
    if (highestCompleted >= parseInt(lvl)) pxs.forEach(p => pixels.add(p))
  }
  for (const [lvl, bks] of Object.entries(CAMPAIGN_BLOCK_UNLOCKS)) {
    if (highestCompleted >= parseInt(lvl)) bks.forEach(b => blocks.add(b))
  }

  // Shop unlocks (these layer on top — shop items are additive)
  shopPixels.forEach(p => pixels.add(p))
  shopBlocks.forEach(b => blocks.add(b))

  return { pixels, blocks }
}

// React hook: returns convenience helpers using live store state
import { useUserStore }  from '../store/userStore'
import { useShopStore }  from '../store/shopStore'

export function useUnlocks() {
  const { campaignProgress } = useUserStore()
  const { unlockedPixels, unlockedBlocks } = useShopStore()

  const { pixels, blocks } = computeUnlocks(campaignProgress, unlockedPixels, unlockedBlocks)

  return {
    isPixelUnlocked: (key) => {
      if (SHOP_ONLY_PIXELS.has(key)) return unlockedPixels.includes(key)
      return pixels.has(key)
    },
    isBlockUnlocked: (key) => {
      if (SHOP_ONLY_BLOCKS.has(key)) return unlockedBlocks.includes(key)
      return blocks.has(key)
    },
    unlockedPixels: pixels,
    unlockedBlocks: blocks,
  }
}

/** The next unlock milestone the player should aim for */
export function nextUnlockHint(campaignProgress) {
  const highest = Object.entries(campaignProgress)
    .filter(([, p]) => (p?.stars ?? 0) > 0)
    .reduce((max, [n]) => Math.max(max, parseInt(n)), 0)

  const allMilestones = [
    ...Object.entries(CAMPAIGN_PIXEL_UNLOCKS).map(([lvl, items]) => ({ lvl: parseInt(lvl), items, type: 'pixel' })),
    ...Object.entries(CAMPAIGN_BLOCK_UNLOCKS).map(([lvl, items]) => ({ lvl: parseInt(lvl), items, type: 'block' })),
  ].sort((a, b) => a.lvl - b.lvl)

  return allMilestones.find(m => m.lvl > highest) ?? null
}
