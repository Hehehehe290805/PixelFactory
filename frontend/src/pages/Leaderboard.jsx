import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { supabase } from '../lib/supabase'

function fmt(s) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

export default function Leaderboard() {
  const navigate = useNavigate()
  const { user, profile } = useUserStore()
  const [tab, setTab] = useState('global')
  const { quizStats } = useUserStore()

  return (
    <div className="min-h-screen bg-game-bg px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="btn btn-secondary text-sm px-4 py-2">← Back</button>
          <h1 className="text-4xl font-black text-white pixel-heading">Highscores</h1>
        </div>

        {/* Tab selector */}
        <div className="flex gap-2 mb-6">
          {[['global', 'Global Top 10'], ['personal', 'Personal Best'], ['quiz', 'Quiz Score']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-xl text-xs font-black border-2 transition
                ${tab === key ? 'border-pixel-blue text-pixel-blue bg-pixel-blue/10' : 'border-game-border text-gray-500 hover:border-gray-500'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'global'   && <GlobalBoard currentUserId={user?.id} />}
        {tab === 'personal' && <PersonalBoard user={user} profile={profile} />}
        {tab === 'quiz'     && <QuizBoard user={user} profile={profile} quizStats={quizStats} />}
      </div>
    </div>
  )
}

// ── Global leaderboard ─────────────────────────────────────────────────────────
function GlobalBoard({ currentUserId }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('endless_scores')
        .select('username, highest_wave, total_pixels_produced, user_id, achieved_at')
        .order('highest_wave', { ascending: false })
        .limit(50)  // fetch more so we can deduplicate per user client-side

      if (error) { setError(error.message); return }

      // Keep only each user's best score
      const seen = new Set()
      const deduped = []
      for (const row of (data ?? [])) {
        if (!seen.has(row.user_id)) {
          seen.add(row.user_id)
          deduped.push(row)
        }
        if (deduped.length >= 10) break
      }
      setRows(deduped)
    }
    load()
  }, [])

  if (error) return <ErrorMsg msg={error} />
  if (!rows)  return <LoadingMsg />
  if (rows.length === 0) return <EmptyMsg msg="No scores yet — be the first to play Endless!" />

  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        const isYou = row.user_id === currentUserId
        return (
          <div
            key={row.user_id}
            className={`card flex items-center gap-3 ${isYou ? 'border-pixel-blue/60' : ''}`}
            style={{ padding: '0.875rem 1.25rem' }}
          >
            <span className={`text-2xl font-black font-mono w-8 flex-shrink-0 ${i < 3 ? ['text-pixel-yellow', 'text-gray-300', 'text-orange-400'][i] : 'text-gray-600'}`}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-sm truncate">{row.username}</span>
                {isYou && <span className="text-pixel-blue text-xs font-black">You</span>}
              </div>
              <div className="text-gray-600 text-xs font-semibold">
                {row.total_pixels_produced?.toLocaleString()} px total
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-pixel-green font-black text-lg">Wave {row.highest_wave}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Personal best ──────────────────────────────────────────────────────────────
function PersonalBoard({ user, profile }) {
  const [best, setBest] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data, error } = await supabase
        .from('endless_scores')
        .select('highest_wave, total_pixels_produced, achieved_at')
        .eq('user_id', user.id)
        .order('highest_wave', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) { setError(error.message); return }
      setBest(data)
    }
    load()
  }, [user?.id])

  if (!user) {
    return (
      <div className="card text-center py-10">
        <div className="text-4xl mb-3">🔒</div>
        <div className="text-white font-black mb-2">Not logged in</div>
        <p className="text-sm text-gray-500">Log in to track your personal best</p>
      </div>
    )
  }

  if (error)         return <ErrorMsg msg={error} />
  if (best === null) return <LoadingMsg />
  if (!best)         return <EmptyMsg msg="No Endless runs yet. Play Endless Mode to set a score!" />

  const achievedDate = best.achieved_at
    ? new Date(best.achieved_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <div className="text-center mb-6">
        <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">{profile?.username}</div>
        <div className="text-pixel-green font-black pixel-heading mb-0" style={{ fontSize: '4rem', lineHeight: 1 }}>
          {best.highest_wave}
        </div>
        <div className="text-gray-500 font-black text-sm uppercase tracking-widest mt-1">Best Wave</div>
      </div>
      <div className="space-y-3">
        <StatRow label="Total Pixels" value={best.total_pixels_produced?.toLocaleString() ?? '—'} />
        {achievedDate && <StatRow label="Achieved" value={achievedDate} />}
      </div>
    </div>
  )
}

