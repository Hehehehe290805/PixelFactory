import { GRID_SIZE, PIXEL_SETS } from '../lib/constants'

const ORTHOGONAL = [[-1, 0], [1, 0], [0, -1], [0, 1]]
const DIAGONAL   = [[-1,-1], [-1, 1], [1,-1],  [1, 1]]
const ALL8       = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]

// Radiation tables: how much bonus a set radiates to its neighbors.
// Each set may radiate to orthogonal, diagonal, or all-8 neighbors.
// Values are additive bonuses (e.g. 0.10 = +10%).
const ORTHO_RADIATION = {
  MIDNIGHT:    0.10,
  PHILIPPINES: 0.05,
  SILVER_MIST: 0.06,
  NEON_RUSH:   0.10,
  ROYAL:       0.12,
  OCEAN:       0.08,
  CORAL:       0.06,
}

const DIAG_RADIATION = {
  GRASS:       0.08,
  FIRE:        0.10,
  EMBER:       0.12,
  SUNRISE:     0.10,
}

const ALL8_RADIATION = {
  AURORA:      0.12,
  TROPICS:     0.08,
}

// Multiplier from a block's own set and radiation received from neighbors.
export function getSetBonusMultiplier(row, col, setMap) {
  let bonus = 0
  const thisSet = setMap[row]?.[col]

  if (thisSet) {
    bonus += PIXEL_SETS[thisSet]?.outputBonus ?? 0
  }

  for (const [dr, dc] of ORTHOGONAL) {
    const nSet = setMap[row + dr]?.[col + dc]
    if (nSet && ORTHO_RADIATION[nSet]) bonus += ORTHO_RADIATION[nSet]
  }

  for (const [dr, dc] of DIAGONAL) {
    const nSet = setMap[row + dr]?.[col + dc]
    if (nSet && DIAG_RADIATION[nSet]) bonus += DIAG_RADIATION[nSet]
  }

  for (const [dr, dc] of ALL8) {
    const nSet = setMap[row + dr]?.[col + dc]
    if (nSet && ALL8_RADIATION[nSet]) bonus += ALL8_RADIATION[nSet]
  }

  return 1 + bonus
}

// +15% if any orthogonal neighbor shares the same set (used as base; caller can scale).
export function getSynergyMultiplier(row, col, setMap) {
  const thisSet = setMap[row]?.[col]
  if (!thisSet) return 1

  for (const [dr, dc] of ORTHOGONAL) {
    const nr = row + dr
    const nc = col + dc
    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
      if (setMap[nr]?.[nc] === thisSet) return 1.15
    }
  }

  return 1
}
