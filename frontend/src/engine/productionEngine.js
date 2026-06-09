import { TICK_MS } from '../lib/constants'

// Phase 1: base output only. Formula: pixelCount * 0.8 / 10 per tick (ticks are 100ms = 1/10 sec)
export function baseRate(block) {
  return Math.floor(block.pixelCount * 0.8)
}

export function computeTick(grid) {
  let totalThisTick = 0
  let totalPxPerSecond = 0

  for (const row of grid) {
    for (const block of row) {
      if (!block) continue
      if (block.pauseTimer > 0) continue

      const rate = baseRate(block) // px/second
      totalPxPerSecond += rate
      totalThisTick += rate / (1000 / TICK_MS) // convert to per-tick amount
    }
  }

  return { totalThisTick, totalPxPerSecond }
}
