-- Bold Party Planner - Demo Seed Data (UK Event Marketplace)
--
-- SETUP ORDER:
--   1. Run ALL migrations (001 through 017) in Supabase Dashboard SQL Editor
--   2. POST /api/auth/create-demo-users  ← creates auth.users via Admin API
--   3. Run this seed.sql                 ← creates profiles (ON CONFLICT skip),
--                                           vendors, events, bookings, etc.
--
-- auth.users and auth.identities are intentionally NOT created here.
-- GoTrue requires clean rows created via its own API to authenticate correctly.
-- Direct auth.users inserts produce corrupt internal state that breaks signIn.
--
-- Safe to re-run (uses ON CONFLICT DO NOTHING throughout).
--
-- Enum values used here must match DB CHECK constraints:
--   vendor_media.type  → 'image' | 'video'   (NOT 'photo')
--   events.status      → 'draft' | 'planning' | 'confirmed' | 'completed' | 'cancelled'
--   bookings.status    → 'pending' | 'accepted' | 'rejected' | 'confirmed' | 'completed' | 'cancelled' | 'disputed'
--   bookings.payment_status → 'pending' | 'deposit_paid' | 'fully_paid' | 'refunded' | 'partially_refunded' | 'failed'
--   vendors.status     → 'pending' | 'approved' | 'rejected' | 'suspended'
--   quotes.status      → 'pending' | 'responded' | 'accepted' | 'declined' | 'expired' | 'converted'

DO $$
DECLARE
  v1_id UUID := 'a0000001-0000-0000-0000-000000000001';
  v2_id UUID := 'a0000002-0000-0000-0000-000000000002';
  v3_id UUID := 'a0000003-0000-0000-0000-000000000003';
  v4_id UUID := 'a0000004-0000-0000-0000-000000000004';
  v5_id UUID := 'a0000005-0000-0000-0000-000000000005';
  c1_id UUID := 'b0000001-0000-0000-0000-000000000001';
  c2_id UUID := 'b0000002-0000-0000-0000-000000000002';
  c3_id UUID := 'b0000003-0000-0000-0000-000000000003';

  vendor1 UUID;
  vendor2 UUID;
  vendor3 UUID;
  vendor4 UUID;
  vendor5 UUID;
  event1 UUID;
  event2 UUID;
  event3 UUID;
  booking1 UUID;
BEGIN

-- ─── Step 1: Profiles ─────────────────────────────────────────────────────────
-- If your handle_new_user trigger already created these, this will skip them
INSERT INTO profiles (id, full_name, email, role, avatar_url) VALUES
  (v1_id, 'James Bennett', 'james.bennett@elbold.demo', 'vendor', NULL),
  (v2_id, 'Sofia Martinez', 'sofia.martinez@elbold.demo', 'vendor', NULL),
  (v3_id, 'Ravi Patel', 'ravi.patel@elbold.demo', 'vendor', NULL),
  (v4_id, 'Charlotte Hughes', 'charlotte.hughes@elbold.demo', 'vendor', NULL),
  (v5_id, 'Marcus Thompson', 'marcus.thompson@elbold.demo', 'vendor', NULL),
  (c1_id, 'Emily Carter', 'emily.carter@elbold.demo', 'customer', NULL),
  (c2_id, 'Oliver Webb', 'oliver.webb@elbold.demo', 'customer', NULL),
  (c3_id, 'Priya Singh', 'priya.singh@elbold.demo', 'customer', NULL)
ON CONFLICT (id) DO NOTHING;

