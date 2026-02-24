import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook(.*)'
])

const isRootRoute = createRouteMatcher(['/'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  
  // Root route: redirect based on auth status
  if (isRootRoute(req)) {
    if (userId) {
      // Authenticated → redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url))
    } else {
      // Not authenticated → redirect to sign-in
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
  }
  
  // Protect all non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
