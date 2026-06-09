import { motion, AnimatePresence } from 'framer-motion'

export default function AchievementToast({ achievement, onDone }) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          onAnimationComplete={onDone}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-pixel-yellow text-black font-bold px-6 py-3 rounded-xl shadow-xl"
        >
          🏆 {achievement.name} — {achievement.description}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
