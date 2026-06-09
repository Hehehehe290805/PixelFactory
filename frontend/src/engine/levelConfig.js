// Levels 1-10 are hand-crafted tutorials.
// Levels 11-200 are generated via makeLevels().

// Required outputs scaled for new production rate (25 white px ≈ 0.67 px/s per block).
const HAND_CRAFTED = [
  {
    number: 1, name: 'Tutorial',
    requiredOutput: 25, timeLimitSeconds: 120,
    startingBlocks: [{ type: 'base', count: 1 }],
    startingPixels: { white: 25 },
    tutorial: true,
  },
  {
    number: 2, name: 'Color Lab',
    requiredOutput: 50, timeLimitSeconds: 150,
    startingBlocks: [{ type: 'base', count: 2 }],
    startingPixels: { white: 15, red: 5, blue: 5, yellow: 5 },
  },
  {
    number: 3, name: 'Double Down',
    requiredOutput: 100, timeLimitSeconds: 180,
    startingBlocks: [{ type: 'base', count: 2 }, { type: 'doubler', count: 1 }],
    startingPixels: { white: 20, red: 10, blue: 10, yellow: 10 },
  },
  {
    number: 4, name: 'Crossfire',
    requiredOutput: 200, timeLimitSeconds: 200,
    startingBlocks: [{ type: 'base', count: 3 }, { type: 'cross_amp', count: 1 }],
    startingPixels: { white: 20, red: 10, blue: 10, yellow: 10, green: 10 },
  },
  {
    number: 5, name: 'Color Theory',
    requiredOutput: 400, timeLimitSeconds: 220,
    startingBlocks: [{ type: 'base', count: 3 }, { type: 'doubler', count: 1 }, { type: 'color_checker', count: 1 }],
    startingPixels: { white: 20, red: 15, blue: 15, yellow: 15, green: 15 },
  },
  {
    number: 6, name: 'Gold Rush',
    requiredOutput: 700, timeLimitSeconds: 240,
    startingBlocks: [{ type: 'base', count: 3 }, { type: 'doubler', count: 1 }, { type: 'cross_amp', count: 1 }, { type: 'greedy', count: 1 }],
    startingPixels: { white: 20, red: 20, blue: 20, yellow: 20, green: 20 },
  },
  {
    number: 7, name: 'Set Puzzle',
    requiredOutput: 1_200, timeLimitSeconds: 260,
    startingBlocks: [{ type: 'base', count: 4 }, { type: 'doubler', count: 1 }, { type: 'cross_amp', count: 1 }, { type: 'color_checker', count: 1 }],
    startingPixels: { white: 20, red: 20, blue: 20, yellow: 20, green: 40 },
    hint: 'Try a GRASS set block! (Yellow + Green, 30+ pixels)',
  },
  {
    number: 8, name: 'Synergy',
    requiredOutput: 2_000, timeLimitSeconds: 280,
    startingBlocks: [{ type: 'base', count: 4 }, { type: 'doubler', count: 2 }, { type: 'cross_amp', count: 1 }, { type: 'color_checker', count: 1 }],
    startingPixels: { white: 20, red: 30, blue: 30, yellow: 30, green: 30 },
  },
  {
    number: 9, name: 'Dominance',
    requiredOutput: 3_500, timeLimitSeconds: 300,
    startingBlocks: [{ type: 'base', count: 5 }, { type: 'doubler', count: 2 }, { type: 'cross_amp', count: 2 }, { type: 'color_checker', count: 1 }],
    startingPixels: { white: 20, red: 40, blue: 40, yellow: 40, green: 20 },
    hint: 'Fill one block with 50%+ of a single color to dominate all 8 neighbors!',
  },
  {
    number: 10, name: 'Full Factory',
    requiredOutput: 5_500, timeLimitSeconds: 330,
    startingBlocks: [{ type: 'base', count: 6 }, { type: 'doubler', count: 2 }, { type: 'cross_amp', count: 2 }, { type: 'color_checker', count: 1 }, { type: 'greedy', count: 1 }],
    startingPixels: { white: 20, red: 50, blue: 50, yellow: 50, green: 30 },
  },
]

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

