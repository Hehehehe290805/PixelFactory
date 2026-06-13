import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { validateEmail, validatePassword, validateUsername, sanitizePlainText } from '../lib/validate'

export default function AccountSettings() {
  const navigate = useNavigate()
  const { user, profile, updateUsername, updateEmail, updatePassword, sendPasswordReset, requestAccountDeletion, logout, loading } = useUserStore()

  if (!user) {
    return (
      <div className="min-h-screen bg-game-bg flex items-center justify-center px-4">
        <div className="card text-center max-w-sm w-full" style={{ padding: '2rem' }}>
          <div className="text-4xl mb-3">🔒</div>
          <div className="text-lg font-black text-white mb-4">Not logged in</div>
          <Link to="/" className="btn btn-primary w-full">Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-game-bg">
      <div className="sticky top-0 z-10 px-4 pt-5 pb-3 border-b border-game-border" style={{ background: '#06061a' }}>
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <Link to="/" className="btn btn-secondary text-sm px-4 py-2">← Back</Link>
          <h1 className="text-3xl font-black text-white pixel-heading">Account</h1>
        </div>
      </div>
      <div className="px-4 py-6">
      <div className="max-w-lg mx-auto">

        {/* Current info */}
        <div className="card mb-6" style={{ padding: '1.25rem' }}>
          <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Current Account</div>
          <div className="space-y-1.5">
            <Row label="Username" value={profile?.username ?? '—'} />
            <Row label="Email" value={user.email ?? '—'} />
          </div>
        </div>

        <UpdateUsernameSection />
        <UpdateEmailSection />
        <UpdatePasswordSection />
        <ForgotPasswordSection email={user.email} />
        <DangerZone />
      </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-black text-white">{value}</span>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">{title}</h2>
      <div className="card" style={{ padding: '1.25rem' }}>{children}</div>
    </div>
  )
}

function StatusMsg({ type, msg }) {
  if (!msg) return null
  const ok = type === 'success'
  return (
    <div className={`rounded-xl px-3 py-2 text-sm font-semibold border-2 mt-3
      ${ok ? 'border-pixel-green/50 bg-pixel-green/10 text-green-300' : 'border-pixel-red/50 bg-pixel-red/10 text-red-300'}`}>
      {msg}
    </div>
  )
}

// ── Update Username ────────────────────────────────────────────────────────────
function UpdateUsernameSection() {
  const { updateUsername, loading } = useUserStore()
  const [value, setValue] = useState('')
  const [status, setStatus] = useState(null) // { type, msg }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validateUsername(value)
    if (err) { setStatus({ type: 'error', msg: err }); return }
    const clean = sanitizePlainText(value)
    const res = await updateUsername(clean)
    setStatus(res.error
      ? { type: 'error', msg: res.error }
      : { type: 'success', msg: 'Username updated!' })
    if (!res.error) setValue('')
  }

  return (
    <Section title="Change Username">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text" value={value} onChange={e => { setValue(e.target.value); setStatus(null) }}
          placeholder="New username (3–20 chars)" maxLength={20} className="input w-full"
        />
        <button type="submit" disabled={loading || !value.trim()} className="btn btn-secondary w-full text-sm">
          {loading ? 'Saving…' : 'Update Username'}
        </button>
        <StatusMsg {...(status ?? {})} />
      </form>
    </Section>
  )
}

// ── Update Email ───────────────────────────────────────────────────────────────
function UpdateEmailSection() {
  const { updateEmail, loading } = useUserStore()
  const [value, setValue] = useState('')
  const [status, setStatus] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validateEmail(value)
    if (err) { setStatus({ type: 'error', msg: err }); return }
    const res = await updateEmail(value.trim().toLowerCase())
    setStatus(res.error
      ? { type: 'error', msg: res.error }
      : { type: 'success', msg: 'Confirmation sent to your new email — click the link to confirm the change.' })
    if (!res.error) setValue('')
  }

  return (
    <Section title="Change Email">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email" value={value} onChange={e => { setValue(e.target.value); setStatus(null) }}
          placeholder="New email address" maxLength={254} className="input w-full"
        />
        <button type="submit" disabled={loading || !value.trim()} className="btn btn-secondary w-full text-sm">
          {loading ? 'Sending…' : 'Update Email'}
        </button>
        <StatusMsg {...(status ?? {})} />
      </form>
    </Section>
  )
}

