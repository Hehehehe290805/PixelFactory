import { useState } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '../../store/userStore'

const DIFF_CHIP = {
  easy:   'border-pixel-green/50 text-pixel-green bg-pixel-green/10',
  normal: 'border-pixel-yellow/50 text-pixel-yellow bg-pixel-yellow/10',
  hard:   'border-pixel-red/50 text-pixel-red bg-pixel-red/10',
}

// mode: 'pre' = shown before the level starts; 'post' = shown after (legacy, no longer used)
// bonusAmount: pixels awarded for a correct answer in pre mode
// onContinue(wasCorrect?: boolean): called when the player is ready to proceed
export default function LearningCard({ content, levelNumber, onContinue, mode = 'post', bonusAmount = 0 }) {
  const { saveQuizResult } = useUserStore()
  const [selected, setSelected] = useState(null)

  const isPre     = mode === 'pre'
  const isQuiz    = content.type === 'quiz'
  const answered  = selected !== null
  const isCorrect = answered && selected === content.correct

  function handleOption(idx) {
    if (answered) return
    setSelected(idx)
    saveQuizResult(idx === content.correct)
  }

  function handleContinue() {
    onContinue(isQuiz ? isCorrect : null)
  }

  const continueLabel = isPre ? 'Start Level →' : 'Continue →'
  const canContinue   = !isQuiz || answered

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card w-full max-w-lg"
        style={{ padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Pre-level banner */}
        {isPre && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg" style={{ background: '#1499cc15', border: '1px solid #1499cc33' }}>
            <span className="text-pixel-blue text-xs font-black uppercase tracking-widest">Before you play</span>
            {isQuiz && bonusAmount > 0 && (
              <span className="ml-auto text-xs font-black text-pixel-yellow">
                Answer correctly → +{bonusAmount.toLocaleString()}px bonus!
              </span>
            )}
          </div>
        )}

        {isQuiz
          ? <QuizContent content={content} selected={selected} onOption={handleOption} isPreMode={isPre} bonusAmount={bonusAmount} />
          : <FactContent content={content} levelNumber={levelNumber} />}

        {canContinue && (
          <button onClick={handleContinue} className="btn btn-primary w-full mt-5 text-base">
            {continueLabel}
          </button>
        )}
      </motion.div>
    </div>
  )
}

function FactContent({ content, levelNumber }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-black uppercase tracking-widest text-gray-500">Level {levelNumber}</span>
        <span className="px-2 py-0.5 rounded-lg border-2 border-pixel-blue/40 bg-pixel-blue/10 text-pixel-blue text-xs font-black">
          {content.concept}
        </span>
      </div>

      <h2 className="text-xl font-black text-white mb-3 leading-snug">{content.title}</h2>
      <p className="text-sm text-gray-300 leading-relaxed mb-5">{content.body}</p>

      <div className="rounded-xl border-2 border-pixel-yellow/30 bg-pixel-yellow/5 px-4 py-3">
        <div className="text-xs font-black uppercase tracking-widest text-pixel-yellow mb-1">Real World</div>
        <p className="text-xs text-gray-400 leading-relaxed">{content.realWorld}</p>
      </div>
    </>
  )
}

function QuizContent({ content, selected, onOption, isPreMode, bonusAmount }) {
  const answered  = selected !== null
  const isCorrect = answered && selected === content.correct

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-black uppercase tracking-widest text-gray-500">Quiz</span>
        <span className={`px-2 py-0.5 rounded-lg border-2 text-xs font-black ${DIFF_CHIP[content.difficulty] ?? DIFF_CHIP.normal}`}>
          {content.difficulty}
        </span>
      </div>

      <p className="text-base font-black text-white mb-4 leading-snug">{content.question}</p>

      <div className="space-y-2 mb-4">
        {content.options.map((opt, i) => {
          let cls = 'border-game-border text-gray-300 hover:border-gray-500'
          if (answered) {
            if (i === content.correct) cls = 'border-pixel-green bg-pixel-green/10 text-pixel-green'
            else if (i === selected)   cls = 'border-pixel-red bg-pixel-red/10 text-pixel-red'
            else                       cls = 'border-game-border text-gray-600 opacity-50'
          }
          return (
            <button
              key={i}
              onClick={() => onOption(i)}
              disabled={answered}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-colors ${cls}`}
            >
              <span className="font-black mr-2 text-xs opacity-60">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          )
        })}
      </div>

      {answered && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border-2 px-4 py-3 ${isCorrect ? 'border-pixel-green/40 bg-pixel-green/5' : 'border-pixel-red/40 bg-pixel-red/5'}`}
        >
          <div className={`text-xs font-black mb-1 ${isCorrect ? 'text-pixel-green' : 'text-pixel-red'}`}>
            {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            {isCorrect && isPreMode && bonusAmount > 0 && (
              <span className="ml-2 text-pixel-yellow">+{bonusAmount.toLocaleString()}px bonus added to your run!</span>
            )}
            {!isCorrect && isPreMode && bonusAmount > 0 && (
              <span className="ml-2 text-gray-500">No bonus this time — try again next level!</span>
            )}
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{content.explanation}</p>
        </motion.div>
      )}
    </>
  )
}
