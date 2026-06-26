'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth, provider } from './firebase'

interface AuthState {
  user:      User | null
  isGuest:   boolean
  loading:   boolean
  error:     string | null
  login:     () => Promise<void>
  loginAsGuest: () => void
  logout:    () => Promise<void>
}

const AuthCtx = createContext<AuthState>({
  user: null, isGuest: false, loading: true, error: null,
  login: async () => {}, loginAsGuest: () => {}, logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!auth) { setLoading(false); return }
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        if (u.email?.endsWith('@hsb.edu.vn')) {
          setUser(u)
          setIsGuest(false)
          setError(null)
        } else {
          signOut(auth)
          setUser(null)
          setError('Only @hsb.edu.vn accounts are allowed.')
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function login() {
    setError(null)
    try {
      await signInWithPopup(auth, provider)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
      if (code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized in Firebase. Contact your administrator.')
      } else if (code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site and try again.')
      } else {
        setError(`Sign-in failed (${code ?? 'unknown'}). Please try again.`)
      }
    }
  }

  function loginAsGuest() {
    setIsGuest(true)
    setError(null)
  }

  async function logout() {
    await signOut(auth)
    setUser(null)
    setIsGuest(false)
  }

  return (
    <AuthCtx.Provider value={{ user, isGuest, loading, error, login, loginAsGuest, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
