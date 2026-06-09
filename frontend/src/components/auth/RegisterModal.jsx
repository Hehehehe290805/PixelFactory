import { useState } from 'react'
import { useUserStore } from '../../store/userStore'
import { sanitizePlainText, validateEmail, validatePassword, validateUsername } from '../../lib/validate'

export default function RegisterModal({ onClose, onSwitchToLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const { register, loading, error, clearError } = useUserStore()

  function validate() {
    const errors = {}
    const usernameErr = validateUsername(username)
    if (usernameErr) errors.username = usernameErr
    const emailErr = validateEmail(email)
    if (emailErr) errors.email = emailErr
    const passwordErr = validatePassword(password)
    if (passwordErr) errors.password = passwordErr
    return errors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }
    setFieldErrors({})

    const cleanUsername = sanitizePlainText(username)
    const cleanEmail = email.trim().toLowerCase()
    const ok = await register(cleanEmail, password, cleanUsername)
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
        <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field
            label="Username"
            type="text"
            value={username}
            onChange={v => handleChange('username', v, setUsername)}
            error={fieldErrors.username}
            placeholder="3–20 chars, letters/numbers/_/-"
            maxLength={20}
          />
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={v => handleChange('email', v, setEmail)}
            error={fieldErrors.email}
            placeholder="you@example.com"
            maxLength={254}
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={v => handleChange('password', v, setPassword)}
            error={fieldErrors.password}
            placeholder="8+ chars, upper, lower, number, symbol"
            maxLength={72}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pixel-green hover:bg-green-400 disabled:opacity-50 text-white font-semibold py-2 rounded transition"
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="text-sm text-gray-400 mt-4 text-center">
          Have an account?{' '}
          <button onClick={onSwitchToLogin} className="text-pixel-blue hover:underline">
            Login
          </button>
        </p>
        <button onClick={onClose} className="mt-4 w-full text-sm text-gray-500 hover:text-gray-300 transition">
          Cancel
        </button>
      </div>
    </div>
  )
}

function Field({ label, type, value, onChange, error, placeholder, maxLength }) {
  return (
    <div>
      <label className="text-sm text-gray-400 block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        required
        autoComplete={type === 'password' ? 'new-password' : undefined}
        className={`w-full bg-game-bg border text-white rounded px-3 py-2 focus:outline-none transition
          ${error ? 'border-red-500 focus:border-red-400' : 'border-game-border focus:border-pixel-blue'}`}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
