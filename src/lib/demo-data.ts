// Demo data layer for M1 UI shell.
// Separate from seed/demo.ts (DB seed). Used only for client-side rendering.
// All entities are fictional demo data; no real names or properties.

// ─── Fixed navigation IDs ──────────────────────────────────────────────────

export const DEMO_NAV_IDS = {
  buyerMaya: 'demo-buyer-maya',
  buyerAmara: 'demo-buyer-amara',
  propLarkfield: 'demo-prop-larkfield',
  propAshgrove: 'demo-prop-ashgrove',
  briefLarkfield: 'demo-brief-larkfield',
  convMaya: 'demo-conv-maya',
  inviteMaya: 'demo-invite-maya',
} as const

// ─── Shared types ──────────────────────────────────────────────────────────

export type TrustStatus = 'confirmed' | 'suggested' | 'unknown' | 'conflict'

export interface ConversationTurn {
  role: 'ai' | 'buyer'
  text: string
  timestamp: string
}

export interface QuickFact {
  label: string
  value: string
  status: TrustStatus
}

export interface PriorityItem {
  label: string
  detail: string
  status: TrustStatus
  evidence: string
}

export interface ColourSwatch {
  name: string
  hex: string
}

export interface TradeOff {
  leftLabel: string
  rightLabel: string
  /** 0 = strongly left, 100 = strongly right */
  position: number
  note: string
}

export interface BuyerProfile {
  id: string
  displayName: string
  status: string
  briefDate: string
  approvedTimeAgo: string
  conversationDuration: string
  buyingPosition: string
  quickFacts: QuickFact[]
  topPriorities: PriorityItem[]
  dealbreakers: string[]
  lifestyleSignals: string[]
  colourTaste: ColourSwatch[]
  /** 0–100; higher = more willing to renovate */
  renovationFlexibilityPct: number
  tradeOffs: TradeOff[]
  inTheirWords: string
  inTheirWordsAttribution: string
}

export interface ImportanceItem {
  text: string
  importance: 'essential' | 'preferred' | 'flexible'
}

export interface HomeBriefData {
  buyerName: string
  subtitleDate: string
  conversationDuration: string
  nutshell: string
  nonNegotiables: ImportanceItem[]
  thingsIdLove: ImportanceItem[]
  idealLifestyle: string[]
  styleSwatches: ColourSwatch[]
  renovationsToConsider: string[]
}

export interface FitItem {
  label: string
  detail: string
  status: TrustStatus
  source: string
}

export interface PropertyFitData {
  propertyName: string
  propertyAddress: string
  propertyPrice: string
  propertyVerdict: TrustStatus
  strongMatches: FitItem[]
  compromises: FitItem[]
  conflicts: FitItem[]
  unknowns: FitItem[]
  worthAsking: string[]
}

export interface ViewingBriefSection {
  heading: string
  body: string | string[]
}

export interface ViewingBriefData {
  buyerName: string
  propertyName: string
  propertyAddress: string
  agentName: string
  agencyName: string
  preparedDate: string
  conversationDuration: string
  sections: ViewingBriefSection[]
}

export interface ViewingBriefDraftJson {
  version: 1
  profileVersionId: string
  propertyRevision: number
  generatedAt: string
  buyerName: string
  propertyName: string
  propertyAddress: string
  propertyPrice: string
  agentName: string
  agencyName: string
  buyerSnapshot: string
  whatTheyCareAbout: string[]
  wontConsider: string[]
  whyItMaySuit: string
  threeThingsToShow: Array<{ title: string; description: string }>
  localEvidence: Array<{ label: string; status: TrustStatus; source: string }>
  beUpfrontAbout: Array<{ title: string; description: string }>
  checkBeforeViewing: Array<{ item: string; done: boolean }>
  questionsToAsk: string[]
  hasConflicts: boolean
  conflictLabels: string[]
  profileVersionDate: string
  propertyRevisionDate: string
}

// ─── Agency & agent ────────────────────────────────────────────────────────

export const DEMO_AGENCY = {
  name: 'Hartfield & Rowe',
  slug: 'hartfield-rowe',
}

export const DEMO_AGENT = {
  name: 'Sophie Lane',
  role: 'Senior negotiator',
}

// ─── Buyer profiles ────────────────────────────────────────────────────────

