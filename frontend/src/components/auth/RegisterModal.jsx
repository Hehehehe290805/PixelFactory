import { useState, useEffect } from 'react'
import { useUserStore } from '../../store/userStore'
import { sanitizePlainText, validateEmail, validatePassword, validateUsername } from '../../lib/validate'

const OTP_TTL = 600 // 10 minutes — must match Supabase Auth → Settings → OTP Expiry

export default function RegisterModal({ onClose, onSwitchToLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError]       = useState(null)   // local — never auto-cleared by the store
  const [pendingEmail, setPendingEmail] = useState(null) // set after signUp needs OTP

  const { register, loading } = useUserStore()

  function validate() {
    const errors = {}
    const uErr = validateUsername(username)
    if (uErr) errors.username = uErr
    const eErr = validateEmail(email)
    if (eErr) errors.email = eErr
    const pErr = validatePassword(password)
    if (pErr) errors.password = pErr
    return errors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length) { setFieldErrors(errors); return }
    setFieldErrors({})
    setError(null)

    const res = await register(email.trim().toLowerCase(), password, sanitizePlainText(username))
    if (res.ok === 'confirm_email') {
      setPendingEmail(email.trim().toLowerCase())
    } else if (res.ok) {
      onClose()
    } else {
      setError(res.error ?? 'Registration failed. Please try again.')
    }
  }

  // OTP verification step
  if (pendingEmail) {
    return (
      <Modal>
        <OtpStep
          email={pendingEmail}
          onSuccess={onClose}
          onBack={() => setPendingEmail(null)}
        />
      </Modal>
    )
  }

  return (
    <Modal>
      <h2 className="text-3xl font-black text-white pixel-heading mb-6">Register</h2>

      {error && (
        <div className="border-2 border-pixel-red/50 bg-pixel-red/10 text-red-300 text-sm font-semibold rounded-xl px-4 py-3 mb-4 leading-snug">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Username" type="text" value={username}
          onChange={v => { setUsername(v); setError(null) }}
          error={fieldErrors.username} placeholder="3–20 chars" maxLength={20} />
        <Field label="Email" type="email" value={email}
          onChange={v => { setEmail(v); setError(null) }}
          error={fieldErrors.email} maxLength={254} />
        <Field label="Password" type="password" value={password}
          onChange={v => { setPassword(v); setError(null) }}
          error={fieldErrors.password} placeholder="8+ chars, upper + number + symbol" maxLength={72} />
        <button type="submit" disabled={loading} className="btn btn-primary w-full text-base mt-2">
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-sm text-gray-500 mt-5 text-center font-semibold">
        Have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-pixel-blue hover:underline font-black">Login</button>
      </p>
      <button onClick={onClose} className="mt-3 w-full text-xs text-gray-600 hover:text-gray-400 font-semibold transition">
        Cancel
      </button>
    </Modal>
  )
}

// ── OTP verification step ──────────────────────────────────────────────────────
function OtpStep({ email, onSuccess, onBack }) {
  const [code, setCode]         = useState('')
  const [error, setError]       = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(OTP_TTL)
  const [canResend, setCanResend]     = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60) // 60s before first resend

  const { verifyEmail, resendVerification, loading } = useUserStore()

  // Main countdown: 10-minute OTP lifetime
  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(t); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // Resend cooldown: 60s after page load (or after each resend)
  useEffect(() => {
    if (resendCooldown <= 0) { setCanResend(true); return }
    const t = setInterval(() => {
      setResendCooldown(s => {
        if (s <= 1) { clearInterval(t); setCanResend(true); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function fmt(s) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  }

  async function handleVerify(e) {
    e.preventDefault()
    if (code.length !== 6) { setError('Enter the 6-digit code from your email.'); return }
    setError(null)
    const res = await verifyEmail(email, code.trim())
    if (res.ok) {
      onSuccess()
    } else {
      setError(res.error ?? 'Invalid or expired code. Try again.')
    }
  }

  async function handleResend() {
    if (!canResend) return
    setCanResend(false)
    setResendCooldown(60)
    setSecondsLeft(OTP_TTL)
    setCode('')
    setError(null)

    const res = await resendVerification(email)
    if (res.error) setError(res.error)

    // Restart resend cooldown
    const t = setInterval(() => {
      setResendCooldown(s => {
        if (s <= 1) { clearInterval(t); setCanResend(true); return 0 }
        return s - 1
      })
    }, 1000)
  }

  const expired = secondsLeft === 0

  return (
    <>
      <button onClick={onBack} className="text-xs font-bold text-gray-500 hover:text-gray-300 mb-5 flex items-center gap-1 transition">
        ← Back
      </button>

      <div className="text-center mb-6">
        <div className="text-4xl mb-3">📨</div>
        <h2 className="text-2xl font-black text-white mb-1">Check your email</h2>
        <p className="text-sm text-gray-400 leading-snug">
          We sent a <span className="text-white font-bold">6-digit code</span> to{' '}
          <span className="text-pixel-blue font-bold">{email}</span>
        </p>
      </div>

      {error && (
        <div className="border-2 border-pixel-red/50 bg-pixel-red/10 text-red-300 text-sm font-semibold rounded-xl px-4 py-3 mb-4 leading-snug">
          {error}
        </div>
      )}

      {expired ? (
        <div className="border-2 border-pixel-yellow/40 bg-pixel-yellow/10 text-pixel-yellow text-sm font-semibold rounded-xl px-4 py-3 mb-4 text-center">
          Code expired — request a new one below.
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4 mb-2" noValidate>
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-1.5">
              Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(null) }}
              placeholder="000000"
              maxLength={6}
              className="input text-center text-2xl font-black tracking-[0.4em]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="btn btn-primary w-full text-base disabled:opacity-40"
          >
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </form>
      )}

      {/* Countdown + resend */}
      <div className="flex items-center justify-between mt-3">
        <span className={`text-xs font-bold ${expired ? 'text-pixel-red' : secondsLeft < 60 ? 'text-pixel-yellow' : 'text-gray-600'}`}>
          {expired ? 'Expired' : `Expires in ${fmt(secondsLeft)}`}
        </span>
        <button
          onClick={handleResend}
          disabled={!canResend || loading}
          className={`text-xs font-black transition ${canResend ? 'text-pixel-blue hover:underline' : 'text-gray-700 cursor-not-allowed'}`}
        >
          {canResend ? 'Resend code' : `Resend in ${resendCooldown}s`}
        </button>
      </div>
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

function Field({ label, type, value, onChange, error, placeholder, maxLength }) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength} required
        autoComplete={type === 'password' ? 'new-password' : undefined}
        className={`input ${error ? 'error' : ''}`}
      />
      {error && <p className="text-xs text-pixel-red font-semibold mt-1">{error}</p>}
    </div>
  )
}
