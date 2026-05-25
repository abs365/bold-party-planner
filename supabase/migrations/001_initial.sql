-- Bold Party Event Planner - Initial Schema

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Vendors
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'dj','decorator','caterer','photographer','videographer','mc',
    'security','usher','makeup_artist','cake_maker','balloon_decorator',
    'lighting_stage','furniture_rental','marquee_rental','live_band',
    'luxury_services','transport','cleaner','event_staff'
  )),
  bio TEXT,
  location TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  travel_radius_km INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  verified BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  instagram_url TEXT,
  website_url TEXT,
  years_experience INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor media (photos & videos)
CREATE TABLE vendor_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image','video')),
  caption TEXT,
  is_cover BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor packages
CREATE TABLE vendor_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_hours DECIMAL(4,1),
  includes TEXT[] DEFAULT '{}',
  is_popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor availability
CREATE TABLE vendor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  notes TEXT,
  UNIQUE (vendor_id, date)
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'birthday','wedding','corporate','baby_shower','anniversary','graduation',
    'naming_ceremony','funeral','charity','conference','engagement','gender_reveal','other'
  )),
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  venue_name TEXT,
  venue_address TEXT,
  city TEXT NOT NULL DEFAULT '',
  guest_count INTEGER NOT NULL DEFAULT 50,
  budget DECIMAL(10,2) NOT NULL DEFAULT 1000,
  theme TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','planning','confirmed','completed','cancelled')),
  ai_plan JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  package_id UUID REFERENCES vendor_packages(id),
  customer_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','accepted','rejected','confirmed','completed','cancelled','disputed'
  )),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
    'pending','deposit_paid','fully_paid','refunded','partially_refunded','failed'
  )),
  total_amount DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  vendor_payout DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  customer_notes TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit','full','refund')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','succeeded','failed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  line_items JSONB DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update vendor rating
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendors SET
    rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE vendor_id = NEW.vendor_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE vendor_id = NEW.vendor_id)
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_review_insert
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_vendor_rating();

-- Disputes
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  raised_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','closed')),
  resolution TEXT,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('booking','payment','review','reminder','system')),
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contracts
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id),
  content TEXT NOT NULL,
  customer_signed_at TIMESTAMPTZ,
  vendor_signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_vendors_category ON vendors(category);
CREATE INDEX idx_vendors_city ON vendors(city);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_rating ON vendors(rating DESC);
CREATE INDEX idx_vendor_media_vendor_id ON vendor_media(vendor_id);
CREATE INDEX idx_events_customer_id ON events(customer_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_bookings_event_id ON bookings(event_id);
CREATE INDEX idx_bookings_vendor_id ON bookings(vendor_id);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id, read);
CREATE INDEX idx_reviews_vendor_id ON reviews(vendor_id);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: users see own, admins see all
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);

-- Vendors: public read for approved, vendor manages own, admin manages all
CREATE POLICY "vendors_public_read" ON vendors FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);
CREATE POLICY "vendors_own_write" ON vendors FOR ALL USING (auth.uid() = user_id);

-- Vendor media: public read, vendor manages own
CREATE POLICY "vendor_media_public_read" ON vendor_media FOR SELECT USING (true);
CREATE POLICY "vendor_media_own_write" ON vendor_media FOR ALL
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Vendor packages: public read, vendor manages own
CREATE POLICY "vendor_packages_public_read" ON vendor_packages FOR SELECT USING (true);
CREATE POLICY "vendor_packages_own_write" ON vendor_packages FOR ALL
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Vendor availability: public read, vendor manages own
CREATE POLICY "vendor_availability_public_read" ON vendor_availability FOR SELECT USING (true);
CREATE POLICY "vendor_availability_own_write" ON vendor_availability FOR ALL
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Events: customer sees own, vendors see events they have bookings for
CREATE POLICY "events_own" ON events FOR ALL USING (auth.uid() = customer_id);

-- Bookings: customers and vendors see their own
CREATE POLICY "bookings_customer" ON bookings FOR ALL USING (auth.uid() = customer_id);
CREATE POLICY "bookings_vendor" ON bookings FOR ALL
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Payments: customer or vendor can see
CREATE POLICY "payments_read" ON payments FOR SELECT
  USING (booking_id IN (
    SELECT id FROM bookings WHERE customer_id = auth.uid()
    OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  ));

-- Invoices: customer or vendor can see own
CREATE POLICY "invoices_read" ON invoices FOR SELECT
  USING (auth.uid() = customer_id OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Reviews: public read, customer writes own
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_customer_write" ON reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "reviews_vendor_response" ON reviews FOR UPDATE
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Notifications: own only
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Disputes: customer or vendor involved
CREATE POLICY "disputes_read" ON disputes FOR SELECT
  USING (auth.uid() = raised_by OR booking_id IN (
    SELECT id FROM bookings WHERE customer_id = auth.uid()
    OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  ));
CREATE POLICY "disputes_insert" ON disputes FOR INSERT WITH CHECK (auth.uid() = raised_by);

-- Contracts: customer or vendor involved
CREATE POLICY "contracts_read" ON contracts FOR SELECT
  USING (booking_id IN (
    SELECT id FROM bookings WHERE customer_id = auth.uid()
    OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  ));

-- Helper function: notify user
CREATE OR REPLACE FUNCTION notify_user(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_link TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
