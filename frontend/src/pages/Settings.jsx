import { Link } from 'react-router-dom'
import { useSettingsStore } from '../store/settingsStore'
import { useUserStore } from '../store/userStore'
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
  const { sfxVolume, musicVolume, showTutorial, setSfxVolume, setMusicVolume, setShowTutorial } = useSettingsStore()
  const { achievements } = useUserStore()
  const total = Object.keys(ACHIEVEMENTS).length

  // Group achievements by category
  const grouped = {}
  for (const [key, ach] of Object.entries(ACHIEVEMENTS)) {
    const cat = ach.category ?? 'other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push({ key, ...ach })
  }

  return (
    <div className="min-h-screen bg-game-bg px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="btn btn-secondary text-sm px-4 py-2">← Back</Link>
          <h1 className="text-4xl font-black text-white pixel-heading">Settings</h1>
        </div>

        <Section title="Audio">
          <VolumeRow label="SFX"   value={sfxVolume}   onChange={setSfxVolume} />
          <VolumeRow label="Music" value={musicVolume} onChange={setMusicVolume} />
        </Section>

        <Section title="Gameplay">
          <ToggleRow
            label="Tutorial Tips"
            desc="Step-by-step guidance on Level 1"
            value={showTutorial}
            onChange={setShowTutorial}
          />
        </Section>

        {/* Achievements */}
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

function VolumeRow({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-black text-gray-300 w-14 flex-shrink-0 uppercase tracking-wider">{label}</span>
      <input type="range" min={0} max={1} step={0.05} value={value} onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 h-2 accent-pixel-blue cursor-pointer" />
      <span className="text-sm font-black font-mono text-white w-10 text-right">{Math.round(value * 100)}%</span>
    </div>
  )
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-black text-gray-300">{label}</div>
        <div className="text-xs font-semibold text-gray-600 mt-0.5">{desc}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full border-2 transition-colors flex-shrink-0 overflow-hidden
          ${value ? 'bg-pixel-blue border-pixel-blue' : 'bg-game-bg border-game-border'}`}
      >
        <span
          className={`absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-200
            ${value ? 'translate-x-[2px]' : 'translate-x-[26px]'}`}
        />
      </button>
    </div>
  )
}