-- ─── Step 2: Vendors ──────────────────────────────────────────────────────────
INSERT INTO vendors (user_id, business_name, tagline, category, bio, city, address, phone, travel_radius_km, status, rating, review_count, total_reviews, min_price, max_price, verified, featured, years_experience, event_types, instagram_url, website_url)
VALUES
  (v1_id, 'Bennett Visuals', 'Capturing moments that last a lifetime', 'photographer', 'Award-winning wedding and events photographer based in London. Specialising in natural, candid photography with a fine-art twist. Over 300 weddings photographed across the UK and Europe.', 'London', '12 Camera Lane, Shoreditch, E1 6RF', '+44 7700 900001', 80, 'approved', 4.9, 127, 127, 800, 3500, true, true, 12, ARRAY['wedding','anniversary','engagement','corporate'], 'https://instagram.com/bennettvisuals', 'https://bennettvisuals.co.uk'),
  (v2_id, 'Sofia Blooms', 'Flowers that tell your story', 'decorator', 'Bespoke floral design studio in Manchester. From intimate table centrepieces to grand ceremony arches, we create breathtaking floral installations tailored to your vision and budget.', 'Manchester', '8 Petal Street, Didsbury, M20 2AB', '+44 7700 900002', 60, 'approved', 4.7, 89, 89, 400, 2000, true, false, 8, ARRAY['wedding','birthday','corporate','anniversary'], NULL, 'https://sofiablooms.co.uk'),
  (v3_id, 'Spice & Grace Catering', 'Authentic flavours, elegant presentation', 'caterer', 'Multi-award winning catering company specialising in South Asian cuisine and fusion menus. Fully licensed and insured. Minimum 50 guests. Serving Birmingham and the Midlands.', 'Birmingham', '45 Curry Mile, Sparkbrook, B11 1AL', '+44 7700 900003', 100, 'approved', 4.8, 64, 64, 1500, 8000, true, true, 15, ARRAY['wedding','corporate','birthday','graduation'], NULL, NULL),
  (v4_id, 'Charlotte DJ Services', 'Your soundtrack to the perfect night', 'dj', 'Professional mobile DJ with residencies at top London venues. Specialist in weddings, corporate events, and private parties. Full PA, lighting rig, and photo booth available.', 'London', NULL, '+44 7700 900004', 120, 'approved', 4.6, 203, 203, 300, 1200, false, false, 6, ARRAY['wedding','birthday','corporate','hen_party','christmas_party'], 'https://instagram.com/charlottedj', NULL),
  (v5_id, 'Marcus Events Decor', 'Transforming spaces into experiences', 'decorator', 'Full event decoration and styling service based in Leeds. Specialising in balloon installations, linen hire, centrepieces, and LED backdrops. Setup and teardown included in all packages.', 'Leeds', '22 Decor Drive, Headingley, LS6 3PQ', '+44 7700 900005', 80, 'approved', 4.5, 47, 47, 300, 2500, false, false, 4, ARRAY['wedding','birthday','corporate','baby_shower','graduation'], 'https://instagram.com/marcusdecor', NULL)
ON CONFLICT DO NOTHING;

-- Capture vendor IDs
SELECT id INTO vendor1 FROM vendors WHERE user_id = v1_id;
SELECT id INTO vendor2 FROM vendors WHERE user_id = v2_id;
SELECT id INTO vendor3 FROM vendors WHERE user_id = v3_id;
SELECT id INTO vendor4 FROM vendors WHERE user_id = v4_id;
SELECT id INTO vendor5 FROM vendors WHERE user_id = v5_id;

-- ─── Step 3: Vendor Packages ──────────────────────────────────────────────────
-- Add max_guests column if it doesn't exist
ALTER TABLE vendor_packages ADD COLUMN IF NOT EXISTS max_guests INTEGER;

