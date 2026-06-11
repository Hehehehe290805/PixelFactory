import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { ACHIEVEMENTS } from '../engine/achievementEngine'

export const useUserStore = create((set, get) => ({
  user: null,
  profile: null,
  gold: 0,
  achievements: new Set(),
  campaignProgress: {},
  cumulativeGreedyGold: 0,
  quizStats: { correct: 0, total: 0 },
  unlockedDesigns: [],      // array of designId strings, persisted to DB
  discoveredSynergies: [],  // array of synergy IDs, persisted to DB
  endlessMinutes: 0,
  loading: false,
  error: null,
  toastQueue: [],

  async initialize() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) await get().loadProfile(session.user)

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) await get().loadProfile(session.user)
      else set({ user: null, profile: null, gold: 0, achievements: new Set(), unlockedDesigns: [] })
    })
  },

  async loadProfile(authUser) {
    set({ user: authUser, loading: true })

    const [profileRes, achievementsRes, progressRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', authUser.id).single(),
      supabase.from('achievements').select('achievement_key').eq('user_id', authUser.id),
      supabase.from('campaign_progress').select('*').eq('user_id', authUser.id),
    ])

    if (profileRes.error) { set({ error: profileRes.error.message, loading: false }); return }

    // If the account was pending delete, cancel it now that they've logged in
    if (profileRes.data?.delete_requested_at) {
      await supabase.from('profiles').update({ delete_requested_at: null }).eq('id', authUser.id)
      profileRes.data.delete_requested_at = null
    }

    const unlockedKeys = new Set((achievementsRes.data ?? []).map(r => r.achievement_key))
    const progress = {}
    for (const row of (progressRes.data ?? [])) {
      progress[row.level_number] = { stars: row.stars, best_time_seconds: row.best_time_seconds }
    }

    const unlockedDesigns    = profileRes.data.unlocked_designs     ?? []
    const discoveredSynergies = profileRes.data.discovered_synergies ?? []

    set({
      profile: profileRes.data,
      gold: profileRes.data.gold,
      achievements: unlockedKeys,
      campaignProgress: progress,
      quizStats: { correct: profileRes.data.quiz_correct ?? 0, total: profileRes.data.quiz_total ?? 0 },
      unlockedDesigns,
      discoveredSynergies,
      endlessMinutes: profileRes.data.endless_minutes ?? 0,
      loading: false,
    })
  },

  // ── Registration ────────────────────────────────────────────────────────────
  // Username is passed via auth metadata so the DB trigger can create the profile
  // even before email confirmation (no active session yet).
  // Supabase must be configured to send OTP codes (not magic links):
  //   Auth → Providers → Email → enable "Email OTP"
  //   Auth → Settings → OTP Expiry = 600 (10 minutes)
  async register(email, password, username) {
    set({ loading: true, error: null })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) { set({ loading: false }); return { ok: false, error: error.message } }

    // Email confirmation required — an OTP was sent to the email address
    if (!data.session) {
      set({ loading: false })
      return { ok: 'confirm_email' }
    }

    await get().loadProfile(data.user)
    return { ok: true }
  },

  // Verify the 6-digit OTP that Supabase emailed after signUp
  async verifyEmail(email, token) {
    set({ loading: true })
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' })
    if (error) { set({ loading: false }); return { ok: false, error: error.message } }
    if (data.user) await get().loadProfile(data.user)
    return { ok: true }
  },

  // Resend the verification OTP
  async resendVerification(email) {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    return { error: error?.message ?? null }
  },

  async login(email, password) {
    set({ loading: true, error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { set({ loading: false }); return { ok: false, error: error.message } }
    await get().loadProfile(data.user)
    return { ok: true }
  },

  async logout() {
    await supabase.auth.signOut()
    set({ user: null, profile: null, gold: 0, achievements: new Set(), campaignProgress: {}, unlockedDesigns: [], endlessMinutes: 0 })
  },

  // ── Profile CRUD ───────────────────────────────────────────────────────────
  async updateUsername(newUsername) {
    const state = get()
    if (!state.user) return { error: 'Not logged in' }
    set({ loading: true, error: null })
    const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', state.user.id)
    if (error) { set({ error: error.message, loading: false }); return { error: error.message } }
    set({ profile: { ...state.profile, username: newUsername }, loading: false })
    return { error: null }
  },

  async updateEmail(newEmail) {
    set({ loading: true, error: null })
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) { set({ error: error.message, loading: false }); return { error: error.message } }
    set({ loading: false })
    return { error: null }
  },

  async updatePassword(newPassword) {
    set({ loading: true, error: null })
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { set({ error: error.message, loading: false }); return { error: error.message } }
    set({ loading: false })
    return { error: null }
  },

  async sendPasswordReset(email) {
    set({ loading: true, error: null })
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/PixelFactory/reset-password`,
    })
    if (error) { set({ error: error.message, loading: false }); return { error: error.message } }
    set({ loading: false })
    return { error: null }
  },

  // Marks the account for deletion (pending 30 days). Actual hard-delete is
  // handled by the pg_cron job in schema.sql.
  async requestAccountDeletion() {
    const state = get()
    if (!state.user) return { error: 'Not logged in' }
    set({ loading: true, error: null })
    const { error } = await supabase
      .from('profiles')
      .update({ delete_requested_at: new Date().toISOString() })
      .eq('id', state.user.id)
    if (error) { set({ error: error.message, loading: false }); return { error: error.message } }
    set({ loading: false })
    // Sign out after marking for deletion
    await get().logout()
    return { error: null }
  },

  clearError() { set({ error: null }) },

  async addGold(amount) {
    const state = get()
    const newGold = Math.max(0, state.gold + amount)
    set({ gold: newGold })
    if (state.user) {
      await supabase.from('profiles').update({ gold: newGold }).eq('id', state.user.id)
    }
  },

  async saveCampaignProgress(levelNumber, stars, bestTimeSeconds) {
    const state = get()
    const current = state.campaignProgress[levelNumber]
    if (current && current.stars >= stars) return

    const newProgress = { ...state.campaignProgress, [levelNumber]: { stars, best_time_seconds: bestTimeSeconds } }
    set({ campaignProgress: newProgress })

    if (state.user) {
      await supabase.from('campaign_progress').upsert({
        user_id: state.user.id, level_number: levelNumber, stars, best_time_seconds: bestTimeSeconds,
      })
    }
  },

  // Only unlocks achievements when logged in
  async unlockAchievements(keys) {
    if (!keys.length) return
    const state = get()
    if (!state.user) return  // achievements require login
    const newKeys = keys.filter(k => !state.achievements.has(k))
    if (!newKeys.length) return

    const newSet = new Set([...state.achievements, ...newKeys])
    const toasts = newKeys.map(k => ({ key: k, ...ACHIEVEMENTS[k] }))
    set({ achievements: newSet, toastQueue: [...state.toastQueue, ...toasts] })

    await supabase.from('achievements').upsert(
      newKeys.map(k => ({ user_id: state.user.id, achievement_key: k }))
    )
  },

  dismissToast() {
    set(s => ({ toastQueue: s.toastQueue.slice(1) }))
  },

  addCumulativeGreedyGold(amount) {
    set(s => ({ cumulativeGreedyGold: s.cumulativeGreedyGold + amount }))
  },

  // Unlock a design by id; persists to DB
  async unlockDesign(designId) {
    const state = get()
    if (state.unlockedDesigns.includes(designId)) return
    const next = [...state.unlockedDesigns, designId]
    set({ unlockedDesigns: next })
    if (state.user) {
      await supabase.from('profiles').update({ unlocked_designs: next }).eq('id', state.user.id)
    }
  },

  // Unlock multiple designs at once (e.g. starters at tutorial completion)
  async unlockDesigns(designIds) {
    const state = get()
    const toAdd = designIds.filter(id => !state.unlockedDesigns.includes(id))
    if (!toAdd.length) return
    const next = [...state.unlockedDesigns, ...toAdd]
    set({ unlockedDesigns: next })
    if (state.user) {
      await supabase.from('profiles').update({ unlocked_designs: next }).eq('id', state.user.id)
    }
  },

  // Mark a synergy as discovered (triggered in-game for the first time)
  async discoverSynergy(synergyId) {
    const state = get()
    if (state.discoveredSynergies.includes(synergyId)) return
    const next = [...state.discoveredSynergies, synergyId]
    set({ discoveredSynergies: next })
    if (state.user) {
      await supabase.from('profiles').update({ discovered_synergies: next }).eq('id', state.user.id)
    }
  },

  // Reveal a synergy via shop scroll (same result as discover)
  async revealSynergy(synergyId) {
    return get().discoverSynergy(synergyId)
  },

  // Track endless minutes for 20-min design unlock
  addEndlessMinutes(minutes) {
    set(s => {
      const next = s.endlessMinutes + minutes
      if (s.user) {
        supabase.from('profiles').update({ endless_minutes: next }).eq('id', s.user.id)
      }
      return { endlessMinutes: next }
    })
  },

  async saveQuizResult(wasCorrect) {
    const state = get()
    const newCorrect = state.quizStats.correct + (wasCorrect ? 1 : 0)
    const newTotal   = state.quizStats.total + 1
    set({ quizStats: { correct: newCorrect, total: newTotal } })
    if (state.user) {
      await supabase.from('profiles').update({ quiz_correct: newCorrect, quiz_total: newTotal }).eq('id', state.user.id)
    }
  },

  // Saves the run only if it beats the current personal best. Returns true if new highscore.
  async saveEndlessScore(highestWave, totalPixelsProduced) {
    const state = get()
    if (!state.user || !state.profile) return false

    const { data: best } = await supabase
      .from('endless_scores')
      .select('highest_wave')
      .eq('user_id', state.user.id)
      .order('highest_wave', { ascending: false })
      .limit(1)
      .maybeSingle()

    const prevBest = best?.highest_wave ?? 0
    if (highestWave <= prevBest) return false  // not a highscore

    await supabase.from('endless_scores').insert({
      user_id: state.user.id,
      username: state.profile.username,
      highest_wave: highestWave,
      total_pixels_produced: totalPixelsProduced,
    })
    return true
  },

  // ── Endless run save/resume ─────────────────────────────────────────────────

  async saveEndlessRun({ wave, grandTotal, grid, inventory }) {
    const { user } = get()
    if (!user) return
    await supabase.from('endless_saves').upsert({
      user_id:    user.id,
      wave,
      grand_total: grandTotal,
      grid:        JSON.stringify(grid),
      inventory:   JSON.stringify(inventory),
      saved_at:    new Date().toISOString(),
    }, { onConflict: 'user_id' })
  },

  async loadEndlessRun() {
    const { user } = get()
    if (!user) return null
    const { data } = await supabase
      .from('endless_saves')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!data) return null
    return {
      wave:        data.wave,
      grand_total: data.grand_total,
      grid:        typeof data.grid === 'string' ? JSON.parse(data.grid) : data.grid,
      inventory:   typeof data.inventory === 'string' ? JSON.parse(data.inventory) : data.inventory,
    }
  },

  async deleteEndlessRun() {
    const { user } = get()
    if (!user) return
    await supabase.from('endless_saves').delete().eq('user_id', user.id)
  },
}))
