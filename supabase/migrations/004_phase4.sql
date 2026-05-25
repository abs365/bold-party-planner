-- Bold Party Planner - Phase 4 Migration
-- Subscriptions, Messaging, Analytics, Smart Concierge, Availability, Trust, Notifications

-- ─── Drop the view FIRST so column changes don't conflict ────────────────────
DROP VIEW IF EXISTS platform_stats;

-- ─── 1. Vendor Subscriptions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'featured')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (vendor_id)
);

-- ─── 2. Message Threads ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  subject TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_by_customer BOOLEAN DEFAULT FALSE,
  read_by_vendor BOOLEAN DEFAULT FALSE,
  attachment_url TEXT,
  attachment_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. Smart Concierge Chat History ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS smart_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. Vendor Analytics Events ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('profile_view', 'quote_request', 'booking_created', 'media_view', 'contact_click', 'package_view')),
  visitor_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_analytics_vendor_date ON vendor_analytics(vendor_id, created_at DESC);

-- ─── 5. Availability — extend existing if needed ──────────────────────────────
ALTER TABLE vendor_availability
  ADD COLUMN IF NOT EXISTS slots_available INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS reason TEXT;

-- ─── 6. Vendor Verification ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('identity', 'business', 'insurance', 'portfolio')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'not_submitted')),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewer_id UUID REFERENCES profiles(id),
  notes TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (vendor_id, type)
);

-- ─── 7. Audit Logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 8. Notification enhancements ─────────────────────────────────────────────
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS action_label TEXT,
  ADD COLUMN IF NOT EXISTS action_url TEXT;

-- ─── 9. Vendor profile view counter ──────────────────────────────────────────
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'featured'));

-- ─── 10. Event progress tracking ─────────────────────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS progress_pct INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS venue_confirmed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS catering_confirmed BOOLEAN DEFAULT FALSE;

-- ─── 11. RLS Policies ────────────────────────────────────────────────────────

ALTER TABLE vendor_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vendors manage own subscription" ON vendor_subscriptions;
CREATE POLICY "Vendors manage own subscription" ON vendor_subscriptions
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Thread participants can read" ON message_threads;
CREATE POLICY "Thread participants can read" ON message_threads
  USING (customer_id = auth.uid() OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Message participants can read" ON messages;
CREATE POLICY "Message participants can read" ON messages
  USING (thread_id IN (
    SELECT id FROM message_threads
    WHERE customer_id = auth.uid() OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  ));
DROP POLICY IF EXISTS "Participants can insert messages" ON messages;
CREATE POLICY "Participants can insert messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    thread_id IN (
      SELECT id FROM message_threads
      WHERE customer_id = auth.uid() OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    )
  );

ALTER TABLE smart_chat_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own chat history" ON smart_chat_history;
CREATE POLICY "Users see own chat history" ON smart_chat_history
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users insert own chat history" ON smart_chat_history;
CREATE POLICY "Users insert own chat history" ON smart_chat_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

ALTER TABLE vendor_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vendors read own analytics" ON vendor_analytics;
CREATE POLICY "Vendors read own analytics" ON vendor_analytics
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Authenticated insert analytics" ON vendor_analytics;
CREATE POLICY "Authenticated insert analytics" ON vendor_analytics
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE vendor_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vendors read own verifications" ON vendor_verifications;
CREATE POLICY "Vendors read own verifications" ON vendor_verifications
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read audit logs" ON audit_logs;
CREATE POLICY "Admins read audit logs" ON audit_logs
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── 12. Recreate platform_stats view with Phase 4 columns ──────────────────
CREATE VIEW platform_stats AS
SELECT
  (SELECT COUNT(*) FROM profiles WHERE role = 'customer') AS total_customers,
  (SELECT COUNT(*) FROM vendors) AS total_vendors,
  (SELECT COUNT(*) FROM vendors WHERE status = 'approved') AS approved_vendors,
  (SELECT COUNT(*) FROM vendors WHERE status = 'pending') AS pending_vendors,
  (SELECT COUNT(*) FROM events) AS total_events,
  (SELECT COUNT(*) FROM bookings) AS total_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'completed') AS completed_bookings,
  (SELECT COALESCE(SUM(commission_amount),0) FROM bookings WHERE payment_status IN ('deposit_paid','fully_paid')) AS total_revenue,
  (SELECT COALESCE(SUM(total_amount),0) FROM bookings WHERE payment_status = 'fully_paid') AS total_gmv,
  (SELECT COUNT(*) FROM disputes WHERE status = 'open') AS open_disputes,
  (SELECT COALESCE(AVG(rating), 0) FROM vendors WHERE status = 'approved' AND rating > 0) AS avg_vendor_rating,
  (SELECT COUNT(*) FROM quotes WHERE status = 'pending') AS pending_quotes,
  (SELECT COUNT(*) FROM message_threads) AS total_message_threads;

-- ─── 13. Helper function: increment profile views ────────────────────────────
CREATE OR REPLACE FUNCTION increment_vendor_profile_views(p_vendor_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE vendors SET profile_views = COALESCE(profile_views, 0) + 1 WHERE id = p_vendor_id;
  INSERT INTO vendor_analytics (vendor_id, event_type) VALUES (p_vendor_id, 'profile_view');
END;
$$;