INSERT INTO vendor_packages (vendor_id, name, price, description, includes, duration_hours, max_guests) VALUES
  (vendor1, 'Essential Coverage', 800.00, 'Perfect for small intimate events', ARRAY['4 hours coverage','200 edited photos','Online gallery','USB stick'], 4, 50),
  (vendor1, 'Classic Package', 1500.00, 'Our most popular wedding package', ARRAY['8 hours coverage','500 edited photos','Engagement shoot','Two photographers','Online gallery','USB stick','Print album'], 8, 200),
  (vendor1, 'Premium Collection', 2800.00, 'Full-day luxury coverage', ARRAY['12 hours coverage','800+ edited photos','Engagement shoot','Two photographers','Drone footage','Online gallery','USB stick','Two print albums','Thank-you cards'], 12, 500),
  (vendor2, 'Bloom Basic', 400.00, 'Simple, elegant floral styling', ARRAY['Bride bouquet','2 bridesmaids bouquets','Buttonholes x5','Table centrepieces x5'], 0, 50),
  (vendor2, 'Full Ceremony Package', 900.00, 'Complete ceremony and reception flowers', ARRAY['Bride bouquet','Bridesmaids x4','Buttonholes x10','Ceremony arch','Table centrepieces x10','Pew ends'], 0, 100),
  (vendor2, 'Luxury Collection', 1800.00, 'Head-to-toe floral experience', ARRAY['All above plus','Floral installation','Flower wall 3mx2m','Bridal suite styling','Cake flowers'], 0, 250),
  (vendor3, 'Buffet Package', 1500.00, 'Abundant buffet selection (min 50 guests)', ARRAY['5 curry dishes','3 rice/bread options','Salads','Dessert selection','Serving staff','Equipment hire'], 0, 150),
  (vendor3, 'Sit-Down Dinner', 3500.00, 'Formal 3-course dinner service', ARRAY['Starter','Main course','Dessert','Serving staff','Crockery & linen','Event manager'], 0, 200),
  (vendor3, 'Full Event Catering', 7000.00, 'Complete catering from welcome drinks to dessert', ARRAY['Canapes on arrival','3-course dinner','Evening buffet','Bar service','Full staffing','Equipment'], 0, 300),
  (vendor4, 'Party Pack', 300.00, '4 hours of music', ARRAY['4 hours DJ','Basic PA system','Wireless mic','Song requests'], 4, 80),
  (vendor4, 'Wedding Package', 750.00, 'Full wedding DJ service', ARRAY['8 hours coverage','Premium PA','Full lighting rig','Wireless mics','First dance special','Consultation'], 8, 200),
  (vendor4, 'Premium Experience', 1200.00, 'Everything plus photo booth', ARRAY['10 hours','Premium PA','Full lighting rig','Wireless mics','Photo booth with props','Uplighting'], 10, 300),
  (vendor5, 'Starter Styling', 300.00, 'Simple, elegant decoration', ARRAY['Balloon arch','Table numbers','Chair sashes x50','Basic centrepieces x8'], 0, 80),
  (vendor5, 'Full Room Transform', 900.00, 'Complete venue styling', ARRAY['LED backdrop','Balloon installation','Table centrepieces x15','Chair covers x100','Fairy lights','Flower wall'], 0, 150),
  (vendor5, 'Luxury Styling', 2200.00, 'Premium full-venue transformation', ARRAY['All above plus','Custom neon sign','Giant letters/numbers','Premium linen','Ceiling drapes','Setup & teardown'], 0, 300)
ON CONFLICT DO NOTHING;

