'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLang } from '@/lib/LangContext'
import { useLiveData } from '@/lib/useLiveData'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, AlertTriangle, MapPin, Brain,
  FlaskConical, BarChart3, BookOpen, Info, X, Coffee,
  CircleDot, Zap, FileText, Cpu,
} from 'lucide-react'

const NAV_PRIMARY = [
  { key: 'nav.dashboard',      href: '/dashboard',       Icon: LayoutDashboard },
  { key: 'nav.feedbackEngine', href: '/feedback-engine', Icon: Cpu             },
  { key: 'nav.alerts',         href: '/alerts',          Icon: AlertTriangle   },
  { key: 'nav.issues',         href: '/issues',          Icon: CircleDot       },
  { key: 'nav.actions',        href: '/actions',         Icon: Zap             },
] as const

const NAV_ANALYTICS = [
  { key: 'nav.branches',  href: '/branches',   Icon: MapPin          },
  { key: 'nav.aiCenter',  href: '/ai-center',  Icon: Brain           },
  { key: 'nav.simulator', href: '/simulator',  Icon: FlaskConical    },
  { key: 'nav.analytics', href: '/analytics',  Icon: BarChart3       },
  { key: 'nav.reports',   href: '/reports',    Icon: FileText        },
] as const

const NAV_INFO = [
  { key: 'nav.research',  href: '/research',   Icon: BookOpen        },
  { key: 'nav.about',     href: '/about',      Icon: Info            },
] as const

type NavItem = { key: string; href: string; Icon: React.ElementType }

interface SidebarProps {
  open:    boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { t, lang } = useLang()
  const vi = lang === 'vi'
  const { mode, chainStats } = useLiveData()
  const isLive = mode === 'live'

  const isActive = (href: string) => {
    if (href === '/branches') return pathname.startsWith('/branch')
    if (href === '/ai-center') return pathname === '/ai-center' || pathname === '/ask-ai' || pathname === '/recommendations'
    return pathname === href
  }

  function NavLink({ navKey, href, Icon }: { navKey: string; href: string; Icon: React.ElementType }) {
    const active = isActive(href)
    return (
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
          active
            ? 'bg-primary-700 text-white shadow-sm'
            : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900',
        )}
      >
        <Icon size={17} className={active ? 'text-white' : 'text-slate-400'} />
        {t(navKey as Parameters<typeof t>[0])}
      </Link>
    )
  }

  function NavGroup({ label, items }: { label: string; items: readonly NavItem[] }) {
    return (
      <div>
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        <div className="space-y-0.5">
          {items.map(({ key, href, Icon }) => (
            <NavLink key={href} navKey={key} href={href} Icon={Icon} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 z-40 flex flex-col',
        'bg-white border-r border-gray-100 shadow-xl',
        'transition-transform duration-300 ease-in-out',
        'lg:translate-x-0 lg:shadow-none lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="w-8 h-8 rounded-xl bg-primary-700 flex items-center justify-center text-white shadow-sm">
              <Coffee size={16} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 leading-tight">Phê La</div>
              <div className="text-[10px] text-primary-600 font-semibold tracking-wide uppercase">InsightOS</div>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-slate-400">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          <NavGroup label={vi ? 'Vận hành' : 'Operations'}  items={NAV_PRIMARY}   />
          <NavGroup label={vi ? 'Phân tích' : 'Intelligence'} items={NAV_ANALYTICS} />
          <NavGroup label={vi ? 'Thông tin' : 'Info'}        items={NAV_INFO}      />

        </nav>

        {/* Status footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[10px] text-slate-500 font-medium">
              {isLive
                ? (vi ? `Trực tiếp · ${chainStats.totalReviews} đánh giá` : `Live · ${chainStats.totalReviews} reviews`)
                : (vi ? 'Dữ liệu mẫu' : 'Demo data')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary-50 flex items-center justify-center">
              <span className="text-xs">☕</span>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-700">Phê La Chain</div>
              <div className="text-[10px] text-slate-400">{vi ? '5 chi nhánh · Hà Nội' : '5 branches · Hanoi'}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
