import type { ReactNode } from 'react'

export default function BuyerAccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bi-bg)' }}>
      <header
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: 'var(--bi-border)', background: 'var(--bi-surface)' }}
      >
        <span
          className="text-sm font-medium tracking-wide uppercase"
          style={{ color: 'var(--bi-muted)', letterSpacing: '0.08em' }}
        >
          My Profile
        </span>
        <span className="text-xs" style={{ color: 'var(--bi-muted)' }}>
          Buyer account
        </span>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-10">{children}</main>
    </div>
  )
}
