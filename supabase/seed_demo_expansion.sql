-- Bold Party Planner - Demo Seed Expansion
-- Run AFTER seed.sql (001 through 009 migrations + initial seed).
-- Adds 10 more demo vendors across underrepresented categories + richer reviews/media.
-- Safe to re-run (uses ON CONFLICT DO NOTHING).

DO $$
DECLARE
  -- New vendor user IDs
  v6_id  UUID := 'a0000006-0000-0000-0000-000000000006';
  v7_id  UUID := 'a0000007-0000-0000-0000-000000000007';
  v8_id  UUID := 'a0000008-0000-0000-0000-000000000008';
  v9_id  UUID := 'a0000009-0000-0000-0000-000000000009';
  v10_id UUID := 'a0000010-0000-0000-0000-000000000010';
  v11_id UUID := 'a0000011-0000-0000-0000-000000000011';
  v12_id UUID := 'a0000012-0000-0000-0000-000000000012';
  v13_id UUID := 'a0000013-0000-0000-0000-000000000013';
  v14_id UUID := 'a0000014-0000-0000-0000-000000000014';
  v15_id UUID := 'a0000015-0000-0000-0000-000000000015';

  -- Existing customer IDs (from initial seed)
  c1_id UUID := 'b0000001-0000-0000-0000-000000000001';
  c2_id UUID := 'b0000002-0000-0000-0000-000000000002';
  c3_id UUID := 'b0000003-0000-0000-0000-000000000003';

  -- Vendor record IDs (resolved below)
  vendor6  UUID;
  vendor7  UUID;
  vendor8  UUID;
  vendor9  UUID;
  vendor10 UUID;
  vendor11 UUID;
  vendor12 UUID;
  vendor13 UUID;
  vendor14 UUID;
  vendor15 UUID;

  -- Event IDs (resolved below)
  event1 UUID;
  event2 UUID;
  event3 UUID;
BEGIN

