import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Phê La InsightOS — AI Operations Copilot',
  description: 'AI-Powered Customer Experience & Operations Intelligence Platform for Phê La coffee chain.',
  icons: { icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">☕</text></svg>' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
