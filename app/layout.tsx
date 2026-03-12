import type { Metadata } from 'next'
import { Cinzel, Cormorant_Garamond, Space_Mono } from 'next/font/google'
import '@/frontend/styles/globals.css'
import { ANTI_FOUC_SCRIPT, ThemeProvider } from '@/frontend/context/ThemeContext'
import { AuthProvider } from '@/frontend/context/AuthContext'
import InkTransition from '@/frontend/components/ui/InkTransition'
import { FloatingAPLayer } from '@/frontend/components/ui/FloatingAP'
import DailyLoginRitual from '@/frontend/components/ui/DailyLoginRitual'

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600'],
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
  title: 'BungouArchive — 文豪アーカイブ',
  description: "A curated record of Yokohama's ability users. The city determines where you belong.",
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
            <FloatingAPLayer />
            <DailyLoginRitual />
            <InkTransition>{children}</InkTransition>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
