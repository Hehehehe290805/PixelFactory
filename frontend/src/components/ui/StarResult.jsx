import { motion } from 'framer-motion'

function fmt(s) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

export default function StarResult({ stars, levelConfig, elapsedSeconds, goldEarned, onContinue, onRetry }) {
  const won = stars > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85">
      <motion.div
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        className="card mx-4 w-full max-w-sm text-center"
        style={{ padding: '2.5rem' }}
      >
        <h2 className={`text-4xl font-black pixel-heading mb-2 ${won ? 'text-white' : 'text-pixel-red'}`}>
          {won ? 'Complete!' : "Time's Up"}
        </h2>
        <p className="text-gray-500 text-sm font-semibold mb-8">
          {levelConfig.name}{won ? ` · ${fmt(elapsedSeconds)}` : ''}
        </p>

        {/* Stars */}
        <div className="flex justify-center gap-4 mb-8">
          {[1, 2, 3].map(i => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: i * 0.12, type: 'spring', stiffness: 240 }}
              style={{ fontSize: '3.5rem', lineHeight: 1 }}
              className={i <= stars ? 'text-pixel-yellow' : 'text-game-border'}
            >
              ★
            </motion.span>
          ))}
        </div>

        {goldEarned > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mb-8 px-5 py-3 rounded-2xl border-2 border-pixel-yellow/40 bg-pixel-yellow/10 inline-block"
          >
            <span className="text-pixel-yellow font-black text-2xl">+{goldEarned.toLocaleString()}</span>
            <span className="text-pixel-yellow/70 font-bold text-sm ml-2">gold</span>
          </motion.div>
        )}

        <div className="flex gap-3 mt-2">
          <button onClick={onRetry}    className="btn btn-secondary flex-1">Retry</button>
          <button onClick={onContinue} className="btn btn-primary flex-1">{won ? 'Continue' : 'Back'}</button>
        </div>
      </motion.div>
    </div>
  )
}
