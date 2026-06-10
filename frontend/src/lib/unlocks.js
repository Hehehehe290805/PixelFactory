// Thin compatibility shim — old pixel/block unlock system removed.
// New system lives in lib/designUnlocks.js
export { useDesignUnlocks as useUnlocks, getStarterDesignIds, getChoicePairForLevel, shouldShowDesignChoice } from './designUnlocks'