-- ─── Step 4: Vendor Media ─────────────────────────────────────────────────────
-- type must be 'image' or 'video' — matches CHECK constraint in 001_initial.sql
INSERT INTO vendor_media (vendor_id, url, type, caption, is_cover) VALUES
  (vendor1, 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800', 'image', 'Wedding couple portrait', true),
  (vendor1, 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800', 'image', 'Ceremony moment', false),
  (vendor1, 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800', 'image', 'Reception details', false),
  (vendor2, 'https://images.unsplash.com/photo-1487530811015-780a7a1e2289?w=800', 'image', 'Bridal bouquet', true),
  (vendor2, 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800', 'image', 'Ceremony arch', false),
  (vendor3, 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800', 'image', 'Catering spread', true),
  (vendor3, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', 'image', 'Plated dinner', false),
  (vendor4, 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800', 'image', 'DJ set', true),
  (vendor5, 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800', 'image', 'Balloon installation', true),
  (vendor5, 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800', 'image', 'LED backdrop', false)
ON CONFLICT DO NOTHING;

-- ─── Step 5: Events ───────────────────────────────────────────────────────────
-- status must match CHECK constraint in 001_initial.sql: ('draft','planning','confirmed','completed','cancelled')
INSERT INTO events (customer_id, title, date, city, event_type, guest_count, budget, status, preferences)
VALUES
  (c1_id, 'Emily & Tom''s Wedding', '2026-08-15', 'London', 'wedding', 120, 15000.00, 'planning', '{"style":"elegant","food_preference":"mixed","music":"live_and_dj","decoration":"luxurious"}'),
  (c2_id, 'Oliver''s 30th Birthday Bash', '2026-07-04', 'Manchester', 'birthday', 60, 3000.00, 'planning', '{"style":"modern","food_preference":"buffet","music":"dj","decoration":"balloons"}'),
  (c3_id, 'Priya''s Baby Shower', '2026-06-14', 'Birmingham', 'baby_shower', 40, 1500.00, 'planning', '{"style":"pastel_garden","food_preference":"afternoon_tea","music":"background","decoration":"floral"}')
ON CONFLICT DO NOTHING;

SELECT id INTO event1 FROM events WHERE customer_id = c1_id LIMIT 1;
SELECT id INTO event2 FROM events WHERE customer_id = c2_id LIMIT 1;
SELECT id INTO event3 FROM events WHERE customer_id = c3_id LIMIT 1;

-- ─── Step 6: Bookings ─────────────────────────────────────────────────────────
INSERT INTO bookings (customer_id, vendor_id, event_id, total_amount, deposit_amount, vendor_payout, commission_amount, status, payment_status, notes)
VALUES
  (c1_id, vendor1, event1, 1500.00, 450.00, 1350.00, 150.00, 'confirmed', 'deposit_paid', 'Classic package for Emily & Tom''s wedding. Confirmed via quote.'),
  (c1_id, vendor2, event1, 900.00, 270.00, 810.00, 90.00, 'confirmed', 'pending', 'Full ceremony flower package.'),
  (c2_id, vendor4, event2, 750.00, 225.00, 675.00, 75.00, 'completed', 'fully_paid', 'Wedding DJ package for Oliver''s party.'),
  (c3_id, vendor3, event3, 1500.00, 450.00, 1350.00, 150.00, 'accepted', 'deposit_paid', 'Buffet package for baby shower.')
ON CONFLICT DO NOTHING;

SELECT id INTO booking1 FROM bookings WHERE customer_id = c1_id AND vendor_id = vendor1;

-- ─── Step 7: Reviews ──────────────────────────────────────────────────────────
INSERT INTO reviews (booking_id, customer_id, vendor_id, rating, comment, response)
SELECT
  b.id,
  c2_id,
  vendor4,
  5,
  'Charlotte was absolutely amazing! She read the crowd perfectly and kept everyone on the dancefloor all night. The lighting setup was stunning and the photo booth was a huge hit. Would 100% recommend!',
  'Thank you so much Oliver! It was a fantastic evening and your guests were brilliant fun. Wishing you all the best for the year ahead!'
FROM bookings b
WHERE b.customer_id = c2_id AND b.vendor_id = vendor4
LIMIT 1
ON CONFLICT DO NOTHING;

-- ─── Step 8: Quotes ───────────────────────────────────────────────────────────
INSERT INTO quotes (customer_id, vendor_id, event_id, status, requirements, message, event_type, guest_count, budget_min, budget_max)
VALUES
  (c2_id, vendor5, event2, 'pending', 'Need a large balloon arch in blue and gold, table centrepieces for 8 tables, and chair sashes. Venue is The Palace Hotel Manchester.', 'Hi Marcus, I found your profile and love your work! Can you give me a quote for decorating my 30th birthday party?', 'birthday', 60, 500, 1200),
  (c3_id, vendor2, event3, 'responded', 'Soft pink and white flowers please. Need table centrepieces, welcome arch, and some hanging florals if possible. Baby girl theme.', 'Hello Sofia, would love to see if you can do a baby shower package?', 'baby_shower', 40, 300, 800)
ON CONFLICT DO NOTHING;

-- Add response to the responded quote
INSERT INTO quote_responses (quote_id, vendor_id, price, deposit_amount, message, includes, valid_until, status)
SELECT
  q.id,
  vendor2,
  650.00,
  195.00,
  'Hi Priya! Congratulations on your baby girl! I''d love to create something beautiful for your shower. The package below includes everything you''ve asked for in soft pink, blush, and white.',
  ARRAY['Welcome arch 2m x 2m','Table centrepieces x8','Hanging florals x3','Head table styling','Flower crown for mum-to-be'],
  (NOW() + INTERVAL '14 days')::DATE,
  'pending'
FROM quotes q
WHERE q.customer_id = c3_id AND q.vendor_id = vendor2
LIMIT 1
ON CONFLICT DO NOTHING;

UPDATE quotes SET status = 'responded'
WHERE customer_id = c3_id AND vendor_id = vendor2;

END $$;
