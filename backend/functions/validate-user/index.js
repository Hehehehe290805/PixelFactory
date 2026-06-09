// Supabase Edge Function: validate-user
// Handles server-side validation before profile creation.
// Deploy:  supabase functions deploy validate-user
// Secrets: supabase secrets set --env-file backend/.env

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { username, email } = await req.json()

    // Server-side validation — client cannot bypass this
    const usernameError = validateUsername(username)
    if (usernameError) {
      return new Response(JSON.stringify({ error: usernameError }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const emailError = validateEmail(email)
    if (emailError) {
      return new Response(JSON.stringify({ error: emailError }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Check username uniqueness via service role (never exposed to client)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), // only available server-side
    )

    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .maybeSingle()

    if (data) {
      return new Response(JSON.stringify({ error: 'Username already taken' }), {
        status: 409, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})

function validateUsername(username) {
  if (typeof username !== 'string') return 'Username must be a string'
  const trimmed = username.trim()
  if (trimmed.length < 3 || trimmed.length > 20) return 'Username must be 3–20 characters'
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return 'Username can only contain letters, numbers, _ and -'
  return null
}

function validateEmail(email) {
  if (typeof email !== 'string') return 'Email must be a string'
  const trimmed = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Invalid email address'
  if (trimmed.length > 254) return 'Email too long'
  return null
}
