/**
 * Subscription & Usage Management
 * Handles plan limits, usage tracking, and subscription status
 */

import { createSupabaseClient } from './supabase'

// Plan definitions
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    profiles: 1,
    refreshAuto: false,
    refreshManual: 0,
    competitors: 10,
    historyDays: 7,
    features: {
      export: false,
      emailAlerts: false,
      weeklyDigest: false,
      slackWebhook: false,
      customWatchlist: false,
      apiAccess: false
    }
  },
  starter: {
    name: 'Starter',
    price: 15,
    profiles: 1,
    refreshAuto: true, // Daily
    refreshManual: 1, // Per day
    competitors: 10,
    historyDays: 30,
    features: {
      export: false,
      emailAlerts: false,
      weeklyDigest: false,
      slackWebhook: false,
      customWatchlist: false,
      apiAccess: false
    }
  },
  pro: {
    name: 'Professional',
    price: 49,
    profiles: 3,
    refreshAuto: true, // Daily
    refreshManual: 999, // "Unlimited"
    competitors: 30,
    historyDays: 90,
    features: {
      export: true,
      emailAlerts: true,
      weeklyDigest: false,
      slackWebhook: false,
      customWatchlist: true,
      apiAccess: false
    }
  },
  business: {
    name: 'Business',
    price: 99,
    profiles: 10,
    refreshAuto: true, // Daily
    refreshManual: 999, // "Unlimited"
    competitors: 100,
    historyDays: 999999, // "Unlimited"
    features: {
      export: true,
      emailAlerts: true,
      weeklyDigest: true,
      slackWebhook: true,
      customWatchlist: true,
      apiAccess: false
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 299,
    profiles: 999,
    refreshAuto: true,
    refreshManual: 999,
    competitors: 999,
    historyDays: 999999,
    features: {
      export: true,
      emailAlerts: true,
      weeklyDigest: true,
      slackWebhook: true,
      customWatchlist: true,
      apiAccess: true
    }
  }
} as const

export type PlanName = keyof typeof PLANS

// Get user's current plan
export async function getUserPlan(userId: string, token?: string): Promise<PlanName> {
  try {
    const supabase = createSupabaseClient(token)
    
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .single()
    
    if (error || !data) {
      return 'free'
    }
    
    // If subscription is cancelled or past_due, downgrade to free
    if (data.status !== 'active' && data.status !== 'trialing') {
      return 'free'
    }
    
    return data.plan as PlanName
  } catch (error) {
    console.error('Error getting user plan:', error)
    return 'free'
  }
}

// Get plan limits
export function getPlanLimits(plan: PlanName) {
  return PLANS[plan] || PLANS.free
}

// Get current month usage
export async function getMonthlyUsage(userId: string, token?: string) {
  try {
    const supabase = createSupabaseClient(token)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const { data, error } = await supabase
      .from('usage_tracking')
      .select('action')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())
    
    if (error) {
      console.error('Error getting usage:', error)
      return { refresh_manual: 0, refresh_auto: 0, scans: 0 }
    }
    
    const usage = {
      refresh_manual: data?.filter(u => u.action === 'refresh_manual').length || 0,
      refresh_auto: data?.filter(u => u.action === 'refresh_auto').length || 0,
      scans: data?.filter(u => u.action === 'scan').length || 0
    }
    
    return usage
  } catch (error) {
    console.error('Error getting monthly usage:', error)
    return { refresh_manual: 0, refresh_auto: 0, scans: 0 }
  }
}

// Get today's usage (for daily limits)
export async function getTodayUsage(userId: string, token?: string) {
  try {
    const supabase = createSupabaseClient(token)
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    
    const { data, error } = await supabase
      .from('usage_tracking')
      .select('action')
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString())
    
    if (error) {
      console.error('Error getting today usage:', error)
      return { refresh_manual: 0 }
    }
    
    return {
      refresh_manual: data?.filter(u => u.action === 'refresh_manual').length || 0
    }
  } catch (error) {
    console.error('Error getting today usage:', error)
    return { refresh_manual: 0 }
  }
}

// Count active profiles
export async function countActiveProfiles(userId: string, token?: string): Promise<number> {
  try {
    const supabase = createSupabaseClient(token)
    
    const { count, error } = await supabase
      .from('scans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
    
    if (error) {
      console.error('Error counting profiles:', error)
      return 0
    }
    
    return count || 0
  } catch (error) {
    console.error('Error counting profiles:', error)
    return 0
  }
}

// Check if user can create a new profile
export async function canCreateProfile(userId: string, token?: string): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getUserPlan(userId, token)
  const limits = getPlanLimits(plan)
  const activeCount = await countActiveProfiles(userId, token)
  
  if (activeCount >= limits.profiles) {
    return {
      allowed: false,
      reason: `You've reached your plan limit of ${limits.profiles} profile${limits.profiles > 1 ? 's' : ''}. Upgrade to track more industries.`
    }
  }
  
  return { allowed: true }
}

// Check if user can refresh (manual)
export async function canRefreshManual(userId: string, token?: string): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getUserPlan(userId, token)
  const limits = getPlanLimits(plan)
  
  if (plan === 'free') {
    return {
      allowed: false,
      reason: 'Manual refresh is not available on the Free plan. Upgrade to Starter ($15/mois) to get daily auto-refresh.'
    }
  }
  
  // For starter plan, check daily limit
  if (plan === 'starter') {
    const todayUsage = await getTodayUsage(userId, token)
    if (todayUsage.refresh_manual >= limits.refreshManual) {
      return {
        allowed: false,
        reason: `You've used your ${limits.refreshManual} manual refresh${limits.refreshManual > 1 ? 'es' : ''} for today. Try again tomorrow or upgrade to Pro for unlimited.`
      }
    }
  }
  
  return { allowed: true }
}

// Track usage
export async function trackUsage(
  userId: string, 
  action: 'scan' | 'refresh_auto' | 'refresh_manual', 
  profileId?: string,
  metadata?: Record<string, any>,
  token?: string
) {
  try {
    const supabase = createSupabaseClient(token)
    
    const { error } = await supabase
      .from('usage_tracking')
      .insert({
        user_id: userId,
        action,
        profile_id: profileId,
        metadata: metadata || null
      })
    
    if (error) {
      console.error('Error tracking usage:', error)
    }
  } catch (error) {
    console.error('Error tracking usage:', error)
  }
}

// Get subscription info
export async function getSubscriptionInfo(userId: string, token?: string) {
  try {
    const supabase = createSupabaseClient(token)
    
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error getting subscription info:', error)
    return null
  }
}
