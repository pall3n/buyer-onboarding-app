-- 008_seed.sql
-- Fixed demo seed data for Hartfield & Rowe
-- All UUIDs are fixed for reproducibility; all entities are fictional demo data

-- ─── Hartfield & Rowe agency ─────────────────────────────────────────────────

INSERT INTO agencies (id, name, slug, status, branding)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Hartfield & Rowe',
  'hartfield-rowe',
  'active',
  '{"primaryColor": "#2D4A3E", "accentColor": "#C4A882"}'
)
ON CONFLICT DO NOTHING;

-- ─── Demo properties ─────────────────────────────────────────────────────────

INSERT INTO properties (id, agency_id, address_line1, postcode, asking_price, status, revision)
VALUES
  (
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000001',
    'Larkfield House, Larkfield Road',
    'TN15 7PQ',
    87500000, -- £875,000 in pence
    'active',
    1
  ),
  (
    '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000001',
    '4 Ashgrove Place',
    'TN13 2DH',
    64500000, -- £645,000 in pence
    'active',
    1
  ),
  (
    '00000000-0000-0000-0000-000000000022',
    '00000000-0000-0000-0000-000000000001',
    'Flat 3, Calverley Court',
    'TN1 1YE',
    38000000, -- £380,000 in pence
    'active',
    1
  )
ON CONFLICT DO NOTHING;