// ── Block mix profiles by level range ─────────────────────────────────────

function blockMix(n) {
  const totalBlocks = Math.min(6 + Math.floor((n - 10) * 0.15), 36)

  if (n <= 20) {
    return [
      { type: 'base',    count: Math.max(1, Math.floor(totalBlocks * 0.7)) },
      { type: 'doubler', count: Math.max(0, Math.floor(totalBlocks * 0.3)) },
    ].filter(b => b.count > 0)
  }
  if (n <= 40) {
    const b = Math.max(1, Math.floor(totalBlocks * 0.5))
    const d = Math.max(1, Math.floor(totalBlocks * 0.25))
    const ca = Math.max(0, totalBlocks - b - d)
    return [{ type: 'base', count: b }, { type: 'doubler', count: d }, { type: 'cross_amp', count: ca }].filter(x => x.count > 0)
  }
  if (n <= 70) {
    const b  = Math.max(1, Math.floor(totalBlocks * 0.40))
    const d  = Math.max(1, Math.floor(totalBlocks * 0.20))
    const ca = Math.max(1, Math.floor(totalBlocks * 0.20))
    const cc = Math.max(0, Math.floor(totalBlocks * 0.10))
    const g  = Math.max(0, totalBlocks - b - d - ca - cc)
    return [{ type: 'base', count: b }, { type: 'doubler', count: d }, { type: 'cross_amp', count: ca }, { type: 'color_checker', count: cc }, { type: 'greedy', count: g }].filter(x => x.count > 0)
  }
  if (n <= 120) {
    const b  = Math.max(1, Math.floor(totalBlocks * 0.30))
    const d  = Math.max(1, Math.floor(totalBlocks * 0.25))
    const ca = Math.max(1, Math.floor(totalBlocks * 0.20))
    const cc = Math.max(1, Math.floor(totalBlocks * 0.15))
    const g  = Math.max(0, totalBlocks - b - d - ca - cc)
    return [{ type: 'base', count: b }, { type: 'doubler', count: d }, { type: 'cross_amp', count: ca }, { type: 'color_checker', count: cc }, { type: 'greedy', count: g }].filter(x => x.count > 0)
  }
  // 121-200
  const b  = Math.max(1, Math.floor(totalBlocks * 0.25))
  const d  = Math.max(1, Math.floor(totalBlocks * 0.25))
  const ca = Math.max(1, Math.floor(totalBlocks * 0.20))
  const cc = Math.max(1, Math.floor(totalBlocks * 0.15))
  const g  = Math.max(1, totalBlocks - b - d - ca - cc)
  return [{ type: 'base', count: b }, { type: 'doubler', count: d }, { type: 'cross_amp', count: ca }, { type: 'color_checker', count: cc }, { type: 'greedy', count: g }].filter(x => x.count > 0)
}

function pixelMix(n) {
  const total = Math.min(50 + n * 8, 2500)
  const perColor = Math.floor(total / 7)
  const extra = total - perColor * 7
  return {
    white:  perColor + extra,
    red:    perColor,
    orange: perColor,
    yellow: perColor,
    green:  perColor,
    blue:   perColor,
    violet: perColor,
  }
}

function makeLevels() {
  const levels = [...HAND_CRAFTED]

  for (let n = 11; n <= 200; n++) {
    // Required output: smooth power curve anchored at level 10 = 5500
    const requiredOutput = Math.floor(5_500 * Math.pow(n / 10, 2.3))

    // Time: 330s at level 10 → 600s at level 145+
    const timeLimitSeconds = Math.min(Math.floor(330 + (n - 10) * 1.45), 600)

    const nameIdx = n - 11  // 0-based index into TIER_NAMES
    const name = TIER_NAMES[nameIdx] ?? `Level ${n}`

    levels.push({
      number: n,
      name,
      requiredOutput,
      timeLimitSeconds,
      startingBlocks: blockMix(n),
      startingPixels: pixelMix(n),
    })
  }

  return levels
}

export const LEVELS = makeLevels()

export function getLevelConfig(levelNumber) {
  return LEVELS.find(l => l.number === levelNumber) ?? null
}
