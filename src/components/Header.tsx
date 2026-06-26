'use client'

import { useState } from 'react'
import { Menu, Bell, ChevronDown, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useLang } from '@/lib/LangContext'
import { branches } from '@/data/branches'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout }  = useAuth()
  const { lang, setLang, t } = useLang()
  const router            = useRouter()
  const [userOpen, setUserOpen] = useState(false)

  const name  = user?.displayName?.split(' ').slice(-1)[0] ?? 'Manager'
  const photo = user?.photoURL

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: hamburger + greeting */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-slate-500"
          >
            <Menu size={20} />
          </button>
          <div className="hidden sm:block min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate">
              {t('header.greeting')}, {name} 👋
            </div>
            <div className="text-xs text-slate-400">
              {new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Lang switcher */}
          <div className="hidden sm:flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {(['en', 'vi'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all ${
                  lang === l
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-xl hover:bg-gray-100 text-slate-500 transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserOpen(!userOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt={name} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary-700 text-white flex items-center justify-center text-xs font-bold">
                  {name[0]}
                </div>
              )}
              <span className="hidden md:block text-sm font-medium text-slate-700">{name}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {userOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl border border-gray-100 shadow-xl z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <div className="text-sm font-semibold text-slate-800 truncate">{user?.displayName}</div>
                    <div className="text-xs text-slate-400 truncate">{user?.email}</div>
                  </div>
                  <button
                    onClick={() => { logout(); router.push('/') }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    {t('header.signOut')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
