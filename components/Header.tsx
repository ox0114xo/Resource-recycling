'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, MapPin, PlusCircle, Settings } from 'lucide-react'
import { clsx } from 'clsx'

const NAV = [
  { href: '/',        icon: BarChart2,  label: '行情看板' },
  { href: '/map',     icon: MapPin,     label: '地圖找場' },
  { href: '/report',  icon: PlusCircle, label: '回報價格' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur border-b border-surface-border">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center
                          group-hover:bg-brand-500 transition-colors">
            <span className="text-white font-mono font-bold text-xs">♻</span>
          </div>
          <span className="font-mono font-bold text-sm tracking-tight">
            RecyclePrice<span className="text-brand-500">.tw</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                pathname === href
                  ? 'bg-surface-muted text-brand-400 font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-surface-muted'
              )}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>

      </div>
    </header>
  )
}
