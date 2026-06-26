'use client'

import { AuthProvider } from '@/lib/AuthContext'
import { LangProvider } from '@/lib/LangContext'
import { ReactNode } from 'react'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LangProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </LangProvider>
  )
}
