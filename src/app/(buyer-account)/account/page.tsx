import { revalidatePath } from 'next/cache'
import { requireBuyerAccountAuth } from '@/lib/auth/index'
import { loadGrantsForBuyer, revokeGrant } from '@/features/buyer-account/index'
import { DEMO_BUYER_GRANTS } from '@/lib/demo-data'
import type { BuyerGrant } from '@/features/buyer-account/index'

type Props = {
  params: Promise<Record<string, never>>
  searchParams: Promise<{ demo?: string | string[] }>
}

async function revokeAction(shareId: string) {
  'use server'
  if (shareId.startsWith('demo-')) return
  // Resolve identity from the auth session — never accept it as an external parameter
  const buyer = await requireBuyerAccountAuth()
  await revokeGrant(shareId, buyer.authUserId)
  revalidatePath('/account')
}

function StatusBadge({ status }: { status: BuyerGrant['status'] }) {
  const styles: Record<BuyerGrant['status'], { bg: string; text: string; label: string }> = {
    active: { bg: '#d1fae5', text: '#065f46', label: 'Active' },
    revoked: { bg: '#fee2e2', text: '#991b1b', label: 'Revoked' },
    pending: { bg: '#fef3c7', text: '#92400e', label: 'Pending' },
  }
  const s = styles[status]
  return (
    <span
      className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}

function GrantRow({
  grant,
  isDemo,
}: {
  grant: BuyerGrant
  isDemo: boolean
}) {
  const versionDate = grant.approvedVersionDate
    ? new Date(grant.approvedVersionDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'

  const grantedDate = new Date(grant.grantedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const boundRevoke = revokeAction.bind(null, grant.shareId)

  return (
    <div
      className="rounded-xl p-5 flex items-start justify-between gap-4"
      style={{
        background: 'var(--bi-surface)',
        border: '1px solid var(--bi-border)',
        opacity: grant.status === 'revoked' ? 0.6 : 1,
      }}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium" style={{ color: 'var(--bi-ink)' }}>
            {grant.agencyName}
          </span>
          <StatusBadge status={grant.status} />
        </div>
        <div className="text-sm" style={{ color: 'var(--bi-muted)' }}>
          {grant.approvedVersionId
            ? `Profile version approved ${versionDate}`
            : 'No approved version shared'}
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--bi-muted)' }}>
          {grant.status === 'revoked' && grant.revokedAt
            ? `Revoked ${new Date(grant.revokedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
            : `Shared since ${grantedDate}`}
        </div>
      </div>

      {grant.status === 'active' && (
        <form action={boundRevoke}>
          <button
            type="submit"
            disabled={isDemo}
            className="text-sm px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: '#fca5a5',
              color: '#dc2626',
              background: 'transparent',
            }}
            title={isDemo ? 'Revocation is disabled in demo mode' : undefined}
          >
            Revoke access
          </button>
        </form>
      )}
    </div>
  )
}

export default async function BuyerAccountPage(props: Props) {
  const searchParams = await props.searchParams
  const rawDemo = Array.isArray(searchParams.demo) ? searchParams.demo[0] : searchParams.demo
  const isDemo = rawDemo === '1'

  let grants: BuyerGrant[]

  if (isDemo) {
    grants = DEMO_BUYER_GRANTS
  } else {
    const buyer = await requireBuyerAccountAuth()
    grants = await loadGrantsForBuyer(buyer.authUserId)
  }

  const activeGrants = grants.filter(g => g.status === 'active')
  const revokedGrants = grants.filter(g => g.status !== 'active')

  return (
    <div className="flex flex-col gap-8">
      {isDemo && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            color: '#78350f',
          }}
        >
          <strong>Demo view.</strong> No real buyer data is shown. Revoke buttons are disabled.
        </div>
      )}

      <div>
        <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--bi-ink)' }}>
          Connected agencies
        </h1>
        <p className="text-sm" style={{ color: 'var(--bi-muted)' }}>
          These agencies have access to your approved profile. You can revoke access at any time.
        </p>
      </div>

      {/* Active grants */}
      {activeGrants.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--bi-muted)' }}>
            Active ({activeGrants.length})
          </h2>
          {activeGrants.map(g => (
            <GrantRow key={g.shareId} grant={g} isDemo={isDemo} />
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl px-5 py-8 text-center text-sm"
          style={{
            background: 'var(--bi-surface)',
            border: '1px solid var(--bi-border)',
            color: 'var(--bi-muted)',
          }}
        >
          No agencies are currently connected.
        </div>
      )}

      {/* Revoked grants (collapsed history) */}
      {revokedGrants.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--bi-muted)' }}>
            Revoked ({revokedGrants.length})
          </h2>
          {revokedGrants.map(g => (
            <GrantRow key={g.shareId} grant={g} isDemo={isDemo} />
          ))}
        </div>
      )}

      {/* What agencies can and cannot see */}
      <div
        className="rounded-xl px-5 py-4 text-sm"
        style={{ background: 'var(--bi-surface)', border: '1px solid var(--bi-border)' }}
      >
        <h3 className="font-medium mb-2" style={{ color: 'var(--bi-ink)' }}>
          What agencies see
        </h3>
        <ul className="flex flex-col gap-1" style={{ color: 'var(--bi-muted)' }}>
          <li>✓ The profile version you approved — your preferences and priorities</li>
          <li>✓ The date you approved that version</li>
        </ul>
        <h3 className="font-medium mt-4 mb-2" style={{ color: 'var(--bi-ink)' }}>
          What agencies cannot see
        </h3>
        <ul className="flex flex-col gap-1" style={{ color: 'var(--bi-muted)' }}>
          <li>✗ Notes from other agencies about you</li>
          <li>✗ Your profile as shared with other agencies</li>
          <li>✗ Viewing briefs, analyses, or CRM records from other agencies</li>
          <li>✗ Any versions you have not approved</li>
        </ul>
      </div>

      {/* Somewhere integration note */}
      <div
        className="rounded-xl px-5 py-4 text-sm"
        style={{ background: 'var(--bi-surface)', border: '1px solid var(--bi-border)' }}
      >
        <h3 className="font-medium mb-1" style={{ color: 'var(--bi-ink)' }}>
          Somewhere integration
        </h3>
        <p style={{ color: 'var(--bi-muted)' }}>
          Connecting to Somewhere is a separate consent decision, independent of these agency
          grants. If you have connected, that is managed separately and does not affect what
          agencies above can see.
        </p>
      </div>
    </div>
  )
}
