import { useState } from 'react'
import { useUserStore } from '../../store/userStore'
import { validateEmail } from '../../lib/validate'

export default function LoginModal({ onClose, onSwitchToRegister }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError]       = useState(null)   // local — never auto-cleared
  const [showForgot, setShowForgot] = useState(false)

  const { login, loading } = useUserStore()

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
    setError(null)

    const res = await login(email.trim().toLowerCase(), password)
    if (res.ok) {
      onClose()
    } else {
      setError(res.error ?? 'Login failed. Check your email and password.')
    }
  }

  if (showForgot) {
    return (
      <Modal>
        <ForgotPassword
          defaultEmail={email}
          onBack={() => setShowForgot(false)}
          onClose={onClose}
        />
      </Modal>
    )
  }

  return (
    <Modal>
      <h2 className="text-3xl font-black text-white pixel-heading mb-6">Login</h2>

      {error && (
        <div className="border-2 border-pixel-red/50 bg-pixel-red/10 text-red-300 text-sm font-semibold rounded-xl px-4 py-3 mb-4 leading-snug">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Email" type="email" value={email}
          onChange={v => { setEmail(v); setError(null) }}
          error={fieldErrors.email} maxLength={254} />
        <Field label="Password" type="password" value={password}
          onChange={v => { setPassword(v); setError(null) }}
          error={fieldErrors.password} maxLength={72} />
        <button type="submit" disabled={loading} className="btn btn-primary w-full text-base mt-2">
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <button
        onClick={() => setShowForgot(true)}
        className="mt-4 w-full text-xs text-pixel-blue hover:underline font-bold transition text-center"
      >
        Forgot password?
      </button>

      <p className="text-sm text-gray-500 mt-3 text-center font-semibold">
        No account?{' '}
        <button onClick={onSwitchToRegister} className="text-pixel-blue hover:underline font-black">Register</button>
      </p>
      <button onClick={onClose} className="mt-3 w-full text-xs text-gray-600 hover:text-gray-400 font-semibold transition">
        Cancel
      </button>
    </Modal>
  )
}

// ── Forgot password inline step ────────────────────────────────────────────────
function ForgotPassword({ defaultEmail, onBack, onClose }) {
  const [email, setEmail]   = useState(defaultEmail ?? '')
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState(null)
  const { sendPasswordReset, loading } = useUserStore()

  async function handleSend(e) {
    e.preventDefault()
    const err = validateEmail(email)
    if (err) { setError(err); return }
    setError(null)
    const res = await sendPasswordReset(email.trim().toLowerCase())
    if (res.error) {
      setError(res.error)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <>
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📧</div>
          <h2 className="text-2xl font-black text-white mb-2">Check your email</h2>
          <p className="text-sm text-gray-400">
            We sent a password reset link to <span className="text-white font-bold">{email}</span>.
          </p>
        </div>
        <button onClick={onClose} className="btn btn-primary w-full text-base">Done</button>
      </>
    )
  }

  return (
    <>
      <button onClick={onBack} className="text-xs font-bold text-gray-500 hover:text-gray-300 mb-5 flex items-center gap-1 transition">
        ← Back to login
      </button>
      <h2 className="text-2xl font-black text-white pixel-heading mb-2">Reset Password</h2>
      <p className="text-sm text-gray-500 mb-5">Enter your email and we'll send you a reset link.</p>

      {error && (
        <div className="border-2 border-pixel-red/50 bg-pixel-red/10 text-red-300 text-sm font-semibold rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-4" noValidate>
        <Field label="Email" type="email" value={email}
          onChange={v => { setEmail(v); setError(null) }}
          maxLength={254} />
        <button type="submit" disabled={loading} className="btn btn-primary w-full text-base">
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
    </>
  )
}

// ── Shared wrappers ────────────────────────────────────────────────────────────
function Modal({ children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="card w-full max-w-sm" style={{ padding: '2rem' }}>
        {children}
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
