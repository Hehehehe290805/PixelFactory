# Backend — Supabase Edge Functions

Server-side code lives here. These run on Supabase's infrastructure, never in the user's browser.

## Why this folder exists
- The `SUPABASE_SERVICE_ROLE_KEY` (full DB access) is only available here — never in `src/`
- Server-side validation that clients cannot bypass
- Any future email sending (Brevo), webhooks, or admin operations go here

## Deploying

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy a function
supabase functions deploy validate-user
```

## Functions

| Function | Purpose |
|---|---|
| `validate-user` | Server-side username uniqueness check and input validation on registration |

## Secrets (set in Supabase dashboard)
Never put these in code:
- `SUPABASE_SERVICE_ROLE_KEY` — set via `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`
