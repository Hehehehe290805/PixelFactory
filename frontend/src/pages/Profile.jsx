import { Link } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { PIXEL_COLORS, BLOCK_CANVAS_SIZE } from '../lib/constants'
import { OFFICIAL_TEMPLATES } from '../lib/officialTemplates'

const CELL = 8

const SET_COLORS = {
  PRIMARY: '#e63946',  MIDNIGHT: '#9b5de5', PHILIPPINES: '#ffd166',
  GRASS: '#06d6a0',    SUNSET: '#f4a261',
  SILVER_MIST: '#9db4cc', NEON_RUSH: '#39ff14', AURORA: '#a0c4ff',
  SUNRISE: '#ffc000',  OCEAN: '#1499cc',    FIRE: '#f03e4e',
  ROYAL: '#a066f0',    EMBER: '#f59342',    TROPICS: '#00d49a',
  CORAL: '#f03e4e',
}

// Full preview — shown once the set has been discovered
function TemplatePreview({ pixelLayout }) {
  return (
    <div
      className="border border-game-border rounded overflow-hidden flex-shrink-0"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${BLOCK_CANVAS_SIZE}, ${CELL}px)`,
        width: BLOCK_CANVAS_SIZE * CELL,
        height: BLOCK_CANVAS_SIZE * CELL,
        imageRendering: 'pixelated',
      }}
    >
      {Array.from({ length: BLOCK_CANVAS_SIZE }, (_, r) =>
        Array.from({ length: BLOCK_CANVAS_SIZE }, (_, c) => {
          const color = pixelLayout[r]?.[c]
          return (
            <div
              key={`${r}-${c}`}
              style={{ backgroundColor: color ? PIXEL_COLORS[color]?.hex : '#0f0f1a' }}
            />
          )
        })
      )}
    </div>
  )
}

// Hidden preview — shown before the set is discovered
function LockedPreview({ setType }) {
  const size = BLOCK_CANVAS_SIZE * CELL
  const color = SET_COLORS[setType] ?? '#555'
  return (
    <div
      className="border border-game-border rounded overflow-hidden flex-shrink-0 flex items-center justify-center"
      style={{
        width: size, height: size,
        background: `radial-gradient(circle at center, ${color}18 0%, #0a0a18 70%)`,
        border: `1px solid ${color}33`,
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="text-3xl font-black" style={{ color: color + '44' }}>?</div>
        <div className="text-xs font-black uppercase tracking-widest text-center" style={{ color: color + '66', fontSize: 9 }}>
          {setType}
        </div>
      </div>
    </div>
  )
}

function TemplateCard({ template, official = false, discovered = true }) {
  const setColor = SET_COLORS[template.set_type] ?? '#888'
  return (
    <div
      className="bg-game-card border border-game-border rounded-xl p-3 flex flex-col gap-2 transition"
      style={{ borderColor: discovered ? undefined : '#1e1e3a' }}
    >
      {official && !discovered
        ? <LockedPreview setType={template.set_type} />
        : <TemplatePreview pixelLayout={template.pixel_layout} />
      }
      <div>
        <div className="text-white text-sm font-semibold">
          {official && !discovered ? '???' : template.name}
        </div>
        {template.set_type && (
          <div className="text-xs font-semibold mt-0.5" style={{ color: discovered ? setColor : setColor + '55' }}>
            {template.set_type}
          </div>
        )}
        {official && (
          <div className="text-xs mt-0.5" style={{ color: discovered ? '#ffd166' : '#333' }}>
            {discovered ? 'Official' : 'Discover in-level to unlock'}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, templates, discoveredSets } = useUserStore()

  return (
    <div className="min-h-screen bg-game-bg px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="btn btn-secondary text-sm px-4 py-2">← Back</Link>
          <h1 className="text-3xl font-black text-white pixel-heading">Block Templates</h1>
        </div>

        {/* Official templates */}
        <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">
          Official — {OFFICIAL_TEMPLATES.filter(t => discoveredSets.has(t.set_type)).length} / {OFFICIAL_TEMPLATES.length} discovered
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-10">
          {OFFICIAL_TEMPLATES.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              official
              discovered={discoveredSets.has(t.set_type)}
            />
          ))}
        </div>

        {/* Player templates */}
        <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Your Templates</h2>
        {!user ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-3">Log in to save your own templates.</p>
            <Link to="/" className="text-pixel-blue hover:underline text-sm">Home → Login</Link>
          </div>
        ) : templates.length === 0 ? (
          <p className="text-gray-600 text-sm italic">
            No templates saved yet. Discover a pixel set in-level to be prompted to save it.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {templates.map(t => <TemplateCard key={t.id} template={t} />)}
          </div>
        )}
      </div>
    </div>
  )
}