// ── Update Password ────────────────────────────────────────────────────────────
function UpdatePasswordSection() {
  const { updatePassword, loading } = useUserStore()
  const [value, setValue] = useState('')
  const [status, setStatus] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validatePassword(value)
    if (err) { setStatus({ type: 'error', msg: err }); return }
    const res = await updatePassword(value)
    setStatus(res.error
      ? { type: 'error', msg: res.error }
      : { type: 'success', msg: 'Password updated successfully.' })
    if (!res.error) setValue('')
  }

  return (
    <Section title="Change Password">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password" value={value} onChange={e => { setValue(e.target.value); setStatus(null) }}
          placeholder="New password (8+ chars, upper + number + symbol)" maxLength={72}
          autoComplete="new-password" className="input w-full"
        />
        <button type="submit" disabled={loading || !value.trim()} className="btn btn-secondary w-full text-sm">
          {loading ? 'Saving…' : 'Update Password'}
        </button>
        <StatusMsg {...(status ?? {})} />
      </form>
    </Section>
  )
}

// ── Forgot Password (sends reset email) ───────────────────────────────────────
function ForgotPasswordSection({ email }) {
  const { sendPasswordReset, loading } = useUserStore()
  const [status, setStatus] = useState(null)

  async function handleSend() {
    const res = await sendPasswordReset(email)
    setStatus(res.error
      ? { type: 'error', msg: res.error }
      : { type: 'success', msg: `Password reset link sent to ${email}` })
  }

  return (
    <Section title="Forgot Password">
      <p className="text-sm text-gray-500 mb-3">
        Send a password reset link to <span className="text-white font-bold">{email}</span>.
      </p>
      <button onClick={handleSend} disabled={loading} className="btn btn-secondary w-full text-sm">
        {loading ? 'Sending…' : 'Send Reset Link'}
      </button>
      <StatusMsg {...(status ?? {})} />
    </Section>
  )
}

// ── Danger Zone — Delete Account ───────────────────────────────────────────────
function DangerZone() {
  const { requestAccountDeletion, logout, loading } = useUserStore()
  const navigate = useNavigate()
  const [confirmText, setConfirmText] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState(null)

  async function handleDelete() {
    if (confirmText !== 'permanently delete') return
    const res = await requestAccountDeletion()
    if (res.error) {
      setStatus({ type: 'error', msg: res.error })
    } else {
      navigate('/')
    }
  }

  return (
    <div className="mb-6">
      <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Danger Zone</h2>
      <div className="card border-pixel-red/40" style={{ padding: '1.25rem' }}>

        {/* Logout */}
        <button
          onClick={async () => { await logout(); navigate('/') }}
          className="btn btn-secondary w-full text-sm mb-4"
        >
          Sign Out
        </button>

        {/* Delete */}
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="btn btn-danger w-full text-sm"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              Your account will be scheduled for deletion. You have <span className="text-white font-black">30 days</span> to log back in and cancel.
              After 30 days it is permanently deleted.
            </p>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
              Type <span className="text-pixel-red">permanently delete</span> to confirm:
            </p>
            <input
              type="text" value={confirmText}
              onChange={e => { setConfirmText(e.target.value); setStatus(null) }}
              placeholder="permanently delete"
              className="input w-full"
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowConfirm(false); setConfirmText('') }} className="btn btn-secondary flex-1 text-sm">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== 'permanently delete' || loading}
                className="btn btn-danger flex-1 text-sm disabled:opacity-40"
              >
                {loading ? 'Processing…' : 'Confirm Delete'}
              </button>
            </div>
            <StatusMsg {...(status ?? {})} />
          </div>
        )}
      </div>
    </div>
  )
}
