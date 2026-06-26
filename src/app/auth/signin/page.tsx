'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useLang } from '@/lib/LangContext'
import { Coffee } from 'lucide-react'

export default function SignInPage() {
  const { user, loading, error, login } = useAuth()
  const { lang, setLang } = useLang()
  const router = useRouter()
  const [signing, setSigning] = useState(false)
  const vi = lang === 'vi'

  // Redirect to upload once authenticated
  useEffect(() => {
    if (!loading && user) router.replace('/upload')
  }, [user, loading, router])

  async function handleSignIn() {
    setSigning(true)
    await login()
    setSigning(false)
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-600 via-teal-500 to-teal-700 flex items-center justify-center p-4">
      {/* Lang switcher top-right */}
      <div className="fixed top-4 right-4 flex items-center gap-0.5 bg-white/20 backdrop-blur-sm rounded-lg p-0.5">
        {(['en', 'vi'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all ${
              lang === l ? 'bg-white text-teal-700 shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg">
              <Coffee size={24} className="text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 text-center mb-1">
            {vi ? 'Đăng nhập' : 'Sign In'}
          </h1>
          <p className="text-sm text-slate-500 text-center mb-8">
            InsightOS · Phê Lá Coffee
          </p>

          {/* Google Sign-In Button */}
          <button
            onClick={handleSignIn}
            disabled={signing}
            className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50 text-slate-700 font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" className="flex-shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {signing
              ? (vi ? 'Đang đăng nhập…' : 'Signing in…')
              : (vi ? 'Đăng nhập Google HSB' : 'Sign in with Google HSB')}
          </button>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <p className="text-center text-xs text-slate-400 mt-6">
            {vi ? 'Chỉ tài khoản ' : 'Only '}
            <span className="font-semibold">@hsb.edu.vn</span>
            {vi ? ' được phép đăng nhập' : ' accounts are allowed'}
          </p>
        </div>

        {/* Back link */}
        <button
          onClick={() => router.push('/')}
          className="mt-4 w-full text-center text-sm text-teal-100 hover:text-white transition-colors"
        >
          {vi ? '← Về trang chủ' : '← Back to Home'}
        </button>
      </div>
    </div>
  )
}
