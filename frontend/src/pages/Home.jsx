import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import LoginModal from '../components/auth/LoginModal'
import RegisterModal from '../components/auth/RegisterModal'

export default function Home() {
  const navigate = useNavigate()
  const { user, profile, gold, campaignProgress } = useUserStore()
  const [modal, setModal] = useState(null)

  const isLoggedIn   = !!user
  const hasLevel10   = isLoggedIn && (campaignProgress[10]?.stars ?? 0) > 0

  // Access rules:
  // Guest        → Endless ✓, Campaign grayed-out
  // Logged in    → Campaign ✓, Endless grayed-out until level 10 completed
  // Logged in + level 10+ → both ✓
  const canCampaign = isLoggedIn
  const canEndless  = !isLoggedIn || hasLevel10

  function handleCampaignClick() {
    if (!canCampaign) { setModal('login'); return }
    navigate('/campaign')
  }

  function handleEndlessClick() {
    if (!canEndless) return   // button is disabled
    navigate('/endless')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-game-bg px-4 py-12">
      {/* Title */}
      <div className="mb-14 text-center">
        <h1 className="text-7xl sm:text-8xl font-black tracking-widest pixel-heading leading-none">
          PIXEL<br className="sm:hidden" />
          <span className="text-pixel-blue">FACTORY</span>
        </h1>
        <p className="text-game-border2 mt-3 text-xs tracking-[0.3em] uppercase font-semibold">
          Parallel Processing, Pixel by Pixel
        </p>
      </div>

      {/* Nav buttons */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {/* Campaign */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={handleCampaignClick}
            className={`btn w-full text-lg ${canCampaign ? 'btn-primary' : 'btn-secondary opacity-50 cursor-pointer'}`}
          >
            Campaign
          </button>
          {!canCampaign && (
            <div className="text-center text-xs text-gray-500 font-semibold py-1">
              Log in to play Campaign
            </div>
          )}
        </div>

        {/* Endless */}
        <div className="relative">
          <button
            onClick={handleEndlessClick}
            disabled={!canEndless}
            className={`btn w-full text-base ${canEndless ? 'btn-secondary' : 'btn-secondary opacity-40 cursor-not-allowed'}`}
          >
            Endless Mode
          </button>
          {isLoggedIn && !canEndless && (
            <div className="absolute inset-x-0 -bottom-5 text-center text-xs text-gray-600 font-semibold">
              Complete Level 10 to unlock
            </div>
          )}
        </div>

        {/* Other nav */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Link to="/shop"     className="btn btn-secondary text-sm">Shop</Link>
          <Link to="/leaderboard" className="btn btn-secondary text-sm">Highscores</Link>
          <Link to="/profile"  className="btn btn-secondary text-sm">Templates</Link>
          <Link to="/settings" className="btn btn-secondary text-sm">Settings</Link>
        </div>
      </div>

      {/* Auth strip */}
      <div className="mt-12 border-t-2 border-game-border pt-6 w-full max-w-sm">
        {isLoggedIn && profile ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Signed in</p>
              <p className="text-white font-black text-base mt-0.5">{profile.username}</p>
            </div>
            <div className="text-right">
              <p className="text-pixel-yellow font-black text-lg">{gold.toLocaleString()}</p>
              <p className="text-xs text-gray-500 font-semibold">gold</p>
            </div>
            <Link to="/account" className="btn btn-secondary text-xs px-3 py-2">
              Account
            </Link>
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
