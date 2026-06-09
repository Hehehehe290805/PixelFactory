import { Link } from 'react-router-dom'

export default function Endless() {
  return (
    <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-black text-white pixel-heading mb-4">Endless Mode</h1>
      <p className="text-gray-400 mb-8">Coming in Phase 6</p>
      <Link to="/" className="text-pixel-blue hover:underline">← Back to Home</Link>
    </div>
  )
}