export const DEMO_BUYERS: { maya: BuyerProfile; amara: BuyerProfile } = {
  maya: {
    id: DEMO_NAV_IDS.buyerMaya,
    displayName: 'Maya and James Reid',
    status: 'Actively searching',
    briefDate: '29 Oct',
    approvedTimeAgo: '2 hours ago',
    conversationDuration: '6-minute voice conversation',
    buyingPosition: 'Chain-free, renting',
    quickFacts: [
      { label: 'Budget', value: '£650k–£800k', status: 'confirmed' },
      { label: 'Where', value: 'Sevenoaks area', status: 'confirmed' },
      { label: 'Bedrooms', value: '3+', status: 'confirmed' },
      { label: 'Timing', value: 'Flexible', status: 'suggested' },
    ],
    topPriorities: [
      {
        label: 'Secure private garden',
        detail: 'For their dog Bramble. Full enclosure is non-negotiable.',
        status: 'confirmed',
        evidence: '"The garden is the non-negotiable — Bramble needs to be able to run freely."',
      },
      {
        label: 'Walkable town centre',
        detail: 'Within 10 minutes on foot of shops and cafés.',
        status: 'confirmed',
        evidence: '"We walk everywhere. A car-dependent life doesn\'t work for us."',
      },
      {
        label: 'Character property',
        detail: 'Period features — cornices, cast-iron fireplaces, original floors.',
        status: 'confirmed',
        evidence: '"Something with soul. I can\'t bear a new build."',
      },
    ],
    dealbreakers: [
      'No secure garden or shared garden only',
      'Busy main road',
      'New-build estate',
      'More than 12 minutes walk from town',
    ],
    lifestyleSignals: [
      'Dog owner (Labrador, Bramble)',
      'Both work from home 2–3 days per week',
      'Enjoy hosting dinner parties',
      'Countryside walks at weekends',
    ],
    colourTaste: [
      { name: 'Warm linen', hex: '#f5ede0' },
      { name: 'Sage', hex: '#7a9e7e' },
      { name: 'Tobacco', hex: '#8b6347' },
      { name: 'Slate', hex: '#7a8c8e' },
      { name: 'Chalk', hex: '#f2f0eb' },
    ],
    renovationFlexibilityPct: 70,
    tradeOffs: [
      {
        leftLabel: 'More space',
        rightLabel: 'Better location',
        position: 75,
        note: 'Will sacrifice square footage to be closer to town',
      },
      {
        leftLabel: 'Modern kitchen',
        rightLabel: 'Period character',
        position: 20,
        note: 'Strongly prefers original character; happy to renovate the kitchen',
      },
      {
        leftLabel: 'Move now',
        rightLabel: 'Wait for the right home',
        position: 65,
        note: 'In no rush, but motivated — will move on the right property',
      },
    ],
    inTheirWords:
      '"We want a house that feels like a home the moment you walk in — something with a bit of history, somewhere Bramble can tear around outside, and close enough to town that we can live without a car. We\'re not in a rush, but we know exactly what we want."',
    inTheirWordsAttribution: 'Maya Reid, 29 October',
  },

  amara: {
    id: DEMO_NAV_IDS.buyerAmara,
    displayName: 'Amara Osei',
    status: 'Actively searching',
    briefDate: '28 Oct',
    approvedTimeAgo: 'Yesterday',
    conversationDuration: '8-minute voice conversation',
    buyingPosition: 'First-time buyer, renting',
    quickFacts: [
      { label: 'Budget', value: '£375k–£450k', status: 'confirmed' },
      { label: 'Where', value: 'Tunbridge Wells', status: 'confirmed' },
      { label: 'Bedrooms', value: '2', status: 'confirmed' },
      { label: 'Timing', value: 'Within 3 months', status: 'confirmed' },
    ],
    topPriorities: [
      {
        label: 'Station access',
        detail: '20-minute commute to London Bridge. Non-negotiable.',
        status: 'confirmed',
        evidence: '"I\'m in the office three days a week. Door-to-door can\'t be more than 40 minutes."',
      },
      {
        label: 'Natural light',
        detail: 'South or west-facing main reception strongly preferred.',
        status: 'confirmed',
        evidence: '"I work from home the other days. I need a bright space."',
      },
      {
        label: 'Move-in ready',
        detail: 'Contemporary finish preferred. Not looking for a renovation project.',
        status: 'suggested',
        evidence: '"I want somewhere I can just move into — I don\'t have the time or energy for a project."',
      },
    ],
    dealbreakers: [
      'More than 12 minutes walk to Tunbridge Wells station',
      'Ground floor flat',
      'North-facing only',
    ],
    lifestyleSignals: [
      'Solo buyer',
      'Commutes to London 3 days per week',
      'Works from home remainder',
      'No car',
    ],
    colourTaste: [
      { name: 'Bright white', hex: '#f7f7f5' },
      { name: 'Putty', hex: '#d4c9ba' },
      { name: 'Navy', hex: '#2c3e5d' },
      { name: 'Brass', hex: '#c9a84c' },
    ],
    renovationFlexibilityPct: 15,
    tradeOffs: [
      {
        leftLabel: 'More space',
        rightLabel: 'Better commute',
        position: 80,
        note: 'Commute is the clear priority over room size',
      },
      {
        leftLabel: 'Garden',
        rightLabel: 'Light interior',
        position: 70,
        note: 'Happy without outdoor space if the interior is bright',
      },
    ],
    inTheirWords:
      '"I want somewhere I can put my own stamp on over time, but it needs to work from the moment I move in. Light is everything to me — I need somewhere that feels alive, not dim."',
    inTheirWordsAttribution: 'Amara Osei, 28 October',
  },
}

