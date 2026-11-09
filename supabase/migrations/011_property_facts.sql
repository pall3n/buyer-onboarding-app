-- 011_property_facts.sql
-- Structured property facts for Larkfield House and 4 Ashgrove Place (demo properties)
-- typed_value follows the same { "value": <v> } envelope as profile_preferences

-- ─── Larkfield House (00000000-0000-0000-0000-000000000020) ──────────────────

INSERT INTO property_facts (id, property_id, category, key, typed_value, verification_state) VALUES
  ('00000000-0000-0000-0001-000000000031', '00000000-0000-0000-0000-000000000020', 'bedrooms',      'count',             '{"value": 4}',              'verified'),
  ('00000000-0000-0000-0001-000000000032', '00000000-0000-0000-0000-000000000020', 'property_type', 'type',              '{"value": "house"}',        'verified'),
  ('00000000-0000-0000-0001-000000000033', '00000000-0000-0000-0000-000000000020', 'property_type', 'build_era',         '{"value": "period"}',       'verified'),
  ('00000000-0000-0000-0001-000000000034', '00000000-0000-0000-0000-000000000020', 'lifestyle',     'has_garden',        '{"value": true}',           'verified'),
  ('00000000-0000-0000-0001-000000000035', '00000000-0000-0000-0000-000000000020', 'lifestyle',     'garden_private',    '{"value": true}',           'verified'),
  ('00000000-0000-0000-0001-000000000036', '00000000-0000-0000-0000-000000000020', 'lifestyle',     'garden_orientation','{"value": "south"}',        'verified'),
  ('00000000-0000-0000-0001-000000000037', '00000000-0000-0000-0000-000000000020', 'location',      'area',              '{"value": "Sevenoaks"}',    'verified'),
  ('00000000-0000-0000-0001-000000000038', '00000000-0000-0000-0000-000000000020', 'condition',     'state',             '{"value": "move_in_ready"}','verified')
ON CONFLICT DO NOTHING;

-- Source for Larkfield garden privacy fact (floor plan)
INSERT INTO property_fact_sources (id, fact_id, kind, note, retrieved_at) VALUES
  ('00000000-0000-0000-0001-000000000051', '00000000-0000-0000-0001-000000000035', 'document', 'Floor plan — no adjacent structures', NOW())
ON CONFLICT DO NOTHING;

-- ─── 4 Ashgrove Place (00000000-0000-0000-0000-000000000021) ─────────────────

INSERT INTO property_facts (id, property_id, category, key, typed_value, verification_state) VALUES
  ('00000000-0000-0000-0001-000000000041', '00000000-0000-0000-0000-000000000021', 'bedrooms',      'count',             '{"value": 3}',              'verified'),
  ('00000000-0000-0000-0001-000000000042', '00000000-0000-0000-0000-000000000021', 'property_type', 'type',              '{"value": "house"}',        'verified'),
  ('00000000-0000-0000-0001-000000000043', '00000000-0000-0000-0000-000000000021', 'property_type', 'build_era',         '{"value": "period"}',       'verified'),
  ('00000000-0000-0000-0001-000000000044', '00000000-0000-0000-0000-000000000021', 'lifestyle',     'has_garden',        '{"value": true}',           'verified'),
  ('00000000-0000-0000-0001-000000000045', '00000000-0000-0000-0000-000000000021', 'lifestyle',     'garden_private',    '{"value": false}',          'verified'),
  ('00000000-0000-0000-0001-000000000046', '00000000-0000-0000-0000-000000000021', 'lifestyle',     'garden_orientation','{"value": "south"}',        'verified'),
  ('00000000-0000-0000-0001-000000000047', '00000000-0000-0000-0000-000000000021', 'location',      'area',              '{"value": "Sevenoaks"}',    'verified'),
  ('00000000-0000-0000-0001-000000000048', '00000000-0000-0000-0000-000000000021', 'condition',     'state',             '{"value": "light_cosmetic"}','verified')
ON CONFLICT DO NOTHING;

-- Source for Ashgrove garden privacy fact (council planning portal)
INSERT INTO property_fact_sources (id, fact_id, kind, url, note, retrieved_at) VALUES
  ('00000000-0000-0000-0001-000000000052', '00000000-0000-0000-0001-000000000045', 'planning_portal', 'https://pa.sevenoaks.gov.uk/online-applications/', 'Council planning portal — adjacent development approved', NOW())
ON CONFLICT DO NOTHING;
