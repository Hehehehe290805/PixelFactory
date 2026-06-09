export const ACHIEVEMENTS = {
  // ── Progression ──────────────────────────────────────────
  first_level:        { name: 'Factory Floor',      desc: 'Complete Level 1',                        category: 'progress' },
  level_25:           { name: 'Getting Serious',    desc: 'Complete Level 25',                       category: 'progress' },
  level_50:           { name: 'Halfway There',      desc: 'Complete Level 50',                       category: 'progress' },
  level_100:          { name: 'Century Run',        desc: 'Complete Level 100',                      category: 'progress' },
  level_150:          { name: 'Deep Factory',       desc: 'Complete Level 150',                      category: 'progress' },
  level_200:          { name: 'Grand Master',       desc: 'Complete all 200 levels',                 category: 'progress' },

  // ── Stars ─────────────────────────────────────────────────
  three_star_any:     { name: 'Perfectionist',      desc: 'Get 3 stars on any level',                category: 'stars'    },
  three_star_10:      { name: 'Flawless Ten',       desc: 'Get 3 stars on the first 10 levels',      category: 'stars'    },
  three_star_50:      { name: 'Stellar Run',        desc: 'Get 3 stars on 50 levels',                category: 'stars'    },
  three_star_all:     { name: 'Pixel Perfect',      desc: 'Get 3 stars on all 200 levels',           category: 'stars'    },

  // ── Sets ──────────────────────────────────────────────────
  discover_midnight:  { name: 'Night Shift',        desc: 'Discover the MIDNIGHT set in-level',      category: 'sets'     },
  discover_primary:   { name: 'Color Theory',       desc: 'Discover the PRIMARY set in-level',       category: 'sets'     },
  discover_grass:     { name: 'Green Thumb',        desc: 'Discover the GRASS set in-level',         category: 'sets'     },
  discover_sunset:    { name: 'Golden Hour',        desc: 'Discover the SUNSET set in-level',        category: 'sets'     },
  discover_phils:     { name: 'Archipelago',        desc: 'Discover the PHILIPPINES set in-level',   category: 'sets'     },
  discover_all_sets:  { name: 'Set Master',         desc: 'Discover all 5 pixel sets in-level',      category: 'sets'     },
  synergy_double:     { name: 'Resonance',          desc: 'Have 2 same-set pairs synergizing at once', category: 'sets'   },

  // ── Production ────────────────────────────────────────────
  dominate_color:     { name: 'Dominant',           desc: '8+ blocks boosted by dominance at once',  category: 'prod'     },
  dominate_full:      { name: 'Total Dominance',    desc: 'All 8 neighbors of a block are boosted',  category: 'prod'     },
  px_100k:            { name: 'Hundred Thousand',   desc: 'Produce 100K px in a single level',       category: 'prod'     },
  px_1m:              { name: 'Millionaire',        desc: 'Produce 1M px in a single level',         category: 'prod'     },
  px_10m:             { name: 'Ten Million',        desc: 'Produce 10M px in a single level',        category: 'prod'     },
  rate_1000:          { name: 'Kilopixel',          desc: 'Reach 1,000 px/s in a single level',      category: 'prod'     },
  rate_10000:         { name: 'Megamill',           desc: 'Reach 10,000 px/s in a single level',     category: 'prod'     },

  // ── Gold & Blocks ─────────────────────────────────────────
  greedy_10k:         { name: 'Gold Digger',        desc: 'Earn 10,000 total gold from Greedy Blocks', category: 'gold'   },
  greedy_100k:        { name: 'Hoarder',            desc: 'Earn 100,000 total gold from Greedy Blocks', category: 'gold'  },
  doubler_trigger:    { name: 'Isolation Ward',     desc: 'Trigger the Doubler bonus',                category: 'blocks'  },
  full_grid:          { name: 'No Space Left',      desc: 'Fill all 144 grid slots simultaneously',  category: 'blocks'  },

  // ── Endless ───────────────────────────────────────────────
  endless_wave_10:    { name: 'Infinite Factory',   desc: 'Reach Wave 10 in Endless mode',           category: 'endless' },
  endless_wave_25:    { name: 'Overclocker',        desc: 'Reach Wave 25 in Endless mode',           category: 'endless' },
  endless_wave_50:    { name: 'Perpetual Machine',  desc: 'Reach Wave 50 in Endless mode',           category: 'endless' },
  endless_wave_100:   { name: 'Heat Death',         desc: 'Reach Wave 100 in Endless mode',          category: 'endless' },

  // ── Shop / Unlocks ────────────────────────────────────────
  rainbow_unlock:     { name: 'Spectrum',           desc: 'Purchase the Rainbow Pixel unlock',       category: 'shop'    },
  templates_maxed:    { name: 'Blueprint Master',   desc: 'Fill all template slots',                 category: 'shop'    },
  save_template:      { name: 'Archivist',          desc: 'Save your first block template',          category: 'shop'    },
}

// ── Check helpers ─────────────────────────────────────────────────────────