// ─── Properties ────────────────────────────────────────────────────────────

export const DEMO_PROPERTIES = {
  larkfield: {
    id: DEMO_NAV_IDS.propLarkfield,
    name: 'Larkfield House',
    address: 'Larkfield House, TN15 7PQ',
    price: '£725,000',
    verdictLabel: 'Strong fit',
    verdict: 'confirmed' as TrustStatus,
  },
  ashgrove: {
    id: DEMO_NAV_IDS.propAshgrove,
    name: '4 Ashgrove Place',
    address: '4 Ashgrove Place, TN13 2DH',
    price: '£685,000',
    verdictLabel: 'Conflict',
    verdict: 'conflict' as TrustStatus,
  },
  calverley: {
    id: 'demo-prop-calverley',
    name: 'Flat 3 Calverley Court',
    address: 'Flat 3 Calverley Court, TN1 1YE',
    price: '£420,000',
    verdictLabel: 'Check before viewing',
    verdict: 'suggested' as TrustStatus,
  },
}

// ─── Conversation ──────────────────────────────────────────────────────────

export const DEMO_CONVERSATION: {
  turns: ConversationTurn[]
  topicsDone: number
  topicsTotal: number
} = {
  topicsDone: 5,
  topicsTotal: 7,
  turns: [
    {
      role: 'ai',
      text: "Hi Maya! I'm here to help you and James get clear on what you're looking for in your next home. It usually takes about 6–8 minutes. Shall we start by talking about where you'd like to live?",
      timestamp: '10:12',
    },
    {
      role: 'buyer',
      text: "Yes, let's do it. We're pretty set on the Sevenoaks area — we've been renting here for two years and we really love it. We want to stay within walking distance of the high street.",
      timestamp: '10:12',
    },
    {
      role: 'ai',
      text: "That's helpful — so walkability to town is really important. Can you tell me a bit about your lifestyle? What does a typical week look like for you both?",
      timestamp: '10:13',
    },
    {
      role: 'buyer',
      text: "We both work from home a few days a week, so we need a space that works well as a home office. And we have a dog — Bramble, a labrador — so a garden is absolutely non-negotiable. It needs to be secure and private.",
      timestamp: '10:13',
    },
    {
      role: 'ai',
      text: "Got it — so a secure private garden for Bramble is a must. You mentioned home office space — do you need a dedicated room, or could a large bedroom double up?",
      timestamp: '10:14',
    },
    {
      role: 'buyer',
      text: "A dedicated room would be great, but we could make a large bedroom work as a study too. We're thinking 3–4 bedrooms ideally, 3 as an absolute minimum.",
      timestamp: '10:14',
    },
    {
      role: 'ai',
      text: "And in terms of the property itself — are you open to a renovation project, or would you prefer something ready to move into?",
      timestamp: '10:15',
    },
    {
      role: 'buyer',
      text: "We love a character property — period features, original floors, that sort of thing. We'd happily renovate a kitchen or bathrooms, but we don't want a complete project. We want it to be liveable from day one.",
      timestamp: '10:15',
    },
    {
      role: 'ai',
      text: "Perfect. Character and original features are important, and you're happy to do cosmetic work. Last big one: what's your budget, and how flexible is your timing?",
      timestamp: '10:16',
    },
    {
      role: 'buyer',
      text: "Budget is £650k to £800k, and we're pretty firm on that. Timing — we're renting month-to-month so we can move when the right place comes up. No rush at all.",
      timestamp: '10:16',
    },
    {
      role: 'ai',
      text: "One last thing — what would make you walk away from a property, no matter how good it looked on paper?",
      timestamp: '10:17',
    },
    {
      role: 'buyer',
      text: "A garden that isn't enclosed — absolute dealbreaker because of Bramble. Being on a busy main road. And honestly, a new build. We just don't connect with them.",
      timestamp: '10:17',
    },
    {
      role: 'ai',
      text: "Brilliant. I've got a really clear picture. I'll put your brief together now — it should only take a moment. You can review it and decide what to share with Hartfield & Rowe.",
      timestamp: '10:18',
    },
  ],
}

