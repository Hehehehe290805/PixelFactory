import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from './store/userStore'
import AchievementToast from './components/ui/AchievementToast'
import Home from './pages/Home'
import Campaign from './pages/Campaign'
import Level from './pages/Level'
import Endless from './pages/Endless'
import Shop from './pages/Shop'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import AccountSettings from './pages/AccountSettings'

export default function App() {
  const initialize = useUserStore(s => s.initialize)

  useEffect(() => { initialize() }, [initialize])

  return (
    <>
      <AchievementToast />
      <Routes>
        <Route path="/"                          element={<Home />} />
        <Route path="/campaign"                  element={<Campaign />} />
        <Route path="/campaign/level/:levelNumber" element={<Level />} />
        <Route path="/endless"                   element={<Endless />} />
        <Route path="/shop"                      element={<Shop />} />
        <Route path="/profile"                   element={<Profile />} />
        <Route path="/settings"                  element={<Settings />} />
        <Route path="/account"                   element={<AccountSettings />} />
        <Route path="*"                          element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
