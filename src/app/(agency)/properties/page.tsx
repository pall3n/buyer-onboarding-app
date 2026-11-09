import Link from 'next/link'
import { requireAgentAuth } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase/admin'
import { DEMO_PROPERTIES, DEMO_NAV_IDS } from '@/lib/demo-data'

interface PropertyRow {
  id: string
  addressLine1: string
  postcode: string
  askingPrice: number
  status: string
}

async function loadProperties(agencyId: string): Promise<PropertyRow[]> {
  const admin = getAdminClient()
  const { data } = await admin
    .from('properties')
    .select('id, address_line1, postcode, asking_price, status')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })

  return (data ?? []).map(row => ({
    id: row.id as string,
    addressLine1: row.address_line1 as string,
    postcode: row.postcode as string,
    askingPrice: row.asking_price as number,
    status: row.status as string,
  }))
}

function formatPrice(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(pence / 100)
}

export default async function PropertiesPage() {
  const agent = await requireAgentAuth()
  const properties = await loadProperties(agent.agencyId)

  // Merge in demo properties for the demo agency so the shortlist demo path works
  const isDemo = properties.length === 0
  const demoRows: PropertyRow[] = isDemo
    ? [
        {
          id: DEMO_NAV_IDS.propLarkfield,
          addressLine1: 'Larkfield House',
          postcode: 'TN15 7PQ',
          askingPrice: 72500000,
          status: 'active',
        },
        {
          id: DEMO_NAV_IDS.propAshgrove,
          addressLine1: '4 Ashgrove Place',
          postcode: 'TN13 2DH',
          askingPrice: 68500000,
          status: 'active',
        },
        {
          id: 'demo-prop-calverley',
          addressLine1: 'Flat 3 Calverley Court',
          postcode: 'TN1 1YE',
          askingPrice: 42000000,
          status: 'active',
        },
      ]
    : []

  const rows = isDemo ? demoRows : properties

  return (
    <div className="min-h-screen bg-[var(--bi-background)]">
      <div className="px-6 py-8 max-w-4xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl text-[var(--bi-ink)]">Properties</h1>
            <p className="mt-1 text-sm text-[var(--bi-muted)]">
              {rows.length} {rows.length === 1 ? 'listing' : 'listings'}
              {isDemo ? ' (demo)' : ''}
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-[var(--bi-line)] p-8 text-center">
            <p className="text-sm text-[var(--bi-muted)]">No properties added yet.</p>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-[var(--bi-line)] rounded-xl border border-[var(--bi-line)] bg-[var(--bi-surface)]">
            {rows.map((prop) => (
              <div
                key={prop.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[var(--bi-ink)] truncate">
                    {prop.addressLine1}
                  </p>
                  <p className="text-sm text-[var(--bi-muted)]">
                    {prop.postcode} · {formatPrice(prop.askingPrice)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={[
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      prop.status === 'active'
                        ? 'bg-[var(--bi-sage-light)] text-[var(--bi-sage)]'
                        : 'bg-[var(--bi-line)] text-[var(--bi-muted)]',
                    ].join(' ')}
                  >
                    {prop.status}
                  </span>
                  <Link
                    href={`/properties/${prop.id}/shortlist`}
                    className="rounded-lg border border-[var(--bi-line)] bg-white px-3 py-1.5 text-sm text-[var(--bi-ink)] transition-colors hover:border-[var(--bi-sage)] hover:text-[var(--bi-sage)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bi-sage)]"
                  >
                    View shortlist →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