// ─── Maya's home brief ─────────────────────────────────────────────────────

export const DEMO_MAYA_BRIEF: HomeBriefData = {
  buyerName: 'Maya and James',
  subtitleDate: '29 October',
  conversationDuration: '6',
  nutshell:
    "Maya and James are looking for a 3–4 bedroom character property within walking distance of Sevenoaks town centre. A secure, private garden for their labrador Bramble is their non-negotiable. They're happy to renovate a kitchen or bathrooms but want the property to be liveable from day one. Budget is firm at £650k–£800k.",
  nonNegotiables: [
    { text: 'Secure, private garden (for Bramble the dog)', importance: 'essential' },
    { text: 'Walkable to Sevenoaks town centre (10 min or less)', importance: 'essential' },
    { text: '3 bedrooms minimum', importance: 'essential' },
    { text: 'Budget under £800,000', importance: 'essential' },
    { text: 'Not a new-build', importance: 'essential' },
  ],
  thingsIdLove: [
    { text: 'Period features — cornices, fireplaces, sash windows', importance: 'preferred' },
    { text: 'A dedicated room to use as a home office', importance: 'preferred' },
    { text: 'Country views or nearby countryside access', importance: 'preferred' },
    { text: 'Kitchen ready to renovate (prefer to personalise)', importance: 'flexible' },
    { text: 'Good train links (secondary priority)', importance: 'flexible' },
  ],
  idealLifestyle: [
    'Walking to the high street for coffee and errands',
    'Bramble running freely in the garden',
    'Working from a calm, dedicated home office',
    'Hosting friends for dinner parties',
    'Weekend walks in the countryside',
  ],
  styleSwatches: [
    { name: 'Warm linen', hex: '#f5ede0' },
    { name: 'Sage', hex: '#7a9e7e' },
    { name: 'Tobacco', hex: '#8b6347' },
    { name: 'Slate', hex: '#7a8c8e' },
    { name: 'Chalk', hex: '#f2f0eb' },
  ],
  renovationsToConsider: [
    'Kitchen replacement or full remodel',
    'Bathroom update',
    'Redecoration throughout',
    'Garden landscaping',
    'Loft conversion (longer term)',
  ],
}

// ─── Larkfield fit ─────────────────────────────────────────────────────────

