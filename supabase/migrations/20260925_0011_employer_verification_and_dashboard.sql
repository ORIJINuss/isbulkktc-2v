-- Phase 5 employer foundation: verification metadata and tenant dashboard indexes.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_companies_verification
ON public.companies(status, is_verified, verified_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_posts_company_status_created
ON public.job_posts(company_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_job_status_created
ON public.applications(job_id, status, created_at DESC);

CREATE POLICY "Company members can view company profile"
ON public.companies FOR SELECT
USING (
  public.is_platform_admin()
  OR owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.company_members m
    WHERE m.company_id = companies.id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Company owners can update company profile"
ON public.companies FOR UPDATE
USING (
  public.is_platform_admin()
  OR owner_id = auth.uid()
)
WITH CHECK (
  public.is_platform_admin()
  OR owner_id = auth.uid()
);

CREATE POLICY "Company members can view company applications"
ON public.applications FOR SELECT
USING (
  public.is_platform_admin()
  OR EXISTS (
    SELECT 1
    FROM public.job_posts j
    JOIN public.company_members m ON m.company_id = j.company_id
    WHERE j.id = applications.job_id AND m.user_id = auth.uid()
  )
);
