-- Initial marketplace schema for İşBul KKTC
-- Phase 2: persistence foundation and permission model

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE public.user_role AS ENUM ('candidate', 'employer', 'admin');
CREATE TYPE public.company_status AS ENUM ('pending', 'active', 'suspended', 'archived');
CREATE TYPE public.job_status AS ENUM ('draft', 'active', 'paused', 'filled', 'archived');
CREATE TYPE public.application_status AS ENUM ('submitted', 'reviewing', 'interview', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE public.payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded', 'requires_action');
CREATE TYPE public.notification_kind AS ENUM ('system', 'application', 'message', 'payment', 'job');
CREATE TYPE public.notification_status AS ENUM ('unread', 'read', 'archived');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  country TEXT DEFAULT 'CY',
  locale TEXT DEFAULT 'tr',
  role public.user_role NOT NULL DEFAULT 'candidate',
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  legal_name TEXT,
  slug TEXT NOT NULL UNIQUE,
  company_email TEXT,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  location TEXT,
  description TEXT,
  status public.company_status NOT NULL DEFAULT 'pending',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.candidate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline TEXT,
  summary TEXT,
  city TEXT,
  country TEXT,
  cv_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  preferred_locations TEXT[] DEFAULT '{}',
  salary_expectation_min NUMERIC(12,2),
  salary_expectation_max NUMERIC(12,2),
  availability TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.job_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  employment_type TEXT NOT NULL DEFAULT 'full_time',
  remote_policy TEXT DEFAULT 'hybrid',
  salary_min NUMERIC(12,2),
  salary_max NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  status public.job_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  application_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.job_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, skill_name)
);

CREATE TABLE public.job_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'CY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, city, country)
);

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_letter TEXT,
  cv_url TEXT,
  status public.application_status NOT NULL DEFAULT 'submitted',
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, candidate_id)
);

CREATE TABLE public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_reference TEXT,
  status public.payment_status NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind public.notification_kind NOT NULL DEFAULT 'system',
  status public.notification_status NOT NULL DEFAULT 'unread',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_locale ON public.profiles(locale);
CREATE INDEX idx_companies_owner ON public.companies(owner_id);
CREATE INDEX idx_companies_status ON public.companies(status);
CREATE INDEX idx_candidate_profiles_user ON public.candidate_profiles(user_id);
CREATE INDEX idx_job_posts_company ON public.job_posts(company_id);
CREATE INDEX idx_job_posts_status ON public.job_posts(status);
CREATE INDEX idx_job_posts_published ON public.job_posts(status, published_at);
CREATE INDEX idx_job_skills_job ON public.job_skills(job_id);
CREATE INDEX idx_applications_job ON public.applications(job_id);
CREATE INDEX idx_applications_candidate ON public.applications(candidate_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, status, created_at DESC);
CREATE INDEX idx_payments_payer ON public.payments(payer_id);
CREATE INDEX idx_payments_status ON public.payments(status);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by owner or admin"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

CREATE POLICY "Profiles are editable by owner or admin"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Company owners and admins can manage companies"
ON public.companies
FOR ALL
USING (
  owner_id IN (
    SELECT id FROM public.profiles WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  )
)
WITH CHECK (
  owner_id IN (
    SELECT id FROM public.profiles WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

CREATE POLICY "Candidates can manage own candidate profile"
ON public.candidate_profiles
FOR ALL
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

CREATE POLICY "Anyone can view active jobs"
ON public.job_posts
FOR SELECT
USING (status = 'active' OR status = 'paused');

CREATE POLICY "Company owners and admins can manage jobs"
ON public.job_posts
FOR ALL
USING (
  company_id IN (
    SELECT c.id
    FROM public.companies c
    JOIN public.profiles p ON p.id = c.owner_id
    WHERE p.id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  )
)
WITH CHECK (
  company_id IN (
    SELECT c.id
    FROM public.companies c
    JOIN public.profiles p ON p.id = c.owner_id
    WHERE p.id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

CREATE POLICY "Users can view job skill and location metadata"
ON public.job_skills
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.job_posts jp
  WHERE jp.id = job_id AND jp.status = 'active'
));

CREATE POLICY "Users can view job location metadata"
ON public.job_locations
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.job_posts jp
  WHERE jp.id = job_id AND jp.status = 'active'
));

CREATE POLICY "Admins and job owners can manage job skill metadata"
ON public.job_skills
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.job_posts jp
    JOIN public.companies c ON c.id = jp.company_id
    JOIN public.profiles p ON p.id = c.owner_id
    WHERE jp.id = job_id AND p.id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.job_posts jp
    JOIN public.companies c ON c.id = jp.company_id
    JOIN public.profiles p ON p.id = c.owner_id
    WHERE jp.id = job_id AND p.id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

CREATE POLICY "Admins and job owners can manage job locations"
ON public.job_locations
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.job_posts jp
    JOIN public.companies c ON c.id = jp.company_id
    JOIN public.profiles p ON p.id = c.owner_id
    WHERE jp.id = job_id AND p.id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.job_posts jp
    JOIN public.companies c ON c.id = jp.company_id
    JOIN public.profiles p ON p.id = c.owner_id
    WHERE jp.id = job_id AND p.id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

CREATE POLICY "Candidates can manage their own applications"
ON public.applications
FOR ALL
USING (
  candidate_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.job_posts jp
    JOIN public.companies c ON c.id = jp.company_id
    JOIN public.profiles p ON p.id = c.owner_id
    WHERE jp.id = job_id AND p.id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  )
)
WITH CHECK (
  candidate_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.job_posts jp
    JOIN public.companies c ON c.id = jp.company_id
    JOIN public.profiles p ON p.id = c.owner_id
    WHERE jp.id = job_id AND p.id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

CREATE POLICY "Users can manage own saved jobs"
ON public.saved_jobs
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own payments and admins can view all"
ON public.payments
FOR ALL
USING (
  payer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  )
)
WITH CHECK (
  payer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

CREATE POLICY "Users can manage own notifications"
ON public.notifications
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read audit logs"
ON public.audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_candidate_profiles_updated_at
BEFORE UPDATE ON public.candidate_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_job_posts_updated_at
BEFORE UPDATE ON public.job_posts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.profiles IS 'Authenticated user profiles and role metadata';
COMMENT ON TABLE public.companies IS 'Employer and company account records';
COMMENT ON TABLE public.candidate_profiles IS 'Candidate profile and CV metadata';
COMMENT ON TABLE public.job_posts IS 'Marketplace job listing records';
COMMENT ON TABLE public.applications IS 'Application records between candidates and jobs';
COMMENT ON TABLE public.payments IS 'Monetary transactions for employer packages and services';
COMMENT ON TABLE public.notifications IS 'User-facing push and in-app notifications';
COMMENT ON TABLE public.audit_logs IS 'Operational audit trail for moderation and admin review';
