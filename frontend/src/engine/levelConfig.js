// Levels 1-10 are hand-crafted tutorials.
// Levels 11-200 are generated via makeLevels().

// Required outputs scaled for new production rate (pixelCount/37.5 px/s per block).
const HAND_CRAFTED = [
  { number: 1,  name: 'Tutorial',      requiredOutput: 25,    timeLimitSeconds: 120, tutorial: true },
  { number: 2,  name: 'Color Lab',     requiredOutput: 50,    timeLimitSeconds: 150 },
  { number: 3,  name: 'Double Down',   requiredOutput: 100,   timeLimitSeconds: 180 },
  { number: 4,  name: 'Crossfire',     requiredOutput: 200,   timeLimitSeconds: 200 },
  { number: 5,  name: 'Color Theory',  requiredOutput: 400,   timeLimitSeconds: 220 },
  { number: 6,  name: 'Gold Rush',     requiredOutput: 700,   timeLimitSeconds: 240 },
  { number: 7,  name: 'Set Puzzle',    requiredOutput: 1_200, timeLimitSeconds: 260, hint: 'Try placing designs of the same series in a row for a synergy bonus!' },
  { number: 8,  name: 'Synergy',       requiredOutput: 2_000, timeLimitSeconds: 280 },
  { number: 9,  name: 'Dominance',     requiredOutput: 3_500, timeLimitSeconds: 300 },
  { number: 10, name: 'Full Factory',  requiredOutput: 5_500, timeLimitSeconds: 330 },
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

function makeLevels() {
  const levels = [...HAND_CRAFTED]

  for (let n = 11; n <= 200; n++) {
    // Required output: smooth power curve anchored at level 10 = 5500
    const requiredOutput = Math.floor(5_500 * Math.pow(n / 10, 2.3))

    // Time: 330s at level 10 → 600s at level 145+
    const timeLimitSeconds = Math.min(Math.floor(330 + (n - 10) * 1.45), 600)

    const nameIdx = n - 11  // 0-based index into TIER_NAMES
    const name = TIER_NAMES[nameIdx] ?? `Level ${n}`

    levels.push({ number: n, name, requiredOutput, timeLimitSeconds })
  }

  return levels
}

export const LEVELS = makeLevels()

export function getLevelConfig(levelNumber) {
  return LEVELS.find(l => l.number === levelNumber) ?? null
}
