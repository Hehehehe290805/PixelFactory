import { motion } from 'framer-motion'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const GOLD_BY_STARS = { 3: 100, 2: 70, 1: 50, 0: 0 }

export default function StarResult({ stars, levelConfig, elapsedSeconds, onContinue, onRetry }) {
  const gold = GOLD_BY_STARS[stars] ?? 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-game-card border border-game-border rounded-2xl p-10 text-center shadow-2xl w-full max-w-sm"
      >
        {stars > 0 ? (
          <>
            <h2 className="text-3xl font-black text-white mb-2 pixel-heading">Level Complete!</h2>
            <p className="text-gray-400 text-sm mb-6">{levelConfig.name} · {formatTime(elapsedSeconds)}</p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-black text-red-400 mb-2 pixel-heading">Time's Up</h2>
            <p className="text-gray-400 text-sm mb-6">{levelConfig.name}</p>
          </>
        )}

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-6 text-5xl">
          {[1, 2, 3].map(i => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: i <= stars ? 1 : 0.6, rotate: 0 }}
              transition={{ delay: i * 0.15, type: 'spring' }}
              className={i <= stars ? 'text-pixel-yellow' : 'text-gray-700'}
            >
              ★
            </motion.span>
          ))}
        </div>

        {stars > 0 && (
          <div className="text-pixel-yellow font-bold text-lg mb-6">
            +{gold} gold
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 bg-game-bg hover:bg-game-border border border-game-border text-white font-semibold py-2 rounded-lg transition"
          >
            Retry
          </button>
          <button
            onClick={onContinue}
            className="flex-1 bg-pixel-blue hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition"
          >
            {stars > 0 ? 'Continue' : 'Back'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
