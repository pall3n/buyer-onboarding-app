// Demo seed: Hartfield & Rowe agency with fictional buyers and properties
// All UUIDs are fixed for reproducibility; all entities are fictional demo data

export const AGENCY = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Hartfield & Rowe',
  slug: 'hartfield-rowe',
}

// Estate agents at Hartfield & Rowe
export const AGENTS = [
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Sophie Lane',
    email: 'sophie.lane@hartfieldrowe.demo.invalid',
    role: 'negotiator',
  },
]

// Buyers invited by the agency
export const BUYERS = [
  {
    id: '00000000-0000-0000-0000-000000000010',
    name: 'Maya Reid',
    email: 'maya.reid@demo.invalid',
    // Budget: £650k–£800k; 3+ beds; walkability to town + countryside; character property;
    // secure private garden (Bramble the dog); will trade space for location;
    // kitchen renovation acceptable
  },
  {
    id: '00000000-0000-0000-0000-000000000011',
    name: 'James Reid',
    email: 'james.reid@demo.invalid',
    // Jointly searching with Maya Reid
  },
  {
    id: '00000000-0000-0000-0000-000000000013',
    name: 'Amara Osei',
    email: 'amara.osei@demo.invalid',
    // Budget: £375k–£450k; 2 beds; station access; natural light; no garden needed
  },
]

// Sample properties (fictional)
export const PROPERTIES = [
  {
    id: '00000000-0000-0000-0000-000000000020',
    address: 'Larkfield House',
    postcode: 'TN15 7PQ',
    // £725,000 Victorian semi; strong lifestyle fit; small third room;
    // shared side passage and rear fence security UNKNOWN
  },
  {
    id: '00000000-0000-0000-0000-000000000021',
    address: '4 Ashgrove Place',
    postcode: 'TN13 2DH',
    // More specification; overlooked garden conflicts with Reids' essential privacy preference
  },
  {
    id: '00000000-0000-0000-0000-000000000022',
    address: 'Flat 3 Calverley Court',
    postcode: 'TN1 1YE',
    // Suited to Amara: light + commute; service charge UNKNOWN
  },
]