export function checkLevelComplete({ levelNumber, stars, campaignProgress, unlockedKeys }) {
  const earned = []
  const prog = { ...campaignProgress, [levelNumber]: { stars } }

  if (levelNumber === 1   && !unlockedKeys.has('first_level'))  earned.push('first_level')
  if (levelNumber >= 25   && !unlockedKeys.has('level_25')   && (prog[25]?.stars ?? 0) > 0)  earned.push('level_25')
  if (levelNumber >= 50   && !unlockedKeys.has('level_50')   && (prog[50]?.stars ?? 0) > 0)  earned.push('level_50')
  if (levelNumber >= 100  && !unlockedKeys.has('level_100')  && (prog[100]?.stars ?? 0) > 0) earned.push('level_100')
  if (levelNumber >= 150  && !unlockedKeys.has('level_150')  && (prog[150]?.stars ?? 0) > 0) earned.push('level_150')
  if (levelNumber >= 200  && !unlockedKeys.has('level_200')  && (prog[200]?.stars ?? 0) > 0) earned.push('level_200')

  if (stars === 3 && !unlockedKeys.has('three_star_any')) earned.push('three_star_any')

  if (stars === 3 && !unlockedKeys.has('three_star_10')) {
    const all10 = Array.from({ length: 10 }, (_, i) => i + 1).every(n =>
      n === levelNumber ? stars === 3 : (campaignProgress[n]?.stars ?? 0) >= 3
    )
    if (all10) earned.push('three_star_10')
  }

  if (stars === 3 && !unlockedKeys.has('three_star_50')) {
    const count = Object.values({ ...campaignProgress, [levelNumber]: { stars } })
      .filter(p => (p?.stars ?? 0) >= 3).length
    if (count >= 50) earned.push('three_star_50')
  }

  if (stars === 3 && !unlockedKeys.has('three_star_all')) {
    const count = Object.values({ ...campaignProgress, [levelNumber]: { stars } })
      .filter(p => (p?.stars ?? 0) >= 3).length
    if (count >= 200) earned.push('three_star_all')
  }

  return earned
}

export function checkSetDiscovery({ newSets, discoveredSets, unlockedKeys }) {
  const earned = []
  const SET_KEYS = {
    MIDNIGHT:    'discover_midnight',
    PRIMARY:     'discover_primary',
    GRASS:       'discover_grass',
    SUNSET:      'discover_sunset',
    PHILIPPINES: 'discover_phils',
  }

  for (const setName of newSets) {
    if (discoveredSets.has(setName)) continue
    const key = SET_KEYS[setName]
    if (key && !unlockedKeys.has(key)) earned.push(key)
  }

  const ALL_SETS = new Set(['PRIMARY', 'MIDNIGHT', 'PHILIPPINES', 'GRASS', 'SUNSET'])
  const combined = new Set([...discoveredSets, ...newSets])
  if ([...ALL_SETS].every(s => combined.has(s)) && !unlockedKeys.has('discover_all_sets')) {
    earned.push('discover_all_sets')
  }

  return earned
}

export function checkGreedy({ cumulativeGreedyGold, unlockedKeys }) {
  const earned = []
  if (cumulativeGreedyGold >= 10_000  && !unlockedKeys.has('greedy_10k'))  earned.push('greedy_10k')
  if (cumulativeGreedyGold >= 100_000 && !unlockedKeys.has('greedy_100k')) earned.push('greedy_100k')
  return earned
}

export function checkEndlessWave({ wave, unlockedKeys }) {
  const earned = []
  if (wave >= 10  && !unlockedKeys.has('endless_wave_10'))  earned.push('endless_wave_10')
  if (wave >= 25  && !unlockedKeys.has('endless_wave_25'))  earned.push('endless_wave_25')
  if (wave >= 50  && !unlockedKeys.has('endless_wave_50'))  earned.push('endless_wave_50')
  if (wave >= 100 && !unlockedKeys.has('endless_wave_100')) earned.push('endless_wave_100')
  return earned
}

export function checkDominance({ dominanceMapSize, unlockedKeys }) {
  const earned = []
  if (dominanceMapSize >= 8  && !unlockedKeys.has('dominate_color')) earned.push('dominate_color')
  if (dominanceMapSize >= 8  && !unlockedKeys.has('dominate_full'))  earned.push('dominate_full')
  return earned
}

export function checkProduction({ totalPixelsProduced, currentPxPerSecond, unlockedKeys }) {
  const earned = []
  if (totalPixelsProduced >= 100_000    && !unlockedKeys.has('px_100k'))    earned.push('px_100k')
  if (totalPixelsProduced >= 1_000_000  && !unlockedKeys.has('px_1m'))      earned.push('px_1m')
  if (totalPixelsProduced >= 10_000_000 && !unlockedKeys.has('px_10m'))     earned.push('px_10m')
  if (currentPxPerSecond >= 1_000       && !unlockedKeys.has('rate_1000'))  earned.push('rate_1000')
  if (currentPxPerSecond >= 10_000      && !unlockedKeys.has('rate_10000')) earned.push('rate_10000')
  return earned
}

export function checkFullGrid({ grid, unlockedKeys }) {
  if (unlockedKeys.has('full_grid')) return []
  const filled = grid.flat().filter(Boolean).length
  return filled >= 144 ? ['full_grid'] : []
}
