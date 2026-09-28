-- Phase 2 database hardening: complete application lifecycle, tighten RLS,
-- and provide deterministic package seeds for local/preview environments.

ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'viewed';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'shortlisted';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'offer';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'hired';

ALTER TABLE public.candidate_profiles
  ADD CONSTRAINT candidate_salary_range_valid
  CHECK (
    salary_expectation_min IS NULL
    OR salary_expectation_max IS NULL
    OR salary_expectation_max >= salary_expectation_min
  );

ALTER TABLE public.job_posts
  ADD CONSTRAINT job_salary_range_valid
  CHECK (
    salary_min IS NULL
    OR salary_max IS NULL
    OR salary_max >= salary_min
  );

ALTER TABLE public.job_posts
  ADD CONSTRAINT active_job_has_published_at
  CHECK (status <> 'active' OR published_at IS NOT NULL)
  NOT VALID;

ALTER TABLE public.job_posts
  ADD CONSTRAINT job_counters_non_negative
  CHECK (view_count >= 0 AND application_count >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cv_documents_one_active_per_candidate
ON public.cv_documents(candidate_id)
WHERE is_active = TRUE AND processing_status <> 'deleted';

CREATE INDEX IF NOT EXISTS idx_job_posts_public_expiry
ON public.job_posts(status, expires_at, published_at DESC)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_applications_candidate_status
ON public.applications(candidate_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_companies_slug_status
ON public.companies(slug, status);

DROP POLICY IF EXISTS "Candidates can manage their own applications" ON public.applications;

CREATE POLICY "Candidates and company members can view applications"
ON public.applications FOR SELECT
USING (
  candidate_id = auth.uid()
  OR public.is_platform_admin()
  OR EXISTS (
    SELECT 1
    FROM public.job_posts j
    JOIN public.company_members m ON m.company_id = j.company_id
    WHERE j.id = applications.job_id
      AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Candidates can submit applications"
ON public.applications FOR INSERT
WITH CHECK (
  candidate_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.job_posts j
    WHERE j.id = applications.job_id
      AND j.status = 'active'
      AND (j.expires_at IS NULL OR j.expires_at > NOW())
  )
);

CREATE POLICY "Candidates can delete own applications"
ON public.applications FOR DELETE
USING (candidate_id = auth.uid() OR public.is_platform_admin());

INSERT INTO public.packages (code, name, description, price, currency, duration_days)
VALUES
  ('starter', 'Starter', 'Temel ilan yayınlama paketi', 0, 'GBP', 30),
  ('growth', 'Growth', 'Daha yüksek ilan ve aday erişimi', 49, 'GBP', 30),
  ('scale', 'Scale', 'Gelişmiş işe alım ve analytics özellikleri', 149, 'GBP', 30)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.package_entitlements (package_id, entitlement_code, quota)
SELECT p.id, v.entitlement_code, v.quota
FROM public.packages p
JOIN (
  VALUES
    ('starter', 'job_posts', 1),
    ('starter', 'analytics', 0),
    ('growth', 'job_posts', 10),
    ('growth', 'analytics', 1),
    ('growth', 'candidate_search', 100),
    ('scale', 'job_posts', NULL),
    ('scale', 'analytics', 1),
    ('scale', 'candidate_search', NULL),
    ('scale', 'priority_support', 1)
) AS v(package_code, entitlement_code, quota)
  ON p.code = v.package_code
ON CONFLICT (package_id, entitlement_code) DO NOTHING;

COMMENT ON TABLE public.packages IS 'Employer packages; seeded defaults are additive and can be overridden by platform admins';
