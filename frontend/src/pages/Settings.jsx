import { useNavigate, Link } from 'react-router-dom'
import { useSettingsStore } from '../store/settingsStore'
import { useUserStore } from '../store/userStore'
import { applyMusicEnabled } from '../lib/audio'
import { ACHIEVEMENTS } from '../engine/achievementEngine'

const CATEGORY_LABELS = {
  progress: 'Campaign Progress',
  stars:    'Star Ratings',
  sets:     'Pixel Sets',
  prod:     'Production',
  gold:     'Gold & Greedy',
  blocks:   'Blocks',
  endless:  'Endless Mode',
  shop:     'Shop & Templates',
}

export default function Settings() {
  const navigate = useNavigate()
  const {
    showTutorial, setShowTutorial,
    showLearning, setShowLearning,
    musicEnabled, setMusicEnabled,
    sfxEnabled,   setSfxEnabled,
    musicVolume,  setMusicVolume,
    sfxVolume,    setSfxVolume,
  } = useSettingsStore()

  const { achievements, user } = useUserStore()
  const total = Object.keys(ACHIEVEMENTS).length

  const grouped = {}
  for (const [key, ach] of Object.entries(ACHIEVEMENTS)) {
    const cat = ach.category ?? 'other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push({ key, ...ach })
  }

  function handleMusicEnabled(v) {
    setMusicEnabled(v)
    applyMusicEnabled(v)
  }

  return (
    <div className="min-h-screen bg-game-bg px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="btn btn-secondary text-sm px-4 py-2">← Back</button>
          <h1 className="text-4xl font-black text-white pixel-heading">Settings</h1>
        </div>

        {/* Audio */}
        <Section title="Audio">
          <VolumeRow
            label="Music"
            desc="Ambient music tracks for each area"
            enabled={musicEnabled}
            onToggle={handleMusicEnabled}
            volume={musicVolume}
            onVolume={setMusicVolume}
          />
          <VolumeRow
            label="Sound Effects"
            desc="Block placement, synergies, achievements"
            enabled={sfxEnabled}
            onToggle={setSfxEnabled}
            volume={sfxVolume}
            onVolume={setSfxVolume}
          />
        </Section>

        {/* Gameplay */}
        <Section title="Gameplay">
          <ToggleRow
            label="Tutorial Tips"
            desc="Step-by-step guidance on Level 1"
            value={showTutorial}
            onChange={setShowTutorial}
          />
          <ToggleRow
            label="Learning Cards"
            desc="Facts and quizzes after campaign levels"
            value={showLearning}
            onChange={setShowLearning}
          />
        </Section>

        {user && (
          <>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">Achievements</h2>
              <span className="text-xs font-black text-gray-500">{achievements.size} / {total}</span>
            </div>

            {Object.entries(grouped).map(([cat, list]) => {
              const catUnlocked = list.filter(a => achievements.has(a.key)).length
              return (
                <div key={cat} className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-gray-600 uppercase tracking-wider">{CATEGORY_LABELS[cat] ?? cat}</span>
                    <span className="text-xs font-bold text-gray-700">{catUnlocked}/{list.length}</span>
                  </div>
                  <div className="card space-y-1.5" style={{ padding: '0.75rem' }}>
                    {list.map(({ key, name, desc }) => {
                      const unlocked = achievements.has(key)
                      return (
                        <div key={key}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2 border-2 ${unlocked ? 'border-pixel-yellow/40 bg-pixel-yellow/5' : 'border-game-border bg-game-bg opacity-40'}`}
                        >
                          <span className="text-base flex-shrink-0">{unlocked ? '🏆' : '🔒'}</span>
                          <div className="min-w-0">
                            <div className={`text-xs font-black truncate ${unlocked ? 'text-pixel-yellow' : 'text-gray-500'}`}>{name}</div>
                            <div className="text-xs font-semibold text-gray-600 leading-snug">{desc}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {!user && (
          <div className="card text-center py-8">
            <div className="text-3xl mb-3">🔒</div>
            <div className="text-sm font-black text-gray-500">Log in to track achievements</div>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">{title}</h2>
      <div className="card space-y-4">{children}</div>
    </div>
  )
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 select-none">
      <div>
        <div className="text-sm font-black text-gray-300">{label}</div>
        <div className="text-xs font-semibold text-gray-600 mt-0.5">{desc}</div>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  )
}

function VolumeRow({ label, desc, enabled, onToggle, volume, onVolume }) {
  return (
    <div className="flex flex-col gap-2 select-none">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-black text-gray-300">{label}</div>
          <div className="text-xs font-semibold text-gray-600 mt-0.5">{desc}</div>
        </div>
        <Toggle value={enabled} onChange={onToggle} />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-gray-700 font-bold w-4">🔇</span>
        <input
          type="range"
          min="0" max="1" step="0.01"
          value={volume}
          disabled={!enabled}
          onChange={e => onVolume(parseFloat(e.target.value))}
          className={`flex-1 h-1.5 rounded-full appearance-none cursor-pointer transition-opacity
            ${enabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}
          style={{ accentColor: '#1499cc' }}
        />
        <span className="text-[10px] text-gray-700 font-bold w-4">🔊</span>
        <span className="text-[10px] font-black text-gray-500 w-7 text-right">{Math.round(volume * 100)}%</span>
      </div>
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full border-2 transition-colors flex-shrink-0 overflow-hidden
        ${value ? 'bg-pixel-blue border-pixel-blue' : 'bg-game-bg border-game-border'}`}
    >
      <span
        className={`absolute left-0 top-[1px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-200
          ${value ? 'translate-x-[23px]' : 'translate-x-[3px]'}`}
      />
    </button>
  )
}
