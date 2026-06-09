export const PIXEL_COLORS = {
  white:   { label: 'White',   hex: '#f8f9fa', cost: 1 },
  red:     { label: 'Red',     hex: '#e63946', cost: 3 },
  orange:  { label: 'Orange',  hex: '#f4a261', cost: 3 },
  yellow:  { label: 'Yellow',  hex: '#ffd166', cost: 3 },
  green:   { label: 'Green',   hex: '#06d6a0', cost: 3 },
  blue:    { label: 'Blue',    hex: '#118ab2', cost: 3 },
  violet:  { label: 'Violet',  hex: '#9b5de5', cost: 3 },
  rainbow: { label: 'Rainbow', hex: '#ff6b9d', cost: 3 },
}

export const BLOCK_TYPES = {
  base:          { label: 'Base Block',          shopCost: 50,  levelCost: 20  },
  doubler:       { label: 'Doubler Block',        shopCost: 150, levelCost: 60  },
  cross_amp:     { label: 'Cross Amplifier',      shopCost: 120, levelCost: 50  },
  color_checker: { label: 'Color Checker',        shopCost: 100, levelCost: 40  },
  greedy:        { label: 'Greedy Block',         shopCost: 200, levelCost: 80  },
  overflow:      { label: 'Overflow Block',       shopCost: 300, levelCost: 100 },
  mirror:        { label: 'Mirror Block',         shopCost: 250, levelCost: 90  },
  catalyst:      { label: 'Catalyst Block',       shopCost: 350, levelCost: 120 },
  void:          { label: 'Void Block',           shopCost: 200, levelCost: 70  },
}

export const GRID_SIZE = 12
export const BLOCK_CANVAS_SIZE = 16
export const TICK_MS = 100
export const MOVE_COOLDOWN_MS = 5000

export const PIXEL_SETS = {
  PRIMARY:     { colors: ['red', 'blue', 'yellow'],         minPixels: 40, outputBonus: 0.20 },
  MIDNIGHT:    { colors: ['blue', 'violet'],                minPixels: 35, outputBonus: 0.15 },
  PHILIPPINES: { colors: ['red', 'blue', 'yellow', 'white'],minPixels: 45, outputBonus: 0.10 },
  GRASS:       { colors: ['yellow', 'green'],               minPixels: 30, outputBonus: 0.12 },
  SUNSET:      { colors: ['red', 'yellow', 'orange'],       minPixels: 38, outputBonus: 0.18 },
}
