import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '../../store/userStore'
import { playAchievementUnlock } from '../../lib/audio'

export default function AchievementToast() {
  const { toastQueue, dismissToast } = useUserStore()
  const current = toastQueue[0] ?? null

  useEffect(() => {
    if (!current) return
    playAchievementUnlock()
    const t = setTimeout(dismissToast, 3500)
    return () => clearTimeout(t)
  }, [current?.key]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.key}
            initial={{ y: -56, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -56, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="bg-pixel-yellow text-black px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 pointer-events-auto cursor-pointer"
            onClick={dismissToast}
          >
            <span className="text-xl">🏆</span>
            <div>
              <div className="font-black text-sm uppercase tracking-wide">{current.name}</div>
              <div className="text-xs opacity-70">{current.desc}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
