import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useUserStore } from './store/userStore'
import { useSettingsStore } from './store/settingsStore'
import { setMusicVolume, setSfxVolume, startMusic, stopMusic } from './lib/audio'
import AchievementToast from './components/ui/AchievementToast'
import Home from './pages/Home'
import Campaign from './pages/Campaign'
import Level from './pages/Level'
import Endless from './pages/Endless'
import Shop from './pages/Shop'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import AccountSettings from './pages/AccountSettings'
import Leaderboard from './pages/Leaderboard'

// Keeps audio gain nodes in sync with settingsStore whenever settings change
function AudioSettingsSync() {
  const { musicEnabled, sfxEnabled, musicVolume, sfxVolume } = useSettingsStore()
  useEffect(() => { setMusicVolume(musicEnabled ? musicVolume : 0) }, [musicEnabled, musicVolume])
  useEffect(() => { setSfxVolume(sfxEnabled ? sfxVolume : 0) },       [sfxEnabled,   sfxVolume])
  return null
}

// Starts menu music on lobby screens; Level and Endless manage their own tracks
const LEVEL_ROUTES = ['/campaign/level/', '/endless']
function MusicManager() {
  const location = useLocation()
  useEffect(() => {
    const isGameplay = LEVEL_ROUTES.some(p => location.pathname.startsWith(p))
    if (!isGameplay) startMusic('menu')
    // Level.jsx / Endless.jsx call startMusic() themselves on mount
  }, [location.pathname])
  return null
}

export default function App() {
  const initialize = useUserStore(s => s.initialize)

  useEffect(() => { initialize() }, [initialize])

  return (
    <>
      <AudioSettingsSync />
      <MusicManager />
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
        <Route path="/leaderboard"               element={<Leaderboard />} />
        <Route path="*"                          element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
