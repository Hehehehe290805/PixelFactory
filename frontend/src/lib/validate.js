// Input validation and sanitization for all user-facing forms.
// React already prevents XSS by escaping JSX output, but we also strip
// dangerous characters before they touch Supabase or state.

const HTML_CHARS = /[<>"'`]/g
const SCRIPT_TAGS = /<\/?script\b[^>]*>/gi
const NULL_BYTES = /\0/g

export function sanitizeString(value) {
  if (typeof value !== 'string') return ''
  return value
    .replace(NULL_BYTES, '')
    .replace(SCRIPT_TAGS, '')
    .replace(HTML_CHARS, (c) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c]))
    .trim()
    .slice(0, 500) // hard cap — no field needs more than 500 chars
}

// Use for values that must be plain text with no HTML encoding needed (like usernames)
export function sanitizePlainText(value) {
  if (typeof value !== 'string') return ''
  return value
    .replace(NULL_BYTES, '')
    .replace(HTML_CHARS, '')
    .trim()
    .slice(0, 200)
}

// Password: 8–72 chars, at least one uppercase, one lowercase, one digit, one special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};:'",.<>?/\\|`~]).{8,72}$/

export function validatePassword(password) {
  if (typeof password !== 'string') return 'Password must be a string'
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (password.length > 72) return 'Password must be at most 72 characters'
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must include uppercase, lowercase, a number, and a special character'
  }
  return null
}

// Email: basic RFC-ish validation, no HTML
const EMAIL_REGEX = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/

export function validateEmail(email) {
  if (typeof email !== 'string') return 'Email must be a string'
  const cleaned = email.trim().toLowerCase()
  if (cleaned.length > 254) return 'Email is too long'
  if (!EMAIL_REGEX.test(cleaned)) return 'Invalid email address'
  return null
}

// Username: alphanumeric + underscore + hyphen, 3–20 chars
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/

export function validateUsername(username) {
  if (typeof username !== 'string') return 'Username must be a string'
  const cleaned = sanitizePlainText(username)
  if (!USERNAME_REGEX.test(cleaned)) {
    return 'Username must be 3–20 characters: letters, numbers, _ or -'
  }
  return null
}
