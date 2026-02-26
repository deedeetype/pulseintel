import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

export async function POST(req: Request) {
  if (!CLERK_WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Verify webhook signature
  const wh = new Webhook(CLERK_WEBHOOK_SECRET)
  let evt: any

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    })
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const eventType = evt.type
  const userData = evt.data

  console.log('Clerk webhook event:', eventType, userData?.id)

  try {
    switch (eventType) {
      case 'user.created':
      case 'user.updated':
        // Extract user data
        const userId = userData.id
        const email = userData.email_addresses?.[0]?.email_address
        const firstName = userData.first_name
        const lastName = userData.last_name
        const username = userData.username
        const imageUrl = userData.image_url
        const createdAt = new Date(userData.created_at).toISOString()
        const updatedAt = new Date(userData.updated_at).toISOString()

        // Upsert to Supabase users table (only fields that exist in schema)
        // Use resolution=merge-duplicates with on_conflict to properly handle updates
        const res = await fetch(`${SUPABASE_URL}/rest/v1/users?on_conflict=clerk_id`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY!,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          },
          body: JSON.stringify({
            clerk_id: userId,
            email,
            name: `${firstName || ''} ${lastName || ''}`.trim() || username || email,
            created_at: createdAt
          })
        })

        if (!res.ok) {
          const text = await res.text()
          console.error('Supabase upsert failed:', res.status, text)
          // Don't fail on 409 (conflict) - it means user already exists which is fine
          if (res.status !== 409) {
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
          }
          console.log('ℹ️ User already exists (409), continuing...')
        }

        console.log(`✅ User ${eventType === 'user.created' ? 'created' : 'updated'}: ${userId}`)
        break

      case 'user.deleted':
        // Delete from Supabase (CASCADE will handle related scans)
        const deletedUserId = userData.id
        const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/users?clerk_id=eq.${deletedUserId}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_KEY!,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          }
        })

        if (!deleteRes.ok) {
          console.error('Supabase delete failed:', deleteRes.status)
        }

        console.log(`✅ User deleted: ${deletedUserId}`)
        break

      default:
        console.log(`ℹ️ Unhandled event type: ${eventType}`)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
