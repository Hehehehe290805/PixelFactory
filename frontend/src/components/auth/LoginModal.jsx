import { useState } from 'react'
import { useUserStore } from '../../store/userStore'
import { validateEmail } from '../../lib/validate'

export default function LoginModal({ onClose, onSwitchToRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const { login, loading, error, clearError } = useUserStore()

  function validate() {
    const errors = {}
    const emailErr = validateEmail(email)
    if (emailErr) errors.email = emailErr
    if (!password) errors.password = 'Password is required'
    return errors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }
    setFieldErrors({})
    const ok = await login(email.trim().toLowerCase(), password)
    if (ok) onClose()
  }

  function handleChange(field, value, setter) {
    setter(value)
    if (fieldErrors[field]) setFieldErrors(f => ({ ...f, [field]: null }))
    clearError()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-game-card border border-game-border rounded-xl p-8 w-full max-w-sm shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Login</h2>

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => handleChange('email', e.target.value, setEmail)}
              maxLength={254}
              required
              autoComplete="email"
              className={`w-full bg-game-bg border text-white rounded px-3 py-2 focus:outline-none transition
                ${fieldErrors.email ? 'border-red-500' : 'border-game-border focus:border-pixel-blue'}`}
            />
            {fieldErrors.email && <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => handleChange('password', e.target.value, setPassword)}
              maxLength={72}
              required
              autoComplete="current-password"
              className={`w-full bg-game-bg border text-white rounded px-3 py-2 focus:outline-none transition
                ${fieldErrors.password ? 'border-red-500' : 'border-game-border focus:border-pixel-blue'}`}
            />
            {fieldErrors.password && <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pixel-blue hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2 rounded transition"
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p className="text-sm text-gray-400 mt-4 text-center">
          No account?{' '}
          <button onClick={onSwitchToRegister} className="text-pixel-blue hover:underline">
            Register
          </button>
        </p>
        <button onClick={onClose} className="mt-4 w-full text-sm text-gray-500 hover:text-gray-300 transition">
          Cancel
        </button>
      </div>
    </div>
  )
}
