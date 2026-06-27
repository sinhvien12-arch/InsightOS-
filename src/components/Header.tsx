'use client'

import { useState } from 'react'
import { Menu, Bell, ChevronDown, LogOut, ArrowRight, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useLang } from '@/lib/LangContext'
import { useLiveData } from '@/lib/useLiveData'
import { alerts as demoAlerts } from '@/data/alerts'
import { useRouter } from 'next/navigation'

const SEVERITY_DOT: Record<string, string> = {
  High:   'bg-red-500',
  Medium: 'bg-amber-400',
  Low:    'bg-emerald-400',
}

const SEVERITY_LABEL_VI: Record<string, string> = {
  High: 'Cao', Medium: 'Trung bình', Low: 'Thấp',
}

function timeAgo(iso: string, vi: boolean): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1)   return vi ? 'Vừa xong' : 'Just now'
  if (diff < 60)  return vi ? `${diff} phút trước` : `${diff}m ago`
  const h = Math.floor(diff / 60)
  if (h < 24)    return vi ? `${h} giờ trước` : `${h}h ago`
  return vi ? `${Math.floor(h / 24)} ngày trước` : `${Math.floor(h / 24)}d ago`
}

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout }  = useAuth()
  const { lang, setLang, t } = useLang()
  const router            = useRouter()
  const vi                = lang === 'vi'
  const [userOpen,  setUserOpen]  = useState(false)
  const [bellOpen,  setBellOpen]  = useState(false)

  const { mode, alerts: liveAlerts } = useLiveData()
  const isLive   = mode === 'live'
  const alerts   = (isLive && liveAlerts.length > 0) ? liveAlerts : demoAlerts
  const topAlerts = alerts.slice(0, 4)
  const highCount = alerts.filter(a => a.severity === 'High').length

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
          <div className="relative">
            <button
              onClick={() => { setBellOpen(o => !o); setUserOpen(false) }}
              className="relative p-2 rounded-xl hover:bg-gray-100 text-slate-500 transition-colors"
            >
              <Bell size={18} />
              {highCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {highCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setBellOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl z-20 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-500" />
                      <span className="text-sm font-bold text-slate-800">
                        {vi ? 'Cảnh báo' : 'Alerts'}
                      </span>
                      {highCount > 0 && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                          {highCount} {vi ? 'khẩn' : 'urgent'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isLive ? (vi ? 'Trực tiếp' : 'Live') : (vi ? 'Mẫu' : 'Demo')}
                    </span>
                  </div>

                  {/* Alert list */}
                  <div className="divide-y divide-gray-50">
                    {topAlerts.map(alert => (
                      <button
                        key={alert.id}
                        onClick={() => { setBellOpen(false); router.push(alert.actionRoute) }}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${SEVERITY_DOT[alert.severity]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">
                            {vi ? (alert.titleVi ?? alert.title) : alert.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-bold ${
                              alert.severity === 'High'   ? 'text-red-500' :
                              alert.severity === 'Medium' ? 'text-amber-500' : 'text-emerald-600'
                            }`}>
                              {vi ? SEVERITY_LABEL_VI[alert.severity] : alert.severity}
                            </span>
                            <span className="text-[10px] text-slate-400">{timeAgo(alert.timestamp, vi)}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Footer */}
                  <button
                    onClick={() => { setBellOpen(false); router.push('/alerts') }}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold text-primary-700 hover:bg-primary-50 transition-colors border-t border-gray-50"
                  >
                    {vi ? `Xem tất cả ${alerts.length} cảnh báo` : `View all ${alerts.length} alerts`}
                    <ArrowRight size={12} />
                  </button>
                </div>
              </>
            )}
          </div>

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
