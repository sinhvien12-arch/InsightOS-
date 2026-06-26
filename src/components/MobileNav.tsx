'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, AlertTriangle, CircleDot, Zap, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/AuthContext'
import { useLang } from '@/lib/LangContext'
import { useRouter } from 'next/navigation'

const ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home',    labelVi: 'Trang chủ' },
  { href: '/alerts',    icon: AlertTriangle,   label: 'Alerts',  labelVi: 'Cảnh báo'  },
  { href: '/issues',    icon: CircleDot,       label: 'Issues',  labelVi: 'Vấn đề'    },
  { href: '/actions',   icon: Zap,             label: 'Actions', labelVi: 'Hành động'  },
] as const

export default function MobileNav() {
  const pathname = usePathname()
  const { user, isGuest, logout } = useAuth()
  const { lang, t } = useLang()
  const router = useRouter()
  const photo = user?.photoURL
  const name  = user?.displayName?.split(' ').slice(-1)[0] ?? 'Me'

  const isActive = (href: string) => pathname === href

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {ITEMS.map(({ href, icon: Icon, label, labelVi }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all min-w-[56px]',
                active ? 'text-primary-700' : 'text-slate-400',
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                active ? 'bg-primary-700 shadow-sm' : '',
              )}>
                <Icon size={18} className={active ? 'text-white' : ''} />
              </div>
              <span className="text-[10px] font-semibold">{lang === 'vi' ? labelVi : label}</span>
            </Link>
          )
        })}

        {/* Profile / Guest */}
        <button
          onClick={() => { logout(); router.push('/') }}
          className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-slate-400 min-w-[56px]"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden">
            {photo
              ? <img src={photo} alt={name} className="w-full h-full object-cover rounded-xl" />
              : <div className="w-full h-full bg-primary-100 flex items-center justify-center rounded-xl">
                  <User size={16} className="text-primary-700" />
                </div>
            }
          </div>
          <span className="text-[10px] font-semibold">
            {isGuest ? t('nav.exit') : t('nav.profile')}
          </span>
        </button>
      </div>
    </nav>
  )
}