-- ─── Step 0: Auth users ───────────────────────────────────────────────────────
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data)
VALUES
  (v6_id,  '00000000-0000-0000-0000-000000000000', 'aisha.okafor@elbold.demo',    '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), 'authenticated', 'authenticated', NOW(), NOW(), '', '{"provider":"email","providers":["email"]}', '{"full_name":"Aisha Okafor"}'),
  (v7_id,  '00000000-0000-0000-0000-000000000000', 'daniel.walsh@elbold.demo',    '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), 'authenticated', 'authenticated', NOW(), NOW(), '', '{"provider":"email","providers":["email"]}', '{"full_name":"Daniel Walsh"}'),
  (v8_id,  '00000000-0000-0000-0000-000000000000', 'grace.chen@elbold.demo',      '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), 'authenticated', 'authenticated', NOW(), NOW(), '', '{"provider":"email","providers":["email"]}', '{"full_name":"Grace Chen"}'),
  (v9_id,  '00000000-0000-0000-0000-000000000000', 'theo.harrington@elbold.demo', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), 'authenticated', 'authenticated', NOW(), NOW(), '', '{"provider":"email","providers":["email"]}', '{"full_name":"Theo Harrington"}'),
  (v10_id, '00000000-0000-0000-0000-000000000000', 'fatima.ahmed@elbold.demo',    '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), 'authenticated', 'authenticated', NOW(), NOW(), '', '{"provider":"email","providers":["email"]}', '{"full_name":"Fatima Ahmed"}'),
  (v11_id, '00000000-0000-0000-0000-000000000000', 'jake.morrison@elbold.demo',   '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), 'authenticated', 'authenticated', NOW(), NOW(), '', '{"provider":"email","providers":["email"]}', '{"full_name":"Jake Morrison"}'),
  (v12_id, '00000000-0000-0000-0000-000000000000', 'natalie.russo@elbold.demo',   '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), 'authenticated', 'authenticated', NOW(), NOW(), '', '{"provider":"email","providers":["email"]}', '{"full_name":"Natalie Russo"}'),
  (v13_id, '00000000-0000-0000-0000-000000000000', 'ben.osei@elbold.demo',        '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), 'authenticated', 'authenticated', NOW(), NOW(), '', '{"provider":"email","providers":["email"]}', '{"full_name":"Ben Osei"}'),
  (v14_id, '00000000-0000-0000-0000-000000000000', 'isabelle.martin@elbold.demo', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), 'authenticated', 'authenticated', NOW(), NOW(), '', '{"provider":"email","providers":["email"]}', '{"full_name":"Isabelle Martin"}'),
  (v15_id, '00000000-0000-0000-0000-000000000000', 'chris.obi@elbold.demo',       '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', NOW(), 'authenticated', 'authenticated', NOW(), NOW(), '', '{"provider":"email","providers":["email"]}', '{"full_name":"Chris Obi"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES
  (v6_id,  v6_id,  v6_id::text,  'email', jsonb_build_object('sub', v6_id::text,  'email', 'aisha.okafor@elbold.demo'),    NOW(), NOW(), NOW()),
  (v7_id,  v7_id,  v7_id::text,  'email', jsonb_build_object('sub', v7_id::text,  'email', 'daniel.walsh@elbold.demo'),    NOW(), NOW(), NOW()),
  (v8_id,  v8_id,  v8_id::text,  'email', jsonb_build_object('sub', v8_id::text,  'email', 'grace.chen@elbold.demo'),      NOW(), NOW(), NOW()),
  (v9_id,  v9_id,  v9_id::text,  'email', jsonb_build_object('sub', v9_id::text,  'email', 'theo.harrington@elbold.demo'), NOW(), NOW(), NOW()),
  (v10_id, v10_id, v10_id::text, 'email', jsonb_build_object('sub', v10_id::text, 'email', 'fatima.ahmed@elbold.demo'),    NOW(), NOW(), NOW()),
  (v11_id, v11_id, v11_id::text, 'email', jsonb_build_object('sub', v11_id::text, 'email', 'jake.morrison@elbold.demo'),   NOW(), NOW(), NOW()),
  (v12_id, v12_id, v12_id::text, 'email', jsonb_build_object('sub', v12_id::text, 'email', 'natalie.russo@elbold.demo'),   NOW(), NOW(), NOW()),
  (v13_id, v13_id, v13_id::text, 'email', jsonb_build_object('sub', v13_id::text, 'email', 'ben.osei@elbold.demo'),        NOW(), NOW(), NOW()),
  (v14_id, v14_id, v14_id::text, 'email', jsonb_build_object('sub', v14_id::text, 'email', 'isabelle.martin@elbold.demo'), NOW(), NOW(), NOW()),
  (v15_id, v15_id, v15_id::text, 'email', jsonb_build_object('sub', v15_id::text, 'email', 'chris.obi@elbold.demo'),       NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ─── Step 1: Profiles ─────────────────────────────────────────────────────────
INSERT INTO profiles (id, full_name, email, role, avatar_url) VALUES
  (v6_id,  'Aisha Okafor',     'aisha.okafor@elbold.demo',    'vendor', NULL),
  (v7_id,  'Daniel Walsh',     'daniel.walsh@elbold.demo',    'vendor', NULL),
  (v8_id,  'Grace Chen',       'grace.chen@elbold.demo',      'vendor', NULL),
  (v9_id,  'Theo Harrington',  'theo.harrington@elbold.demo', 'vendor', NULL),
  (v10_id, 'Fatima Ahmed',     'fatima.ahmed@elbold.demo',    'vendor', NULL),
  (v11_id, 'Jake Morrison',    'jake.morrison@elbold.demo',   'vendor', NULL),
  (v12_id, 'Natalie Russo',    'natalie.russo@elbold.demo',   'vendor', NULL),
  (v13_id, 'Ben Osei',         'ben.osei@elbold.demo',        'vendor', NULL),
  (v14_id, 'Isabelle Martin',  'isabelle.martin@elbold.demo', 'vendor', NULL),
  (v15_id, 'Chris Obi',        'chris.obi@elbold.demo',       'vendor', NULL)
ON CONFLICT (id) DO NOTHING;

-- ─── Step 2: Vendors ──────────────────────────────────────────────────────────
INSERT INTO vendors (user_id, business_name, tagline, category, bio, city, address, phone, travel_radius_km, status, rating, review_count, total_reviews, min_price, max_price, verified, featured, years_experience, event_types, instagram_url, website_url)
VALUES
  -- Videographer - London
  (v6_id,  'Aisha Films',           'Your day, beautifully told',                     'videographer',     'Cinematic wedding and event films with a documentary heart. Based in East London, travelling UK-wide. BAFTA-trained editor. Every film is hand-crafted with original music scoring.', 'London',     '7 Lens Street, Bethnal Green, E2 9HG',   '+44 7700 900006', 100, 'approved', 4.9,  84,  84,  600,  2800, true,  true,  9,  ARRAY['wedding','engagement','corporate','birthday'],                 'https://instagram.com/aishafilms', 'https://aishafilms.co.uk'),
  -- Live Band - Birmingham
  (v7_id,  'The Prestige Band',     'Live music that fills the floor',                'live_band',        'Seven-piece function band covering Motown, soul, pop, and R&B. Available across the UK with our own PA and stage lighting. Perfect for weddings, galas, and corporate events.', 'Birmingham', '14 Harmony Road, Digbeth, B5 6SN',      '+44 7700 900007', 200, 'approved', 4.8,  112, 112, 1200, 4500, true,  false, 11, ARRAY['wedding','corporate','birthday','charity','christmas_party'],  'https://instagram.com/prestigeband', 'https://theprestigeband.co.uk'),
  -- Makeup Artist - Manchester
  (v8_id,  'Glow by Grace',         'Flawless looks for your biggest moments',        'makeup_artist',    'Award-winning bridal and editorial makeup artist based in Manchester. Airbrush specialist. Team of 4 available for large wedding parties. Trial sessions available at your location.', 'Manchester', '3 Vanity Row, Chorlton, M21 8FS',       '+44 7700 900008', 80,  'approved', 4.9,  156, 156, 150,  650,  true,  true,  7,  ARRAY['wedding','engagement','birthday','graduation','prom'],         'https://instagram.com/glowbygrace', 'https://glowbygrace.co.uk'),
  -- Cake Maker - London
  (v9_id,  'Theo''s Couture Cakes', 'Edible art for life''s sweetest moments',        'cake_maker',       'Luxury bespoke wedding and celebration cakes made in London. Sugar florals, sculpted designs, and multi-tier creations. Tasting sessions available. 12 weeks lead time recommended for weddings.', 'London', '19 Sugar Lane, Islington, N1 5PD', '+44 7700 900009', 50,  'approved', 4.8,  93,  93,  200,  1400, true,  false, 5,  ARRAY['wedding','birthday','baby_shower','anniversary','graduation'],  'https://instagram.com/theocouturecakes', NULL),
  -- MC / Host - London
  (v10_id, 'Fatima Hosts',          'Every event deserves a great host',              'mc',               'Professional Master of Ceremonies and event host with TV presenting experience. Available for weddings, corporate awards, charity galas, and cultural celebrations. Over 400 events hosted.', 'London', NULL, '+44 7700 900010', 150, 'approved', 4.7,  68,  68,  350,  950,  true,  false, 10, ARRAY['wedding','corporate','charity','birthday','graduation'],       'https://instagram.com/fatimahosts', NULL),
  -- Marquee Rental - Surrey
  (v11_id, 'Canvas & Canopy',       'Breathtaking outdoor event spaces',              'marquee_rental',   'Premium marquee and outdoor structure hire across Surrey, Kent, and London. Clear-span, tipi, and traditional styles. Full interior fit-out packages available including flooring, lighting, and furniture.', 'Guildford', '6 Meadow Way, Guildford, GU2 9QL', '+44 7700 900011', 120, 'approved', 4.6,  41,  41,  1800, 9500, false, false, 8,  ARRAY['wedding','corporate','birthday','charity'],                   NULL, 'https://canvasandcanopy.co.uk'),
  -- Lighting & Stage - Bristol
  (v12_id, 'Neon Nights Events',    'Atmosphere you can feel',                        'lighting_stage',   'Professional event lighting, AV, and stage production company based in Bristol. Intelligent lighting rigs, LED dance floors, uplighting, monogram projections, and full staging. UK-wide coverage.', 'Bristol', '88 Light Works, Clifton, BS8 4NT', '+44 7700 900012', 200, 'approved', 4.8,  77,  77,  500,  3500, true,  false, 12, ARRAY['wedding','corporate','birthday','christmas_party','concert'],  'https://instagram.com/neonnightsevents', 'https://neonnightsevents.co.uk'),
  -- Balloon Decorator - Newcastle
  (v13_id, 'Pop & Bloom',           'Bold, playful balloon artistry',                 'balloon_decorator','Newcastle''s most creative balloon design studio. Organic balloon garlands, ceiling installations, giant numbers and letters, balloon arches. Delivery and setup included across the North East.', 'Newcastle', '2 Colour Street, Jesmond, NE2 3DF', '+44 7700 900013', 60,  'approved', 4.7,  39,  39,  200,  800,  false, false, 3,  ARRAY['birthday','baby_shower','wedding','gender_reveal','graduation'],'https://instagram.com/popandbloom', NULL),
  -- Transport / Chauffeur - London
  (v14_id, 'Premier Arrivals',      'Arrive in style. Always.',                       'transport',        'Luxury chauffeur and wedding car hire across London and the Home Counties. Fleet of Rolls-Royce, Bentley, and Mercedes S-Class. Uniformed drivers, ribbon and floral dressing, arrival coordination.', 'London', '25 Prestige Mews, Mayfair, W1K 6AT', '+44 7700 900014', 100, 'approved', 5.0,  58,  58,  250,  1200, true,  true,  14, ARRAY['wedding','engagement','corporate','birthday'],                 NULL, 'https://premierarrivals.co.uk'),
  -- Event Staff - Leeds
  (v15_id, 'ProStaff Yorkshire',    'Professional event staff, always impeccably presented', 'event_staff', 'Event staffing agency supplying trained waitstaff, bar staff, event coordinators, and ushers across Yorkshire and the North. All staff DBS-checked, first-aid trained, and uniformed.', 'Leeds', '10 Service Road, Headingley, LS6 2WQ', '+44 7700 900015', 100, 'approved', 4.6,  32,  32,  400,  2200, true,  false, 6,  ARRAY['wedding','corporate','charity','birthday','conference'],       NULL, NULL)
ON CONFLICT DO NOTHING;

-- Resolve vendor IDs
SELECT id INTO vendor6  FROM vendors WHERE user_id = v6_id;
SELECT id INTO vendor7  FROM vendors WHERE user_id = v7_id;
SELECT id INTO vendor8  FROM vendors WHERE user_id = v8_id;
SELECT id INTO vendor9  FROM vendors WHERE user_id = v9_id;
SELECT id INTO vendor10 FROM vendors WHERE user_id = v10_id;
SELECT id INTO vendor11 FROM vendors WHERE user_id = v11_id;
SELECT id INTO vendor12 FROM vendors WHERE user_id = v12_id;
SELECT id INTO vendor13 FROM vendors WHERE user_id = v13_id;
SELECT id INTO vendor14 FROM vendors WHERE user_id = v14_id;
SELECT id INTO vendor15 FROM vendors WHERE user_id = v15_id;

-- Resolve event IDs
SELECT id INTO event1 FROM events WHERE customer_id = c1_id LIMIT 1;
SELECT id INTO event2 FROM events WHERE customer_id = c2_id LIMIT 1;
SELECT id INTO event3 FROM events WHERE customer_id = c3_id LIMIT 1;

-- ─── Step 3: Packages ────────────────────────────────────────────────────────
INSERT INTO vendor_packages (vendor_id, name, price, description, includes, duration_hours) VALUES
  -- Aisha Films
  (vendor6,  'Highlight Film',          600.00,  'Beautiful 3–4 minute highlight reel',   ARRAY['Up to 6h filming','Cinematic 3-4min highlight film','Licensed music','Online delivery'],                         6),
  (vendor6,  'Full Story Film',         1400.00, 'Feature-length wedding documentary',     ARRAY['Full day filming (10h)','Feature film 60-90min','Highlight reel','Drone footage','Ceremony audio'],             10),
  (vendor6,  'Ultimate Collection',     2600.00, 'Everything, beautifully preserved',      ARRAY['2-camera crew','Full day + prep','Feature film','Highlight reel','Drone','USB + streaming link','Social edits'], 12),
  -- The Prestige Band
  (vendor7,  'Cocktail Hour Set',       1200.00, '2 hours of live background music',       ARRAY['2-hour performance','3-piece setup','PA system','Requests welcome'],                                             2),
  (vendor7,  'Evening Party Package',   2500.00, 'Three 45-min sets — full dance floor',   ARRAY['3x 45min sets','7-piece band','Full PA & lights','DJ playlist during breaks','1h setup time'],                  4),
  (vendor7,  'Full Day & Night',        4200.00, 'Ceremony through to last dance',         ARRAY['Ceremony music','Drinks reception set','3 evening sets','DJ playlist','Full PA & lights','Band dinner'],        10),
  -- Glow by Grace
  (vendor8,  'Bride Only',              250.00,  'Flawless bridal makeup',                 ARRAY['Trial session','Wedding day application','HD & airbrush finish','Touch-up kit'],                                 3),
  (vendor8,  'Bride + Party (up to 4)', 480.00,  'Bride and bridal party ready together',  ARRAY['Trial for bride','Wedding day: bride + 3 bridal party','Airbrush finish'],                                     5),
  (vendor8,  'Full Party (up to 8)',    850.00,  'Large bridal party service',             ARRAY['Trial for bride','Up to 8 people','Airbrush finish','Lashes included','On-call for touch-ups'],                 8),
  -- Theo Couture Cakes
  (vendor9,  'Celebration Cake',        200.00,  'Single or 2-tier celebration cake',      ARRAY['Up to 2 tiers','Custom design consultation','Serves up to 40','Delivery within M25'],                          0),
  (vendor9,  'Wedding Cake (3-tier)',   600.00,  'Elegant 3-tier wedding cake',            ARRAY['3 tiers','Custom design','Serves up to 100','Sugar florals','Delivery & setup'],                                0),
  (vendor9,  'Statement Showpiece',     1200.00, '5-tier luxury wedding centrepiece',      ARRAY['5 tiers','Bespoke sculpted design','Serves 150+','Premium sugar florals','Tasting session','Delivery & setup'], 0),
  -- Fatima Hosts
  (vendor10, 'Wedding MC',              350.00,  '4-hour ceremony and reception hosting',  ARRAY['Pre-event consultation','Ceremony MC','Reception announcements','4h coverage'],                                  4),
  (vendor10, 'Full Day Host',           650.00,  'Ceremony through to evening',            ARRAY['Pre-event meeting','Ceremony','Reception','Evening entertainment','8h coverage'],                                8),
  (vendor10, 'Corporate Events',        800.00,  'Awards, galas and corporate dinners',    ARRAY['Script writing','Agenda management','Awards/gala hosting','AV coordination','Up to 10h'],                      10),
  -- Canvas & Canopy
  (vendor11, 'Tipi Hire (50 guests)',   1800.00, 'Single tipi for intimate events',        ARRAY['20m tipi','Groundsheet','Festoon lighting','Delivery, setup & teardown'],                                      0),
  (vendor11, 'Clear-Span Marquee',      4500.00, 'Modern clear-span for 150 guests',      ARRAY['15x20m marquee','Flooring','Lining','LED lighting','Setup & teardown'],                                        0),
  (vendor11, 'Full Venue Solution',     8500.00, 'Marquee + full interior styling',        ARRAY['Bespoke marquee','Full flooring','Starlight lining','Furniture','Heating','Lighting','Bar'],                   0),
  -- Neon Nights Events
  (vendor12, 'Uplighting Package',      500.00,  'Colour-wash uplighting for any venue',   ARRAY['20 uplights','Colour programme','Setup & control','12h hire'],                                                  0),
  (vendor12, 'Full Wedding Lighting',   1500.00, 'Complete wedding lighting design',       ARRAY['Uplighting','Starlight backdrop','LED dancefloor','Monogram projection','Setup'],                              0),
  (vendor12, 'Production Package',      3200.00, 'Full AV, staging, and lighting',         ARRAY['Stage','AV system','Intelligent lighting rig','LED dancefloor','Engineer on-site'],                            0),
  -- Pop & Bloom
  (vendor13, 'Balloon Garland',         200.00,  'Organic balloon garland to hire',        ARRAY['3m organic garland','Colour matched','Installation','Collection'],                                               0),
  (vendor13, 'Room Transform',          450.00,  'Full balloon styling for your venue',    ARRAY['Arch','Ceiling install','Table clusters','Giant numbers/letters','Setup'],                                      0),
  (vendor13, 'Premium Party Package',   750.00,  'Statement installation with extras',     ARRAY['Grand arch','360 balloon ceiling','Photo wall','Personalised sign','Setup & teardown'],                         0),
  -- Premier Arrivals
  (vendor14, 'Rolls-Royce Hire',        450.00,  '3-hour wedding car hire',                ARRAY['Rolls-Royce Ghost','Uniformed chauffeur','Ribbon & floral dressing','3h hire','Champagne'],                    3),
  (vendor14, 'Bridal Fleet (2 cars)',   750.00,  'Bridal party fleet hire',               ARRAY['2 luxury vehicles','Chauffeurs','Ribbon dressing','4h hire','Champagne for bride'],                             4),
  (vendor14, 'Full Wedding Day',        1100.00, 'All-day wedding transportation',         ARRAY['Full day 8am-11pm','Multiple vehicles','Chauffeurs','Guest pickups','Decor'],                                  12),
  -- ProStaff Yorkshire
  (vendor15, 'Bar Staff (4h)',          400.00,  'Trained bar staff for your event',       ARRAY['2 bar staff','4h service','Uniform provided','Setup & breakdown'],                                              4),
  (vendor15, 'Waitstaff Package',       600.00,  'Silver-service waitstaff',               ARRAY['4 waitstaff','6h service','Silver service trained','Uniform'],                                                  6),
  (vendor15, 'Full Event Team',         1800.00, 'Complete event staffing solution',       ARRAY['Event coordinator','6 waitstaff','2 bar staff','Ushers x2','Setup crew','10h coverage'],                       10)
ON CONFLICT DO NOTHING;

-- ─── Step 4: Media ────────────────────────────────────────────────────────────
INSERT INTO vendor_media (vendor_id, url, type, caption, is_cover) VALUES
  -- Aisha Films
  (vendor6,  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800', 'image', 'Cinematic wedding moment',       true),
  (vendor6,  'https://images.unsplash.com/photo-1478720568477-152d9b21b0b8?w=800', 'image', 'Documentary-style ceremony',     false),
  (vendor6,  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800', 'image', 'Behind the scenes edit suite',   false),
  -- The Prestige Band
  (vendor7,  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800', 'image', 'Band performing at wedding',     true),
  (vendor7,  'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800', 'image', 'Dancefloor packed all night',    false),
  (vendor7,  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', 'image', 'Band on corporate stage',        false),
  -- Glow by Grace
  (vendor8,  'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=800', 'image', 'Bridal makeup artistry',         true),
  (vendor8,  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800', 'image', 'Natural glam finish',            false),
  (vendor8,  'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800', 'image', 'Bridal party ready',             false),
  -- Theo Couture Cakes
  (vendor9,  'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800', 'image', 'Four-tier wedding cake',         true),
  (vendor9,  'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800', 'image', 'Sugar florals closeup',          false),
  (vendor9,  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800', 'image', 'Birthday celebration cake',     false),
  -- Fatima Hosts
  (vendor10, 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', 'image', 'Hosting a gala dinner',          true),
  (vendor10, 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800', 'image', 'Wedding MC in action',           false),
  -- Canvas & Canopy
  (vendor11, 'https://images.unsplash.com/photo-1478547920949-4f26b6c94e87?w=800', 'image', 'Outdoor wedding marquee',        true),
  (vendor11, 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800', 'image', 'Tipi interior styling',          false),
  (vendor11, 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800', 'image', 'Elegant marquee reception',      false),
  -- Neon Nights Events
  (vendor12, 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?w=800', 'image', 'Dramatic uplighting display',    true),
  (vendor12, 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800', 'image', 'LED dancefloor wedding',         false),
  (vendor12, 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800', 'image', 'Starlight backdrop installation', false),
  -- Pop & Bloom
  (vendor13, 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800', 'image', 'Organic balloon garland',        true),
  (vendor13, 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800', 'image', 'Giant number installation',      false),
  -- Premier Arrivals
  (vendor14, 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800', 'image', 'Rolls-Royce Phantom wedding car', true),
  (vendor14, 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800', 'image', 'Luxury Bentley wedding arrival', false),
  -- ProStaff Yorkshire
  (vendor15, 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800', 'image', 'Silver service wedding staff',   true),
  (vendor15, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', 'image', 'Bar staff in action',            false)
ON CONFLICT DO NOTHING;

-- ─── Step 5: Additional Reviews ──────────────────────────────────────────────
-- Add reviews from existing customers to new vendors (via completed bookings that happened "in the past")
-- We insert bookings in completed state to allow reviews

-- Emily's (c1) wedding used the band, videographer, cake, transport
INSERT INTO bookings (customer_id, vendor_id, event_id, total_amount, deposit_amount, vendor_payout, commission_amount, status, payment_status, notes)
VALUES
  (c1_id, vendor6,  event1, 1400.00, 420.00, 1260.00, 140.00, 'completed', 'fully_paid', 'Full Story Film for Emily & Tom wedding.'),
  (c1_id, vendor7,  event1, 2500.00, 750.00, 2250.00, 250.00, 'completed', 'fully_paid', 'Evening party package for reception.'),
  (c1_id, vendor9,  event1,  600.00, 180.00,  540.00,  60.00, 'completed', 'fully_paid', '3-tier wedding cake.'),
  (c1_id, vendor14, event1,  750.00, 225.00,  675.00,  75.00, 'completed', 'fully_paid', 'Bridal fleet hire.')
ON CONFLICT DO NOTHING;

-- Oliver's (c2) birthday used makeup, balloon, lighting, MC
INSERT INTO bookings (customer_id, vendor_id, event_id, total_amount, deposit_amount, vendor_payout, commission_amount, status, payment_status, notes)
VALUES
  (c2_id, vendor8,  event2,  480.00, 144.00,  432.00,  48.00, 'completed', 'fully_paid', 'Party makeup for birthday hosts.'),
  (c2_id, vendor12, event2,  500.00, 150.00,  450.00,  50.00, 'completed', 'fully_paid', 'Uplighting for birthday venue.'),
  (c2_id, vendor13, event2,  450.00, 135.00,  405.00,  45.00, 'completed', 'fully_paid', 'Balloon room transform.')
ON CONFLICT DO NOTHING;

-- Priya's (c3) baby shower used balloon, cake, makeup
INSERT INTO bookings (customer_id, vendor_id, event_id, total_amount, deposit_amount, vendor_payout, commission_amount, status, payment_status, notes)
VALUES
  (c3_id, vendor13, event3,  200.00,  60.00,  180.00,  20.00, 'completed', 'fully_paid', 'Balloon garland for baby shower.'),
  (c3_id, vendor9,  event3,  200.00,  60.00,  180.00,  20.00, 'completed', 'fully_paid', 'Celebration cake for baby shower.')
ON CONFLICT DO NOTHING;

-- ─── Reviews from existing customers ─────────────────────────────────────────
INSERT INTO reviews (booking_id, customer_id, vendor_id, rating, comment, response)
SELECT b.id, c1_id, vendor6, 5,
  'Aisha Films exceeded every expectation. The highlight film made us cry with joy — she captured moments we didn''t even know were being filmed. Absolutely stunning work. Every couple needs a videographer of this calibre.',
  'Emily and Tom — thank you so much! Your day was truly magical and I felt honoured to be part of it. Best wishes for your future together!'
FROM bookings b WHERE b.customer_id = c1_id AND b.vendor_id = vendor6 LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO reviews (booking_id, customer_id, vendor_id, rating, comment, response)
SELECT b.id, c1_id, vendor7, 5,
  'The Prestige Band were absolutely phenomenal. Every single guest danced all night. The lead singer''s voice is incredible and they played every request. Worth every penny and more.',
  'Emily, thank you for having us! Your guests were incredible — the energy in the room was electric. We wish you a lifetime of happiness!'
FROM bookings b WHERE b.customer_id = c1_id AND b.vendor_id = vendor7 LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO reviews (booking_id, customer_id, vendor_id, rating, comment, response)
SELECT b.id, c1_id, vendor9, 5,
  'Theo''s cake was almost too beautiful to eat — but we did, and it tasted even better than it looked! Three layers of different flavours, all perfect. The sugar florals were indistinguishable from real flowers.',
  'Thank you Emily! Creating your cake was such a joy. Wishing you a lifetime as sweet as your wedding day!'
FROM bookings b WHERE b.customer_id = c1_id AND b.vendor_id = vendor9 LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO reviews (booking_id, customer_id, vendor_id, rating, comment, response)
SELECT b.id, c1_id, vendor14, 5,
  'Premier Arrivals were flawless. The Rolls-Royce was immaculate and the chauffeur was so professional and kind. I felt like royalty on my wedding day. The car decorations were gorgeous.',
  'Emily, it was a privilege to be part of your special day. You looked absolutely stunning — congratulations!'
FROM bookings b WHERE b.customer_id = c1_id AND b.vendor_id = vendor14 LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO reviews (booking_id, customer_id, vendor_id, rating, comment, response)
SELECT b.id, c2_id, vendor8, 4,
  'Grace and her team were professional and friendly. My makeup lasted all night through dancing and everything! Would definitely book again for the next big occasion.',
  'Thank you Oliver! So glad you had a brilliant night — you looked fantastic! 🎉'
FROM bookings b WHERE b.customer_id = c2_id AND b.vendor_id = vendor8 LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO reviews (booking_id, customer_id, vendor_id, rating, comment, response)
SELECT b.id, c2_id, vendor12, 5,
  'Neon Nights transformed our venue completely. The uplighting matched our colour scheme perfectly and the LED dancefloor was the talk of the evening. Setup was quick and professional.',
  'Thanks so much Oliver! Loved working with you — that colour scheme was bold and it worked perfectly!'
FROM bookings b WHERE b.customer_id = c2_id AND b.vendor_id = vendor12 LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO reviews (booking_id, customer_id, vendor_id, rating, comment, response)
SELECT b.id, c2_id, vendor13, 5,
  'Pop & Bloom created the most incredible balloon installation! The room looked totally transformed. Everyone was taking photos in front of the arch. Great value and the team were lovely.',
  'Thank you Oliver! Loved making your birthday extra special — those colours were perfect!'
FROM bookings b WHERE b.customer_id = c2_id AND b.vendor_id = vendor13 LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO reviews (booking_id, customer_id, vendor_id, rating, comment, response)
SELECT b.id, c3_id, vendor9, 5,
  'The baby shower cake was absolutely gorgeous — soft pink and gold with little fondant booties. All my guests were amazed. The flavour was divine. Highly recommend Theo for any celebration!',
  'Congratulations Priya! It was such a pleasure creating your baby shower cake. Wishing you and your little one all the happiness in the world!'
FROM bookings b WHERE b.customer_id = c3_id AND b.vendor_id = vendor9 LIMIT 1
ON CONFLICT DO NOTHING;

END $$;
