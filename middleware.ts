import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook(.*)'
])

const isRootRoute = createRouteMatcher(['/'])

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()
  
  // Root route: redirect based on auth status
  if (isRootRoute(request)) {
    if (userId) {
      // Authenticated → redirect to dashboard
      return Response.redirect(new URL('/dashboard', request.url))
    } else {
      // Not authenticated → redirect to sign-in
      return Response.redirect(new URL('/sign-in', request.url))
    }
  }
  
  // Protect all non-public routes
  if (!isPublicRoute(request)) {
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
