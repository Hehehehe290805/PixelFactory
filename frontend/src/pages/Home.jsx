import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import LoginModal from '../components/auth/LoginModal'
import RegisterModal from '../components/auth/RegisterModal'

export default function Home() {
  const { user, profile, gold, logout } = useUserStore()
  const [modal, setModal] = useState(null)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-game-bg px-4 py-12">
      {/* Title block */}
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
        <Link to="/campaign" className="btn btn-primary text-lg w-full">
          Campaign
        </Link>
        <Link to="/endless" className="btn btn-secondary text-base w-full">
          Endless Mode
        </Link>
        <div className="grid grid-cols-3 gap-3">
          <Link to="/shop"     className="btn btn-secondary text-sm col-span-1">Shop</Link>
          <Link to="/profile"  className="btn btn-secondary text-sm col-span-1">Templates</Link>
          <Link to="/settings" className="btn btn-secondary text-sm col-span-1">Settings</Link>
        </div>
      </div>

      {/* Auth strip */}
      <div className="mt-10 border-t-2 border-game-border pt-6 w-full max-w-sm">
        {user && profile ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Signed in</p>
              <p className="text-white font-black text-base mt-0.5">{profile.username}</p>
            </div>
            <div className="text-right">
              <p className="text-pixel-yellow font-black text-lg">{gold.toLocaleString()}</p>
              <p className="text-xs text-gray-500 font-semibold">gold</p>
            </div>
            <button
              onClick={logout}
              className="btn btn-danger text-xs px-3 py-2"
            >
              Logout
            </button>
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
