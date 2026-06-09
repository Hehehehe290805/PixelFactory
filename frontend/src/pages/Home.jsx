import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import LoginModal from '../components/auth/LoginModal'
import RegisterModal from '../components/auth/RegisterModal'

export default function Home() {
  const { user, profile, logout } = useUserStore()
  const [modal, setModal] = useState(null) // 'login' | 'register' | null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-game-bg px-4">
      {/* Title */}
      <div className="mb-12 text-center">
        <h1 className="text-6xl font-black text-white tracking-widest pixel-heading">
          PIXEL<span className="text-pixel-blue">FACTORY</span>
        </h1>
        <p className="text-gray-400 mt-2 text-sm tracking-widest uppercase">
          Parallel Processing, Pixel by Pixel
        </p>
      </div>

      {/* Main menu */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          to="/campaign"
          className="bg-pixel-blue hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg text-center transition text-lg"
        >
          Campaign
        </Link>
        <Link
          to="/endless"
          className="bg-game-card hover:bg-game-border text-white font-semibold py-3 px-6 rounded-lg text-center transition border border-game-border"
        >
          Endless Mode
        </Link>
        <Link
          to="/shop"
          className="bg-game-card hover:bg-game-border text-white font-semibold py-3 px-6 rounded-lg text-center transition border border-game-border"
        >
          Shop
        </Link>
        <Link
          to="/profile"
          className="bg-game-card hover:bg-game-border text-white font-semibold py-3 px-6 rounded-lg text-center transition border border-game-border"
        >
          Block Templates
        </Link>
      </div>

      {/* Auth area */}
      <div className="mt-10 text-center">
        {user && profile ? (
          <div className="flex flex-col items-center gap-2">
            <span className="text-gray-300 text-sm">
              Logged in as <span className="text-white font-semibold">{profile.username}</span>
            </span>
            <span className="text-pixel-yellow text-sm font-semibold">{profile.gold} gold</span>
            <button
              onClick={logout}
              className="text-xs text-gray-500 hover:text-gray-300 transition mt-1"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={() => setModal('login')}
              className="text-sm text-pixel-blue hover:underline"
            >
              Login
            </button>
            <button
              onClick={() => setModal('register')}
              className="text-sm text-pixel-green hover:underline"
            >
              Register
            </button>
          </div>
        )}
      </div>

      {modal === 'login' && (
        <LoginModal
          onClose={() => setModal(null)}
          onSwitchToRegister={() => setModal('register')}
        />
      )}
      {modal === 'register' && (
        <RegisterModal
          onClose={() => setModal(null)}
          onSwitchToLogin={() => setModal('login')}
        />
      )}
    </div>
  )
}
