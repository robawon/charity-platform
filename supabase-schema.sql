-- ============================================
-- CHARITY TICKET PLATFORM - SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'seller')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  ticket_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  deadline TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FORM FIELDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.form_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'email', 'number', 'tel', 'textarea')),
  is_required BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WINNERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE UNIQUE,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
  selected_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow insert on signup" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- EVENTS policies
CREATE POLICY "Anyone can read active events" ON public.events
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage events" ON public.events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- FORM FIELDS policies
CREATE POLICY "Anyone can read form fields" ON public.form_fields
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage form fields" ON public.form_fields
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- SUBMISSIONS policies
CREATE POLICY "Anyone can insert submissions" ON public.submissions
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Sellers can view own submissions" ON public.submissions
  FOR SELECT USING (
    seller_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Sellers can update own submissions" ON public.submissions
  FOR UPDATE USING (
    seller_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- WINNERS policies
CREATE POLICY "Anyone can view winners" ON public.winners
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage winners" ON public.winners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- SEED DATA (Optional - demo admin user)
-- ============================================
-- After creating a user via Supabase Auth, run:
-- INSERT INTO public.users (id, name, email, role)
-- VALUES ('your-auth-user-uuid', 'Admin Name', 'admin@example.com', 'admin');
