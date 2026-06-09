import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useUserStore = create((set, get) => ({
  user: null,          // Supabase auth user
  profile: null,       // profiles table row
  gold: 0,
  templates: [],
  achievements: [],
  campaignProgress: {},
  loading: false,
  error: null,

  async initialize() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await get().loadProfile(session.user)
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await get().loadProfile(session.user)
      } else {
        set({ user: null, profile: null, gold: 0 })
      }
    })
  },

  async loadProfile(authUser) {
    set({ user: authUser, loading: true })
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (error) {
      set({ error: error.message, loading: false })
    } else {
      set({ profile: data, gold: data.gold, loading: false })
    }
  },

  async register(email, password, username) {
    set({ loading: true, error: null })
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { set({ error: error.message, loading: false }); return false }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: data.user.id, username, gold: 0 })

    if (profileError) { set({ error: profileError.message, loading: false }); return false }

    await get().loadProfile(data.user)
    return true
  },

  async login(email, password) {
    set({ loading: true, error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { set({ error: error.message, loading: false }); return false }
    await get().loadProfile(data.user)
    return true
  },

  async logout() {
    await supabase.auth.signOut()
    set({ user: null, profile: null, gold: 0, templates: [], achievements: [] })
  },

  clearError() {
    set({ error: null })
  },

  async addGold(amount) {
    const state = get()
    const newGold = state.gold + amount
    set({ gold: newGold })
    if (state.user) {
      await supabase.from('profiles').update({ gold: newGold }).eq('id', state.user.id)
    }
  },

  async saveCampaignProgress(levelNumber, stars, bestTimeSeconds) {
    const state = get()
    const current = state.campaignProgress[levelNumber]
    if (current && current.stars >= stars) return

    const newProgress = {
      ...state.campaignProgress,
      [levelNumber]: { stars, best_time_seconds: bestTimeSeconds },
    }
    set({ campaignProgress: newProgress })

    if (state.user) {
      await supabase.from('campaign_progress').upsert({
        user_id: state.user.id,
        level_number: levelNumber,
        stars,
        best_time_seconds: bestTimeSeconds,
      })
    }
  },
}))
