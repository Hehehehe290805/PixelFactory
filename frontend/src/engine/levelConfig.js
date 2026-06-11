// Levels 1-5 are a comprehensive tutorial phase (no timer, no deck selector).
// Levels 6-10 are hand-crafted non-tutorial levels.
// Levels 11-200 are generated via makeLevels().

// Required outputs scaled for new production rate (pixelCount/37.5 px/s per block).
const HAND_CRAFTED = [
  { number: 1,  name: 'Hello Factory',   requiredOutput: 80,    timeLimitSeconds: 180, tutorial: true, tutorialLevel: 1 },
  { number: 2,  name: 'The Dashboard',   requiredOutput: 220,   timeLimitSeconds: 200, tutorial: true, tutorialLevel: 2 },
  { number: 3,  name: 'Open Shop',       requiredOutput: 420,   timeLimitSeconds: 260, tutorial: true, tutorialLevel: 3 },
  { number: 4,  name: 'Synergy Lab',     requiredOutput: 750,   timeLimitSeconds: 320, tutorial: true, tutorialLevel: 4 },
  { number: 5,  name: 'Block Workshop',  requiredOutput: 1_100, timeLimitSeconds: 380, tutorial: true, tutorialLevel: 5 },
  // First non-tutorial levels — preset decks introduce non-flower series
  { number: 6,  name: 'Garden Boost',    requiredOutput: 700,   timeLimitSeconds: 240, presetDeck: ['daisy','rose','tulip','lily','hibiscus'] },
  { number: 7,  name: 'City Block',      requiredOutput: 1_200, timeLimitSeconds: 260, presetDeck: ['house','castle','barn','pyramid','windmill'], hint: 'Place 5 buildings in one row for the CITY BLOCK synergy!' },
  { number: 8,  name: 'Sun & Moon',      requiredOutput: 2_000, timeLimitSeconds: 280, presetDeck: ['star','sun','moon','comet','lightning'] },
  { number: 9,  name: 'Wild Pack',       requiredOutput: 3_500, timeLimitSeconds: 300, presetDeck: ['cat','butterfly','bee','fox','turtle'] },
  { number: 10, name: 'Full Factory',    requiredOutput: 5_500, timeLimitSeconds: 330, presetDeck: ['daisy','rose','house','castle','star','sun'] },
]

// ── Series-based tint colors for level atmosphere ────────────────────────────
export const SERIES_TINT = {
  flowers:    { bg: '#1a0620', rim: '#c026d3', accent: '#e879f9' },
  trees:      { bg: '#041a0a', rim: '#16a34a', accent: '#4ade80' },
  buildings:  { bg: '#0a0a1a', rim: '#6366f1', accent: '#818cf8' },
  celestial:  { bg: '#0c0a1e', rim: '#7c3aed', accent: '#c4b5fd' },
  animals:    { bg: '#1a0c04', rim: '#d97706', accent: '#fbbf24' },
  shapes:     { bg: '#04101a', rim: '#0284c7', accent: '#38bdf8' },
  weather:    { bg: '#04101a', rim: '#0891b2', accent: '#67e8f9' },
  food:       { bg: '#1a0808', rim: '#dc2626', accent: '#f87171' },
  symbols:    { bg: '#100818', rim: '#9333ea', accent: '#c084fc' },
  landscapes: { bg: '#061010', rim: '#0d9488', accent: '#2dd4bf' },
  space:      { bg: '#06061a', rim: '#1d4ed8', accent: '#60a5fa' },
  abstract:   { bg: '#0a0a0a', rim: '#475569', accent: '#94a3b8' },
}


// ── Preset deck generation for levels 11-200 ──────────────────────────────────
// Cycles through thematic patterns, mixing series at higher tiers.
const DECK_PATTERNS = [
  ['daisy','rose','tulip','lily','hibiscus'],            // flowers core
  ['daisy','lotus','poppy','marigold','lavender'],       // flowers utility
  ['oak','pine','palm','cherry_tree','willow'],          // trees
  ['house','castle','tower','windmill','barn'],          // buildings
  ['star','sun','moon','comet','full_moon'],             // celestial
  ['cat','butterfly','bee','fox','turtle'],              // animals
  ['circle','diamond','hexagon','star_shape','spiral_shape'],  // shapes
  ['snowflake','raindrop','tornado','lightning_w','storm_cloud'], // weather
  ['daisy','rose','oak','pine','house'],                 // cross: flowers+trees+buildings
  ['star','sun','moon','cat','butterfly'],               // cross: celestial+animals
]

