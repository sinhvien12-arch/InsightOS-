'use client'

import { useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar   from './Sidebar'
import Header    from './Header'
import MobileNav from './MobileNav'
import DemoBadge from './ui/DemoBadge'

// Pages with content that doesn't change based on uploaded data
const DEMO_ROUTES = ['/ask-ai', '/reports', '/research']

export default function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const showDemoBadge = DEMO_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-0">
        <Header onMenuClick={() => setSidebarOpen(s => !s)} />
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 page-enter">
          {showDemoBadge && <DemoBadge />}
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