export const DEMO_LARKFIELD_FIT: PropertyFitData = {
  propertyName: 'Larkfield House',
  propertyAddress: 'Larkfield House, TN15 7PQ',
  propertyPrice: '£725,000',
  propertyVerdict: 'confirmed',
  strongMatches: [
    {
      label: 'Secure private garden',
      detail: '80ft south-facing rear garden with solid panel fencing and a lockable gate.',
      status: 'confirmed',
      source: 'Estate agent confirmed; vendor notes',
    },
    {
      label: 'Walkable town centre',
      detail: '5-minute walk to Sevenoaks high street. Supermarket 3 minutes.',
      status: 'confirmed',
      source: 'Walk score analysis',
    },
    {
      label: 'Period character',
      detail: 'Victorian semi-detached. Original cornicing, cast-iron fireplaces, sash windows throughout.',
      status: 'confirmed',
      source: 'Property listing; agent notes',
    },
    {
      label: 'Four bedrooms',
      detail: 'Meets the 3+ bedroom requirement with one room to spare.',
      status: 'confirmed',
      source: 'Floor plan',
    },
    {
      label: 'Budget fit',
      detail: 'Guide price £725,000 sits within the £650k–£800k range.',
      status: 'confirmed',
      source: 'Listing price',
    },
  ],
  compromises: [
    {
      label: 'Fourth bedroom is small',
      detail: "Bedroom 4 is 8ft × 9ft — works as a child's room or study, but not a comfortable double.",
      status: 'suggested',
      source: 'Floor plan dimensions',
    },
    {
      label: 'Slightly further from station',
      detail: '14-minute walk to Sevenoaks station — not a priority for the Reids but worth noting.',
      status: 'suggested',
      source: 'Google Maps',
    },
  ],
  conflicts: [],
  unknowns: [
    {
      label: 'Shared side passage arrangement',
      detail: 'Deeds indicate a shared right of way along the left side. Terms unknown.',
      status: 'unknown',
      source: 'Title register note',
    },
    {
      label: 'Rear fence condition',
      detail: 'Fencing looks solid in photos but not confirmed on site. Security for Bramble depends on this.',
      status: 'unknown',
      source: 'Listing photos only',
    },
  ],
  worthAsking: [
    'Is the rear garden fully enclosed — can Bramble not escape under the fence?',
    'What is the shared side-passage arrangement, and does it affect privacy?',
    'Has the fence been recently maintained or replaced?',
    'What heating system is installed, and when was it last serviced?',
  ],
}

// ─── Ashgrove fit ──────────────────────────────────────────────────────────

export const DEMO_ASHGROVE_FIT: PropertyFitData = {
  propertyName: '4 Ashgrove Place',
  propertyAddress: '4 Ashgrove Place, TN13 2DH',
  propertyPrice: '£685,000',
  propertyVerdict: 'conflict',
  strongMatches: [
    {
      label: 'Period character',
      detail: 'Edwardian terrace with original features — stripped floorboards, picture rails, cast-iron fireplace.',
      status: 'confirmed',
      source: 'Property listing',
    },
    {
      label: 'Budget fit',
      detail: "Guide price £685,000 — below the top of Maya and James's range.",
      status: 'confirmed',
      source: 'Listing price',
    },
    {
      label: 'Three bedrooms',
      detail: 'Meets the minimum 3-bedroom requirement.',
      status: 'confirmed',
      source: 'Floor plan',
    },
  ],
  compromises: [
    {
      label: 'Minimum bedroom count',
      detail: 'Only 3 bedrooms — meets the threshold but leaves no flexibility.',
      status: 'suggested',
      source: 'Floor plan',
    },
    {
      label: 'Kitchen needs full renovation',
      detail: "Original 1990s kitchen. Would require a full replacement — at the edge of what the Reids described as acceptable.",
      status: 'suggested',
      source: 'Agent notes; listing photos',
    },
  ],
  conflicts: [
    {
      label: 'Garden overlooked',
      detail: "Rear garden is overlooked by three neighbouring properties. Conflicts directly with Maya and James's essential privacy requirement for Bramble.",
      status: 'conflict',
      source: 'Site visit observations; OS map',
    },
  ],
  unknowns: [
    {
      label: 'Planning permission for rear extension',
      detail: 'Previous owners applied for a rear extension. Status of application unknown.',
      status: 'unknown',
      source: 'Land Registry search',
    },
  ],
  worthAsking: [],
}

// ─── Viewing brief ─────────────────────────────────────────────────────────