// ── Quiz leaderboard ───────────────────────────────────────────────────────────
const MIN_ATTEMPTS = 3

function QuizBoard({ user, profile, quizStats }) {
  const [rows, setRows]   = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, quiz_correct, quiz_total')
        .gte('quiz_total', MIN_ATTEMPTS)
        .order('quiz_correct', { ascending: false })
        .limit(50)

      if (error) { setError(error.message); return }

      const sorted = (data ?? [])
        .map(r => ({ ...r, pct: r.quiz_correct / r.quiz_total }))
        .sort((a, b) => b.pct - a.pct || b.quiz_total - a.quiz_total)
        .slice(0, 10)
      setRows(sorted)
    }
    load()
  }, [])

  const myPct = quizStats.total >= MIN_ATTEMPTS
    ? Math.round((quizStats.correct / quizStats.total) * 100)
    : null

  if (error) return <ErrorMsg msg={error} />
  if (!rows)  return <LoadingMsg />

  return (
    <div className="space-y-4">
      {/* Personal quiz stats */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
          {profile?.username ?? 'Your Score'}
        </div>
        {quizStats.total === 0 ? (
          <p className="text-xs text-gray-600">Answer quiz questions in campaign levels and Endless Mode to appear here.</p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-pixel-blue font-black pixel-heading" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
                {myPct !== null ? `${myPct}%` : '—'}
              </div>
              <div className="text-gray-500 text-xs font-black uppercase tracking-widest mt-1">Accuracy</div>
            </div>
            <div className="flex-1 space-y-1.5">
              <StatRow label="Correct" value={quizStats.correct} />
              <StatRow label="Total"   value={quizStats.total} />
              {myPct === null && (
                <div className="text-xs text-gray-600">Need {MIN_ATTEMPTS - quizStats.total} more to rank</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Global ranking */}
      {rows.length === 0 ? (
        <EmptyMsg msg={`No one has answered ${MIN_ATTEMPTS}+ questions yet.`} />
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => {
            const isYou = user && row.username === profile?.username
            const pct   = Math.round(row.pct * 100)
            return (
              <div
                key={i}
                className={`card flex items-center gap-3 ${isYou ? 'border-pixel-blue/60' : ''}`}
                style={{ padding: '0.875rem 1.25rem' }}
              >
                <span className={`text-2xl font-black font-mono w-8 flex-shrink-0 ${i < 3 ? ['text-pixel-yellow', 'text-gray-300', 'text-orange-400'][i] : 'text-gray-600'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-black text-sm truncate">{row.username}</span>
                    {isYou && <span className="text-pixel-blue text-xs font-black">You</span>}
                  </div>
                  <div className="text-gray-600 text-xs font-semibold">{row.quiz_correct}/{row.quiz_total} correct</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-pixel-green font-black text-lg">{pct}%</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-black text-white">{value}</span>
    </div>
  )
}

function LoadingMsg() {
  return <div className="text-center py-12 text-gray-600 font-semibold">Loading…</div>
}

function ErrorMsg({ msg }) {
  return <div className="text-center py-12 text-pixel-red font-semibold text-sm">{msg}</div>
}

function EmptyMsg({ msg }) {
  return <div className="text-center py-12 text-gray-600 font-semibold text-sm">{msg}</div>
}
