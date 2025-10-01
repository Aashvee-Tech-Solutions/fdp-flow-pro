-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE fdp_status AS ENUM ('draft', 'published', 'ongoing', 'completed', 'cancelled');
CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE registration_type AS ENUM ('host', 'faculty_individual', 'faculty_under_host');

-- FDP Events Table
CREATE TABLE public.fdp_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  timing TEXT,
  location TEXT NOT NULL,
  categories TEXT[] DEFAULT '{}',
  host_fee DECIMAL(10,2) NOT NULL,
  faculty_fee DECIMAL(10,2) NOT NULL,
  highlights TEXT[] DEFAULT '{}',
  status fdp_status DEFAULT 'draft',
  max_participants INTEGER,
  registered_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Host Colleges Table
CREATE TABLE public.host_colleges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fdp_event_id UUID NOT NULL REFERENCES public.fdp_events(id) ON DELETE CASCADE,
  college_name TEXT NOT NULL,
  address TEXT NOT NULL,
  website TEXT,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  logo_url TEXT,
  registration_status registration_status DEFAULT 'pending',
  payment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Faculty Registrations Table
CREATE TABLE public.faculty_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fdp_event_id UUID NOT NULL REFERENCES public.fdp_events(id) ON DELETE CASCADE,
  host_college_id UUID REFERENCES public.host_colleges(id) ON DELETE SET NULL,
  registration_type registration_type NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  designation TEXT NOT NULL,
  department TEXT NOT NULL,
  institution TEXT NOT NULL,
  registration_status registration_status DEFAULT 'pending',
  payment_id UUID,
  attendance_marked BOOLEAN DEFAULT FALSE,
  feedback_submitted BOOLEAN DEFAULT FALSE,
  certificate_issued BOOLEAN DEFAULT FALSE,
  certificate_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments Table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fdp_event_id UUID NOT NULL REFERENCES public.fdp_events(id) ON DELETE CASCADE,
  registration_id UUID,
  registration_type registration_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_status payment_status DEFAULT 'pending',
  payment_gateway TEXT DEFAULT 'cashfree',
  transaction_id TEXT,
  payment_method TEXT,
  payment_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback Table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fdp_event_id UUID NOT NULL REFERENCES public.fdp_events(id) ON DELETE CASCADE,
  faculty_registration_id UUID NOT NULL REFERENCES public.faculty_registrations(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  suggestions TEXT,
  feedback_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communication Logs Table
CREATE TABLE public.communication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fdp_event_id UUID REFERENCES public.fdp_events(id) ON DELETE CASCADE,
  recipient_email TEXT,
  recipient_phone TEXT,
  communication_type TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.fdp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fdp_events (public read, admin write)
CREATE POLICY "FDP events are viewable by everyone"
  ON public.fdp_events FOR SELECT
  USING (status = 'published');

CREATE POLICY "Only authenticated users can manage FDP events"
  ON public.fdp_events FOR ALL
  USING (auth.role() = 'authenticated');

-- RLS Policies for host_colleges
CREATE POLICY "Host colleges can view their own data"
  ON public.host_colleges FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can insert host college registration"
  ON public.host_colleges FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can update host colleges"
  ON public.host_colleges FOR UPDATE
  USING (auth.role() = 'authenticated');

-- RLS Policies for faculty_registrations
CREATE POLICY "Faculty can view their own registrations"
  ON public.faculty_registrations FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can insert faculty registration"
  ON public.faculty_registrations FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can update faculty registrations"
  ON public.faculty_registrations FOR UPDATE
  USING (auth.role() = 'authenticated');

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can update payments"
  ON public.payments FOR UPDATE
  USING (auth.role() = 'authenticated');

-- RLS Policies for feedback
CREATE POLICY "Anyone can submit feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can view all feedback"
  ON public.feedback FOR SELECT
  USING (auth.role() = 'authenticated');

-- RLS Policies for communication_logs
CREATE POLICY "Only authenticated users can access communication logs"
  ON public.communication_logs FOR ALL
  USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX idx_fdp_events_status ON public.fdp_events(status);
CREATE INDEX idx_fdp_events_dates ON public.fdp_events(start_date, end_date);
CREATE INDEX idx_host_colleges_fdp ON public.host_colleges(fdp_event_id);
CREATE INDEX idx_faculty_registrations_fdp ON public.faculty_registrations(fdp_event_id);
CREATE INDEX idx_faculty_registrations_host ON public.faculty_registrations(host_college_id);
CREATE INDEX idx_payments_registration ON public.payments(registration_id);
CREATE INDEX idx_feedback_fdp ON public.feedback(fdp_event_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_fdp_events_updated_at BEFORE UPDATE ON public.fdp_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_host_colleges_updated_at BEFORE UPDATE ON public.host_colleges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faculty_registrations_updated_at BEFORE UPDATE ON public.faculty_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO public.fdp_events (title, description, banner_url, start_date, end_date, timing, location, categories, host_fee, faculty_fee, highlights, status, registered_count)
VALUES 
(
  'NAAC Accreditation Workshop 2025',
  'Comprehensive workshop on NAAC accreditation process, criteria, and best practices for quality enhancement in higher education institutions.',
  '/placeholder.svg',
  '2025-01-15 09:00:00+05:30',
  '2025-01-17 17:00:00+05:30',
  '9:00 AM - 5:00 PM IST',
  'Online (Zoom)',
  ARRAY['NAAC', 'Accreditation', 'Quality Assurance'],
  5000.00,
  1500.00,
  ARRAY['Understanding NAAC framework and criteria', 'Documentation and evidence collection', 'Self-assessment report preparation', 'Mock peer team visits', 'Best practices and case studies'],
  'published',
  145
),
(
  'NBA Program Accreditation Training',
  'In-depth training on NBA accreditation for engineering programs, focusing on outcome-based education and continuous quality improvement.',
  '/placeholder.svg',
  '2025-02-10 09:00:00+05:30',
  '2025-02-12 17:00:00+05:30',
  '9:00 AM - 5:00 PM IST',
  'Hybrid (Bangalore & Online)',
  ARRAY['NBA', 'Engineering', 'Quality'],
  6000.00,
  1800.00,
  ARRAY['NBA framework and tier system', 'Program outcomes and assessment', 'Continuous quality improvement', 'SAR preparation and documentation', 'Interactive sessions with NBA experts'],
  'published',
  98
);