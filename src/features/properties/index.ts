import { getAdminClient } from '@/lib/supabase/admin'

export interface PropertyFact {
  category: string
  key: string
  typedValue: unknown
  verificationState: 'verified' | 'unverified' | 'needs_check'
  sourceNote: string | null
}

export interface PropertyRecord {
  id: string
  addressLine1: string
  postcode: string
  askingPrice: number  // pence
  revision: number
}

export async function loadPropertyWithFacts(
  propertyId: string
): Promise<{ property: PropertyRecord; facts: PropertyFact[] } | null> {
  const admin = getAdminClient()

  const { data: property } = await admin
    .from('properties')
    .select('id, address_line1, postcode, asking_price, revision')
    .eq('id', propertyId)
    .single()

  if (!property) return null

  const { data: factRows } = await admin
    .from('property_facts')
    .select('id, category, key, typed_value, verification_state, property_fact_sources(note, url)')
    .eq('property_id', propertyId)

  const facts: PropertyFact[] = (factRows ?? []).map(row => {
    const sources = row.property_fact_sources as Array<{ note: string | null; url: string | null }> | null
    const firstSource = sources?.[0]
    const sourceNote = firstSource?.note ?? firstSource?.url ?? null
    const rawValue = row.typed_value as { value?: unknown } | null
    return {
      category: row.category as string,
      key: row.key as string,
      typedValue: rawValue?.value ?? null,
      verificationState: (row.verification_state ?? 'unverified') as PropertyFact['verificationState'],
      sourceNote,
    }
  })

  return {
    property: {
      id: property.id as string,
      addressLine1: property.address_line1 as string,
      postcode: property.postcode as string,
      askingPrice: property.asking_price as number,
      revision: property.revision as number,
    },
    facts,
  }
}
