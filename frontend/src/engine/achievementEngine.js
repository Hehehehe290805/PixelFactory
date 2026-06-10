export const ACHIEVEMENTS = {
  // ── Progression ──────────────────────────────────────────
  first_level:        { name: 'Factory Floor',      desc: 'Complete Level 1',                          category: 'progress' },
  level_25:           { name: 'Getting Serious',    desc: 'Complete Level 25',                         category: 'progress' },
  level_50:           { name: 'Halfway There',      desc: 'Complete Level 50',                         category: 'progress' },
  level_100:          { name: 'Century Run',        desc: 'Complete Level 100',                        category: 'progress' },
  level_150:          { name: 'Deep Factory',       desc: 'Complete Level 150',                        category: 'progress' },
  level_200:          { name: 'Grand Master',       desc: 'Complete all 200 levels',                   category: 'progress' },

  // ── Stars ─────────────────────────────────────────────────
  three_star_any:     { name: 'Perfectionist',      desc: 'Get 3 stars on any level',                  category: 'stars'    },
  three_star_10:      { name: 'Flawless Ten',       desc: 'Get 3 stars on the first 10 levels',        category: 'stars'    },
  three_star_50:      { name: 'Stellar Run',        desc: 'Get 3 stars on 50 levels',                  category: 'stars'    },
  three_star_all:     { name: 'Pixel Perfect',      desc: 'Get 3 stars on all 200 levels',             category: 'stars'    },

  // ── Synergies ─────────────────────────────────────────────
  first_synergy:      { name: 'Harmony',            desc: 'Activate your first design synergy',        category: 'synergy'  },
  garden_synergy:     { name: 'Green Thumb',        desc: 'Activate the GARDEN synergy',               category: 'synergy'  },
  forest_synergy:     { name: 'Ancient Grove',      desc: 'Activate the FOREST synergy',               category: 'synergy'  },
  cosmos_synergy:     { name: 'Stargazer',          desc: 'Activate the COSMOS synergy',               category: 'synergy'  },
  multi_synergy:      { name: 'Symphony',           desc: 'Have 5 synergies active simultaneously',    category: 'synergy'  },

  // ── Production ────────────────────────────────────────────
  px_100k:            { name: 'Hundred Thousand',   desc: 'Produce 100K px in a single level',         category: 'prod'     },
  px_1m:              { name: 'Millionaire',        desc: 'Produce 1M px in a single level',           category: 'prod'     },
  px_10m:             { name: 'Ten Million',        desc: 'Produce 10M px in a single level',          category: 'prod'     },
  rate_1000:          { name: 'Kilopixel',          desc: 'Reach 1,000 px/s in a single level',        category: 'prod'     },
  rate_10000:         { name: 'Megamill',           desc: 'Reach 10,000 px/s in a single level',       category: 'prod'     },

  // ── Gold & Blocks ─────────────────────────────────────────
  greedy_10k:         { name: 'Gold Digger',        desc: 'Earn 10,000 total gold from Greedy designs', category: 'gold'    },
  greedy_100k:        { name: 'Hoarder',            desc: 'Earn 100,000 total gold from Greedy designs', category: 'gold'   },
  full_grid:          { name: 'No Space Left',      desc: 'Fill all 144 grid slots simultaneously',    category: 'blocks'   },

  // ── Collection ────────────────────────────────────────────
  designs_25:         { name: 'Collector',          desc: 'Unlock 25 designs',                         category: 'collect'  },
  designs_50:         { name: 'Curator',            desc: 'Unlock 50 designs',                         category: 'collect'  },
  designs_100:        { name: 'Archivist',          desc: 'Unlock 100 designs',                        category: 'collect'  },
  all_series:         { name: 'Complete Set',       desc: 'Unlock at least 1 design from every series', category: 'collect' },

  // ── Endless ───────────────────────────────────────────────
  endless_wave_10:    { name: 'Infinite Factory',   desc: 'Reach Wave 10 in Endless mode',             category: 'endless'  },
  endless_wave_25:    { name: 'Overclocker',        desc: 'Reach Wave 25 in Endless mode',             category: 'endless'  },
  endless_wave_50:    { name: 'Perpetual Machine',  desc: 'Reach Wave 50 in Endless mode',             category: 'endless'  },
  endless_wave_100:   { name: 'Heat Death',         desc: 'Reach Wave 100 in Endless mode',            category: 'endless'  },
}

// ── Check helpers ──────────────────────────────────────────────────────────────

export function checkLevelComplete({ levelNumber, stars, campaignProgress, unlockedKeys }) {
  const earned = []
  const prog = { ...campaignProgress, [levelNumber]: { stars } }

  if (levelNumber === 1  && !unlockedKeys.has('first_level'))  earned.push('first_level')
  if (levelNumber >= 25  && !unlockedKeys.has('level_25')   && (prog[25]?.stars  ?? 0) > 0) earned.push('level_25')
  if (levelNumber >= 50  && !unlockedKeys.has('level_50')   && (prog[50]?.stars  ?? 0) > 0) earned.push('level_50')
  if (levelNumber >= 100 && !unlockedKeys.has('level_100')  && (prog[100]?.stars ?? 0) > 0) earned.push('level_100')
  if (levelNumber >= 150 && !unlockedKeys.has('level_150')  && (prog[150]?.stars ?? 0) > 0) earned.push('level_150')
  if (levelNumber >= 200 && !unlockedKeys.has('level_200')  && (prog[200]?.stars ?? 0) > 0) earned.push('level_200')

  if (stars === 3 && !unlockedKeys.has('three_star_any')) earned.push('three_star_any')

  if (stars === 3 && !unlockedKeys.has('three_star_10')) {
    const all10 = Array.from({ length: 10 }, (_, i) => i + 1).every(n =>
      n === levelNumber ? stars === 3 : (campaignProgress[n]?.stars ?? 0) >= 3
    )
    if (all10) earned.push('three_star_10')
  }

  const count3star = Object.values({ ...campaignProgress, [levelNumber]: { stars } })
    .filter(p => (p?.stars ?? 0) >= 3).length
  if (count3star >= 50  && !unlockedKeys.has('three_star_50'))  earned.push('three_star_50')
  if (count3star >= 200 && !unlockedKeys.has('three_star_all')) earned.push('three_star_all')

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
  return grid.flat().filter(Boolean).length >= 144 ? ['full_grid'] : []
}

export function checkDesignCollection({ unlockedDesigns = [], unlockedKeys }) {
  const earned = []
  const count = unlockedDesigns.length
  if (count >= 25  && !unlockedKeys.has('designs_25'))  earned.push('designs_25')
  if (count >= 50  && !unlockedKeys.has('designs_50'))  earned.push('designs_50')
  if (count >= 100 && !unlockedKeys.has('designs_100')) earned.push('designs_100')
  return earned
}
