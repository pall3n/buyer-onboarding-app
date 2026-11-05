'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/buyers', label: 'Buyers' },
  { href: '/properties', label: 'Properties' },
  { href: '/settings', label: 'Settings' },
]

export function AgencyShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[200px] flex-col border-r border-[var(--bi-line)] bg-[var(--bi-surface-soft)] md:flex">
        {/* Wordmark */}
        <div className="px-4 pb-4 pt-6">
          <span className="font-serif text-sm font-medium text-[var(--bi-ink)]">
            Hartfield &amp; Rowe
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-0.5">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center rounded-md px-3 py-2 text-sm transition-colors',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-[var(--bi-sage-pale)] font-medium text-[var(--bi-ink)]'
                  : 'text-[var(--bi-muted)] hover:bg-[var(--bi-sage-pale)] hover:text-[var(--bi-ink)]'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Agent identity */}
        <div className="border-t border-[var(--bi-line)] px-4 pb-6 pt-4">
          <p className="text-sm font-medium text-[var(--bi-ink)]">Sophie Lane</p>
          <p className="text-xs text-[var(--bi-muted)]">Senior negotiator</p>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col md:pl-[200px]">
        {children}
      </div>
    </div>
  )
}
