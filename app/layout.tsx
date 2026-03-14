import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Cinzel, Cormorant_Garamond, Space_Mono } from 'next/font/google'
import dynamic from 'next/dynamic'
import '@/frontend/styles/globals.css'
import { ANTI_FOUC_SCRIPT, ThemeProvider } from '@/frontend/context/ThemeContext'
import { AuthProvider } from '@/frontend/context/AuthContext'
import { AngoProvider } from '@/frontend/context/AngoContext'
import { SoundProvider } from '@/frontend/context/SoundContext'
import { Nav } from '@/frontend/components/ui/Nav'
import { Footer } from '@/frontend/components/ui/Footer'
import InkTransition from '@/frontend/components/ui/InkTransition'
import { FloatingAPLayer } from '@/frontend/components/ui/FloatingAP'

// Lazy-load heavy widgets to prioritize initial page load / interactivity
const DailyLoginRitual = dynamic(() => import('@/frontend/components/ui/DailyLoginRitual'), { ssr: false })
const GuideBotWidget = dynamic(() => import('@/frontend/components/guide-bot/GuideBotWidget').then(mod => mod.GuideBotWidget), { ssr: false })
const CharacterAssignmentRedirect = dynamic(() => import('@/frontend/components/profile/CharacterAssignmentRedirect').then(mod => mod.CharacterAssignmentRedirect), { ssr: false })
const GlobalDuelMatchmaker = dynamic(() => import('@/frontend/components/duels/GlobalDuelMatchmaker').then(mod => mod.GlobalDuelMatchmaker), { ssr: false })

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  weight: ['400', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BungouArchive - 文豪アーカイブ',
  description:
    "A curated record of Yokohama's ability users. The city determines where you belong.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${cinzel.variable} ${cormorant.variable} ${spaceMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FOUC_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <AngoProvider>
              <SoundProvider>
                <FloatingAPLayer />
                <DailyLoginRitual />
                <CharacterAssignmentRedirect />
                <GlobalDuelMatchmaker />
                <Suspense fallback={null}>
                  <Nav />
                </Suspense>
                <main style={{ minHeight: '100vh', paddingTop: '60px' }}>
                  {children}
                </main>
                <Footer />
                <Suspense fallback={null}>
                  <GuideBotWidget />
                </Suspense>
              </SoundProvider>
            </AngoProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
