/**
 * Stripe Checkout Session
 * Creates a payment session for a subscription plan
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

// Price IDs for each plan (you'll need to create these in Stripe Dashboard)
const PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER || 'price_starter',
  pro: process.env.STRIPE_PRICE_PRO || 'price_pro',
  business: process.env.STRIPE_PRICE_BUSINESS || 'price_business',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise'
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await req.json()
    
    if (!plan || !PRICE_IDS[plan as keyof typeof PRICE_IDS]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS]

    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({
      limit: 1,
      email: userId // Using Clerk userId as identifier
    })

    let customerId: string

    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        metadata: {
          clerk_user_id: userId
        }
      })
      customerId = customer.id
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://wyzelens.com'}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://wyzelens.com'}/pricing?subscription=cancelled`,
      metadata: {
        clerk_user_id: userId,
        plan: plan
      },
      subscription_data: {
        metadata: {
          clerk_user_id: userId,
          plan: plan
        }
      }
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
