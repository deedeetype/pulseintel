import { Webhook } from 'svix'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, svix-id, svix-timestamp, svix-signature',
  'Content-Type': 'application/json'
}

async function supabaseUpsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase upsert ${table}: ${res.status} ${text}`)
  }
  return res.json()
}

async function supabaseDelete(table, filter) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase delete ${table}: ${res.status} ${text}`)
  }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }
  
  if (event.httpMethod == 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'POST only' }) }
  }

  try {
    // Verify webhook signature
    const wh = new Webhook(CLERK_WEBHOOK_SECRET)
    const payload = wh.verify(event.body, {
      'svix-id': event.headers['svix-id'],
      'svix-timestamp': event.headers['svix-timestamp'],
      'svix-signature': event.headers['svix-signature'],
    }) as any

    console.log('Clerk webhook event:', payload.type, payload.data?.id)

    const eventType = payload.type
    const userData = payload.data

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

        // Upsert to Supabase users table
        await supabaseUpsert('users', {
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          username,
          avatar_url: imageUrl,
          created_at: createdAt,
          updated_at: updatedAt
        })

        console.log(`✅ User ${eventType === 'user.created' ? 'created' : 'updated'}: ${userId}`)
        break

      case 'user.deleted':
        // Delete from Supabase (CASCADE will handle related scans)
        const deletedUserId = userData.id
        await supabaseDelete('users', `id=eq.${deletedUserId}`)
        console.log(`✅ User deleted: ${deletedUserId}`)
        break

      default:
        console.log(`ℹ️ Unhandled event type: ${eventType}`)
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, eventType })
    }

  } catch (error) {
    console.error('Webhook error:', error)
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: error.message })
    }
  }
}
