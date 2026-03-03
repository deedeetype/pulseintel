/**
 * useSubscription Hook
 * Fetches and manages user subscription state
 */

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { getUserPlan, getSubscriptionInfo, PlanName } from '@/lib/subscription'

export function useSubscription() {
  const { user } = useUser()
  const [plan, setPlan] = useState<PlanName>('free')
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubscription() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const [userPlan, subInfo] = await Promise.all([
          getUserPlan(user.id),
          getSubscriptionInfo(user.id)
        ])

        setPlan(userPlan)
        setSubscription(subInfo)
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user?.id])

  return {
    plan,
    subscription,
    loading,
    isFreePlan: plan === 'free',
    isPaidPlan: plan !== 'free'
  }
}
