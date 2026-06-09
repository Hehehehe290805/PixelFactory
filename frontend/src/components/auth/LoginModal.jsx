import { useState } from 'react'
import { useUserStore } from '../../store/userStore'
import { validateEmail } from '../../lib/validate'

export default function LoginModal({ onClose, onSwitchToRegister }) {
  const [email, setEmail]       = useState('')
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
    if (Object.keys(errors).length) { setFieldErrors(errors); return }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="card w-full max-w-sm" style={{ padding: '2rem' }}>
        <h2 className="text-3xl font-black text-white pixel-heading mb-6">Login</h2>

        {error && (
          <div className="border-2 border-pixel-red/50 bg-pixel-red/10 text-red-300 text-sm font-semibold rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field label="Email" type="email" value={email}
            onChange={v => handleChange('email', v, setEmail)}
            error={fieldErrors.email} maxLength={254} />
          <Field label="Password" type="password" value={password}
            onChange={v => handleChange('password', v, setPassword)}
            error={fieldErrors.password} maxLength={72} />
          <button type="submit" disabled={loading} className="btn btn-primary w-full text-base mt-2">
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-5 text-center font-semibold">
          No account?{' '}
          <button onClick={onSwitchToRegister} className="text-pixel-blue hover:underline font-black">Register</button>
        </p>
        <button onClick={onClose} className="mt-3 w-full text-xs text-gray-600 hover:text-gray-400 font-semibold transition">
          Cancel
        </button>
      </div>
    </div>
  )
}

function Field({ label, type, value, onChange, error, maxLength }) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        maxLength={maxLength} required
        autoComplete={type === 'password' ? 'current-password' : 'email'}
        className={`input ${error ? 'error' : ''}`}
      />
      {error && <p className="text-xs text-pixel-red font-semibold mt-1">{error}</p>}
    </div>
  )
}
