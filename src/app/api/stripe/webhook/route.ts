/**
 * Stripe Webhook Handler
 * Syncs Stripe events to Supabase (subscription created, updated, cancelled, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const clerkUserId = session.metadata?.clerk_user_id
  const plan = session.metadata?.plan || 'starter'

  if (!clerkUserId) {
    console.error('No clerk_user_id in session metadata')
    return
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  await upsertSubscription(clerkUserId, subscription, plan)
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const clerkUserId = subscription.metadata?.clerk_user_id
  const plan = subscription.metadata?.plan || 'starter'

  if (!clerkUserId) {
    console.error('No clerk_user_id in subscription metadata')
    return
  }

  await upsertSubscription(clerkUserId, subscription, plan)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const clerkUserId = subscription.metadata?.clerk_user_id

  if (!clerkUserId) {
    console.error('No clerk_user_id in subscription metadata')
    return
  }

  // Downgrade to free plan
  await supabase
    .from('user_subscriptions')
    .update({
      plan: 'free',
      status: 'cancelled',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', clerkUserId)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Payment succeeded, subscription should already be active
  console.log(`Payment succeeded for invoice ${invoice.id}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  const customer = await stripe.customers.retrieve(customerId)
  
  if ('metadata' in customer && customer.metadata?.clerk_user_id) {
    const clerkUserId = customer.metadata.clerk_user_id

    // Mark subscription as past_due
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', clerkUserId)
  }
}

async function upsertSubscription(
  clerkUserId: string,
  subscription: Stripe.Subscription,
  plan: string
) {
  const subscriptionData = {
    user_id: clerkUserId,
    plan: plan,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'user_id'
    })

  if (error) {
    console.error('Error upserting subscription:', error)
    throw error
  }

  console.log(`Subscription upserted for user ${clerkUserId}`)
}