export const DEMO_VIEWING_BRIEF: ViewingBriefData = {
  buyerName: 'Maya and James Reid',
  propertyName: 'Larkfield House',
  propertyAddress: 'Larkfield House, TN15 7PQ',
  agentName: 'Sophie Lane',
  agencyName: 'Hartfield & Rowe',
  preparedDate: '29 October 2024',
  conversationDuration: '6 minutes',
  sections: [
    {
      heading: 'About Maya and James',
      body: "Maya and James Reid are a couple currently renting in Sevenoaks. They're chain-free and can move at their own pace. They both work from home 2–3 days per week and have a labrador, Bramble. They know Sevenoaks well and are confident about what they want.",
    },
    {
      heading: 'What matters most',
      body: [
        'A fully enclosed, private garden where Bramble can roam freely. This is their number one non-negotiable.',
        'Walkable to Sevenoaks high street — within 10 minutes on foot.',
        'Character property with period features: cornices, fireplaces, original floors.',
        'At least 3 bedrooms, ideally 4.',
      ],
    },
    {
      heading: 'What to highlight during the viewing',
      body: [
        'Walk the full perimeter of the rear garden — point out the solid fencing and lockable gate.',
        'Offer to walk to the nearest shops from the front door to show how close the high street really is.',
        'Draw attention to original features — cornicing in the reception, the cast-iron fireplace, sash windows.',
        'Show the fourth bedroom and frame it as a natural home office.',
      ],
    },
    {
      heading: 'Questions to resolve before or during the viewing',
      body: [
        'Shared side passage — confirm the exact terms with the vendor before the viewing so you can answer on the day.',
        "Rear fence condition — confirm it's dog-proof. Offer to check during the viewing if not already confirmed.",
        'When was the heating system last serviced?',
      ],
    },
    {
      heading: 'What to avoid',
      body: [
        "Don't lead with the fourth bedroom's size unless asked — it's small and may feel like a weakness before they've connected with the property.",
        "Avoid discussing the side passage arrangement speculatively — only raise it once you have the facts from the vendor.",
      ],
    },
    {
      heading: 'Conversation starters',
      body: [
        "Maya loves to cook and host — if the kitchen comes up, acknowledge it's a project but frame it as an opportunity to make it entirely their own.",
        "They walk everywhere — if they ask about the commute, the station walk is less important to them than to most buyers; walkability to town is the real priority.",
        "Bramble is the deciding vote. If the garden feels secure, you're in a very strong position.",
      ],
    },
  ],
}

// ─── Demo viewing brief (rich format for Screen G) ─────────────────────────

export const DEMO_VIEWING_BRIEF_DRAFT: ViewingBriefDraftJson = {
  version: 1,
  profileVersionId: 'demo-version-1',
  propertyRevision: 1,
  generatedAt: '2024-10-30T09:00:00.000Z',
  buyerName: 'Maya and James Reid',
  propertyName: 'Larkfield House',
  propertyAddress: 'Larkfield House, TN15 7PQ',
  propertyPrice: '£725,000',
  agentName: 'Sophie Lane',
  agencyName: 'Hartfield & Rowe',
  buyerSnapshot:
    'Maya and James Reid are looking for a 4-bedroom house in Sevenoaks with a budget of up to £800,000. A private garden is a non-negotiable requirement.',
  whatTheyCareAbout: [
    '80ft south-facing rear garden with solid panel fencing and a lockable gate.',
    '5-minute walk to Sevenoaks high street. Supermarket 3 minutes.',
    'Victorian semi-detached with original cornicing, cast-iron fireplaces and sash windows throughout.',
    'Four bedrooms — meets the 3+ requirement with one room to spare.',
    'Guide price £725,000 within the £650k–£800k range.',
  ],
  wontConsider: [
    'An overlooked or insecure garden — Bramble must not be able to escape.',
    'Extensions or structural work beyond kitchen/bathroom.',
    'A main road frontage with no acoustic buffer.',
  ],
  whyItMaySuit:
    "Larkfield House's secure private garden and walkable town-centre location align directly with Maya and James's two most important requirements.",
  threeThingsToShow: [
    {
      title: 'Secure private garden',
      description:
        '80ft south-facing rear garden with solid panel fencing and a lockable gate. — Estate agent confirmed; vendor notes',
    },
    {
      title: 'Walkable town centre',
      description:
        '5-minute walk to Sevenoaks high street. Supermarket 3 minutes. — Walk score analysis',
    },
    {
      title: 'Period character',
      description:
        'Victorian semi-detached. Original cornicing, cast-iron fireplaces, sash windows throughout. — Property listing; agent notes',
    },
  ],
  localEvidence: [
    {
      label: 'Shared side passage arrangement',
      status: 'unknown',
      source: 'Title register note',
    },
    {
      label: 'Rear fence condition',
      status: 'unknown',
      source: 'Listing photos only',
    },
  ],
  beUpfrontAbout: [],
  checkBeforeViewing: [
    { item: 'Confirm: Shared side passage arrangement', done: false },
    { item: 'Confirm: Rear fence condition', done: false },
  ],
  questionsToAsk: [
    'Is the rear garden fully enclosed — can Bramble not escape under the fence?',
    'What is the shared side-passage arrangement, and does it affect privacy?',
    'Has the fence been recently maintained or replaced?',
    'What heating system is installed, and when was it last serviced?',
  ],
  hasConflicts: false,
  conflictLabels: [],
  profileVersionDate: '29 Oct',
  propertyRevisionDate: '30 Oct',
}