function generatePresetDeck(levelNum) {
  // Higher tier levels use slightly more complex cross-series mixes
  const tier = Math.floor((levelNum - 11) / 20)
  const patternIdx = (levelNum - 11) % DECK_PATTERNS.length
  return DECK_PATTERNS[patternIdx] ?? DECK_PATTERNS[0]
}

// ── Tier name pools (levels 11-200) ────────────────────────────────────────

const TIER_NAMES = [
  // Apprentice  11-30
  'Spark','Flicker','Glow','Hum','Static','Surge','Pulse','Ripple','Flare','Burst',
  'Scatter','Cluster','Stack','Layer','Array','Signal','Current','Charge','Feed','Core',
  // Craftsman   31-60
  'Circuit','Network','Matrix','Grid Run','Cascade','Parallel','Stream','Channel','Node','Hub',
  'Junction','Branch','Fork','Loop','Cycle','Phase','Sync','Lock','Route','Relay',
  'Switch','Bridge','Pipe','Wire','Frame','Block Line','Data Push','Overflow','Backlog','Queue',
  // Expert      61-100
  'Thread','Process','Worker','Handler','Daemon','Fiber','Coroutine','Semaphore','Mutex','Barrier',
  'Spinlock','Deadlock','Livelock','Race Condition','Atomic','Memory Bus','Cache Hit','Pipeline','Prefetch','Branch Predict',
  'Superscalar','Out-of-Order','Speculative','SIMD','AVX','Cache Miss','Stall','Hazard','Bypass','Writeback',
  'Load Balancer','Dispatcher','Scheduler','Affinity','Pinned','Hot Path','Cold Path','Trampoline','Inline','Unroll',
  // Master      101-150
  'Kernel','Interrupt','IRQ','DMA','MMIO','IOMMU','Hypervisor','VM Exit','TLB Flush','Page Fault',
  'Context Switch','Preempt','NUMA','RDMA','Zero Copy','Lock-Free','Wait-Free','CAS Loop','Epoch','Hazard Pointer',
  'RCU','Seqlock','MCS Lock','CLH Lock','Flat Combine','Combining Tree','Fetch-Add','Compare-Swap','LL/SC','Backoff',
  'Treiber Stack','Michael-Scott','Baskets Queue','Work Steal','Cilk Sync','Rayon','OpenMP','CUDA Warp','Tensor Core','GEMM',
  'Roofline','Bandwidth Bound','Compute Bound','Latency Hide','Prefetch Stream','TMA','PMU','Perf Event','Vtune','Nsight',
  // Grandmaster 151-200
  'Exascale','Petaflop','Teraflop','Exaflop','Silicon','Wafer','Reticle','Fab Node','EUV','ASIC',
  'Chiplet','HBM','CoWoS','SoIC','3D Stack','Interposer','SerDes','PHY','CXL','UCIe',
  'Liquid Cool','Direct Die','Immersion','Phase Change','TDP Limit','Throttle','Boost','Binning','Yield','Defect',
  'Process Node','Gate Oxide','FinFET','GAA','CFET','2D Material','Spintronics','Neuromorphic','Quantum Dot','Photonic',
  'Lattice','Qubit','Entangle','Superposition','Decohere','Fault Tolerant','Surface Code','Toffoli','Clifford','Threshold',
]

function makeLevels() {
  const levels = [...HAND_CRAFTED]

  for (let n = 11; n <= 200; n++) {
    // Required output: smooth power curve anchored at level 10 = 5500
    const requiredOutput = Math.floor(5_500 * Math.pow(n / 10, 2.3))

    // Time: 330s at level 10 → 600s at level 145+
    const timeLimitSeconds = Math.min(Math.floor(330 + (n - 10) * 1.45), 600)

    const nameIdx = n - 11
    const name = TIER_NAMES[nameIdx] ?? `Level ${n}`

    levels.push({ number: n, name, requiredOutput, timeLimitSeconds, presetDeck: generatePresetDeck(n) })
  }

  return levels
}

export const LEVELS = makeLevels()

export function getLevelConfig(levelNumber) {
  return LEVELS.find(l => l.number === levelNumber) ?? null
}
