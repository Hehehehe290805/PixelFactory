import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import LoginModal from '../components/auth/LoginModal'
import RegisterModal from '../components/auth/RegisterModal'

// Cosmic dust particles — static positions, drift animation via CSS
const PARTICLES = [
  { top: '12%', left: '8%',  size: 3, dur: 9,  del: 0 },
  { top: '28%', left: '88%', size: 2, dur: 13, del: 3 },
  { top: '65%', left: '6%',  size: 2, dur: 11, del: 1 },
  { top: '75%', left: '82%', size: 3, dur: 15, del: 5 },
  { top: '45%', left: '94%', size: 2, dur: 10, del: 2 },
]

export default function Home() {
  const navigate = useNavigate()
  const { user, profile, gold, campaignProgress } = useUserStore()
  const [modal, setModal] = useState(null)

  const isLoggedIn = !!user
  const hasLevel10 = isLoggedIn && (campaignProgress[10]?.stars ?? 0) > 0
  const canCampaign = isLoggedIn
  const canEndless  = !isLoggedIn || hasLevel10

  function handleCampaignClick() {
    if (!canCampaign) { setModal('login'); return }
    navigate('/campaign')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden" style={{ background: '#06061a' }}>

      {/* Cosmic dust */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            top: p.top, left: p.left,
            width: p.size, height: p.size,
            background: '#6366f1',
            opacity: 0.18,
            animation: `drift ${p.dur}s ease-in-out infinite`,
            animationDelay: `${p.del}s`,
          }}
        />
      ))}

      {/* Title */}
      <div className="mb-12 text-center">
        <h1 className="text-7xl sm:text-8xl font-black tracking-widest pixel-heading leading-none" style={{ color: '#ddd8f8' }}>
          PIXEL<br className="sm:hidden" />
          <span style={{ color: '#6366f1', textShadow: 'var(--glow-indigo)' }}>FACTORY</span>
        </h1>
        {/* Neon separator */}
        <div className="mt-4 mb-3 mx-auto" style={{
          height: 1, width: 280,
          background: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
        }} />
        <p className="text-xs tracking-[0.3em] uppercase font-semibold" style={{ color: '#2e2e60' }}>
          Parallel Processing, Pixel by Pixel
        </p>
      </div>

      {/* Nav buttons */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <div className="flex flex-col gap-1.5">
          <button
            onClick={handleCampaignClick}
            className={`btn w-full text-lg ${canCampaign ? 'btn-primary' : 'btn-secondary cursor-pointer'}`}
            style={canCampaign ? { boxShadow: '0 4px 0 #3730a3, var(--glow-indigo)' } : { opacity: 0.5 }}
          >
            Campaign
          </button>
          {!canCampaign && (
            <div className="text-center text-xs font-semibold py-1" style={{ color: '#3c3c72' }}>
              Log in to play Campaign
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={canEndless ? () => navigate('/endless') : undefined}
            disabled={!canEndless}
            className={`btn btn-secondary w-full text-base ${!canEndless ? 'cursor-not-allowed' : ''}`}
            style={!canEndless ? { opacity: 0.4 } : undefined}
          >
            Endless Mode
          </button>
          {isLoggedIn && !canEndless && (
            <div className="absolute inset-x-0 -bottom-5 text-center text-xs font-semibold" style={{ color: '#3c3c72' }}>
              Complete Level 10 to unlock
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <Link to="/shop"        className="btn btn-secondary text-sm">Shop</Link>
          <Link to="/leaderboard" className="btn btn-secondary text-sm">Highscores</Link>
          <Link to="/profile"     className="btn btn-secondary text-sm">Collection</Link>
          <Link to="/settings"    className="btn btn-secondary text-sm">Settings</Link>
        </div>
      </div>

      {/* Auth strip */}
      <div className="mt-12 pt-6 w-full max-w-sm">
        {/* Gradient separator */}
        <div style={{
          height: 1, marginBottom: 24,
          background: 'linear-gradient(90deg, transparent, #2e2e60 30%, #2e2e60 70%, transparent)',
        }} />
        {isLoggedIn && profile ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#3c3c72' }}>Signed in</p>
              <p className="font-black text-base mt-0.5" style={{ color: '#ddd8f8' }}>{profile.username}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-lg" style={{ color: '#fbbf24', textShadow: 'var(--glow-yellow)' }}>{gold.toLocaleString()}</p>
              <p className="text-xs font-semibold" style={{ color: '#3c3c72' }}>gold</p>
            </div>
            <Link to="/account" className="btn btn-secondary text-xs px-3 py-2">Account</Link>
          </div>
        ) : (
          <div className="flex gap-3">
            <button onClick={() => setModal('login')}    className="btn btn-secondary flex-1 text-sm">Login</button>
            <button onClick={() => setModal('register')} className="btn btn-primary flex-1 text-sm">Register</button>
          </div>
        )}
      </div>

      {modal === 'login'    && <LoginModal    onClose={() => setModal(null)} onSwitchToRegister={() => setModal('register')} />}
      {modal === 'register' && <RegisterModal onClose={() => setModal(null)} onSwitchToLogin={() => setModal('login')} />}
    </div>
  )
}
