-- Additive production domain foundation.
-- Existing tables remain compatible with the current UI and services.

DO $$
BEGIN
  CREATE TYPE public.company_member_role AS ENUM ('owner', 'recruiter', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.cv_processing_status AS ENUM ('queued', 'processing', 'ready', 'failed', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.application_event_type AS ENUM ('submitted', 'viewed', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'past_due', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.delivery_status AS ENUM ('queued', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role::text IN ('admin', 'super_admin')
  );
$$;

CREATE TABLE IF NOT EXISTS public.company_members (
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_role public.company_member_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (company_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type public.application_event_type NOT NULL,
  from_status public.application_status,
  to_status public.application_status NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cv_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size BIGINT NOT NULL CHECK (byte_size > 0 AND byte_size <= 10485760),
  processing_status public.cv_processing_status NOT NULL DEFAULT 'queued',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cv_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.cv_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  extracted_text TEXT,
  structured_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ats_score NUMERIC(5,2) CHECK (ats_score >= 0 AND ats_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'GBP',
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.package_entitlements (
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  entitlement_code TEXT NOT NULL,
  quota INTEGER CHECK (quota IS NULL OR quota >= 0),
  PRIMARY KEY (package_id, entitlement_code)
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id),
  status public.subscription_status NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  provider_reference TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_code TEXT NOT NULL,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, notification_code)
);

CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms')),
  status public.delivery_status NOT NULL DEFAULT 'queued',
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  provider_reference TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  UNIQUE (notification_id, channel)
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  job_id UUID REFERENCES public.job_posts(id) ON DELETE SET NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.moderation_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_members_user ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_application_events_application ON public.application_events(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cv_documents_candidate ON public.cv_documents(candidate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_status ON public.subscriptions(company_id, status, ends_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_company_time ON public.analytics_events(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_cases_status ON public.moderation_cases(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_requester ON public.support_tickets(requester_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_posts_search ON public.job_posts USING GIN (
  to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(description, ''))
);

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their company membership"
ON public.company_members FOR SELECT
USING (user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY "Company owners can manage memberships"
ON public.company_members FOR ALL
USING (
  public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = company_id AND c.owner_id = auth.uid()
  )
)
WITH CHECK (
  public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = company_id AND c.owner_id = auth.uid()
  )
);

CREATE POLICY "Candidates and company members can view application events"
ON public.application_events FOR SELECT
USING (
  actor_id = auth.uid()
  OR public.is_platform_admin()
  OR EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.job_posts j ON j.id = a.job_id
    JOIN public.company_members m ON m.company_id = j.company_id
    WHERE a.id = application_id AND (a.candidate_id = auth.uid() OR m.user_id = auth.uid())
  )
);

CREATE POLICY "Candidates manage their own CV documents"
ON public.cv_documents FOR ALL
USING (candidate_id = auth.uid() OR public.is_platform_admin())
WITH CHECK (candidate_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY "Candidates view their CV versions"
ON public.cv_versions FOR SELECT
USING (
  public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.cv_documents d
    WHERE d.id = document_id AND d.candidate_id = auth.uid()
  )
);

CREATE POLICY "Public can view active packages"
ON public.packages FOR SELECT USING (is_active = TRUE OR public.is_platform_admin());
CREATE POLICY "Public can view package entitlements"
ON public.package_entitlements FOR SELECT
USING (EXISTS (SELECT 1 FROM public.packages p WHERE p.id = package_id AND p.is_active = TRUE) OR public.is_platform_admin());

CREATE POLICY "Company members can view subscriptions"
ON public.subscriptions FOR SELECT
USING (
  public.is_platform_admin()
  OR EXISTS (SELECT 1 FROM public.company_members m WHERE m.company_id = subscriptions.company_id AND m.user_id = auth.uid())
);

CREATE POLICY "Users manage notification preferences"
ON public.notification_preferences FOR ALL
USING (user_id = auth.uid() OR public.is_platform_admin())
WITH CHECK (user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY "Users view notification deliveries"
ON public.notification_deliveries FOR SELECT
USING (
  public.is_platform_admin()
  OR EXISTS (SELECT 1 FROM public.notifications n WHERE n.id = notification_id AND n.user_id = auth.uid())
);

CREATE POLICY "Users create privacy-minimized analytics"
ON public.analytics_events FOR INSERT
WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);
CREATE POLICY "Admins read analytics"
ON public.analytics_events FOR SELECT USING (public.is_platform_admin());

CREATE POLICY "Users manage own support tickets"
ON public.support_tickets FOR ALL
USING (requester_id = auth.uid() OR public.is_platform_admin())
WITH CHECK (requester_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY "Users create reports"
ON public.reports FOR INSERT WITH CHECK (reporter_id = auth.uid() OR reporter_id IS NULL);
CREATE POLICY "Admins manage moderation and reports"
ON public.moderation_cases FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY "Admins read reports"
ON public.reports FOR SELECT USING (public.is_platform_admin());
CREATE POLICY "Admins manage system settings"
ON public.system_settings FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY "Admins manage feature flags"
ON public.feature_flags FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

CREATE TRIGGER set_cv_documents_updated_at
BEFORE UPDATE ON public.cv_documents
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.company_members IS 'Tenant membership and employer authorization boundary';
COMMENT ON TABLE public.application_events IS 'Immutable application lifecycle history';
COMMENT ON TABLE public.cv_documents IS 'Private candidate CV metadata; file bytes live in private storage';
COMMENT ON TABLE public.analytics_events IS 'Privacy-minimized product analytics events';
