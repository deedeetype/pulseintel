import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { AlertsProvider } from '@/contexts/AlertsContext'
import { NewsFeedProvider } from '@/contexts/NewsFeedContext'
import { ClerkProvider } from '@clerk/nextjs'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'PulseIntel - AI-Powered Competitive Intelligence',
  description: 'AI-powered competitive intelligence platform that aggregates market signals and transforms them into actionable strategic insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en" className="dark">
        <body className={`${inter.variable} font-sans antialiased`}>
          <SettingsProvider>
            <AlertsProvider>
              <NewsFeedProvider>
                {children}
              </NewsFeedProvider>
            </AlertsProvider>
          </SettingsProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
