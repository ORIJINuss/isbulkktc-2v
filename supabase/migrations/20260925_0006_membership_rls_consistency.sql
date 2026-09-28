-- Align legacy table policies with company membership and super_admin authorization.

CREATE POLICY "Company members can read their jobs"
ON public.job_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_members m
    WHERE m.company_id = job_posts.company_id AND m.user_id = auth.uid()
  )
  OR public.is_platform_admin()
);

CREATE POLICY "Recruiters can create jobs"
ON public.job_posts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_members m
    WHERE m.company_id = job_posts.company_id
      AND m.user_id = auth.uid()
      AND m.member_role IN ('owner', 'recruiter')
  )
  OR public.is_platform_admin()
);

CREATE POLICY "Recruiters can update jobs"
ON public.job_posts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.company_members m
    WHERE m.company_id = job_posts.company_id
      AND m.user_id = auth.uid()
      AND m.member_role IN ('owner', 'recruiter')
  )
  OR public.is_platform_admin()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.company_members m
    WHERE m.company_id = job_posts.company_id
      AND m.user_id = auth.uid()
      AND m.member_role IN ('owner', 'recruiter')
  )
  OR public.is_platform_admin()
);

CREATE POLICY "Recruiters can delete jobs"
ON public.job_posts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.company_members m
    WHERE m.company_id = job_posts.company_id
      AND m.user_id = auth.uid()
      AND m.member_role IN ('owner', 'recruiter')
  )
  OR public.is_platform_admin()
);

CREATE OR REPLACE FUNCTION public.update_application_status(
  p_application_id UUID,
  p_to_status public.application_status
)
RETURNS public.applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_application public.applications;
  previous_status public.application_status;
  allowed BOOLEAN;
BEGIN
  SELECT * INTO current_application
  FROM public.applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF current_application.id IS NULL THEN
    RAISE EXCEPTION 'application_not_found';
  END IF;

  SELECT public.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.job_posts j
      JOIN public.company_members m ON m.company_id = j.company_id
      WHERE j.id = current_application.job_id
        AND m.user_id = auth.uid()
        AND m.member_role IN ('owner', 'recruiter')
    )
  INTO allowed;

  IF NOT allowed THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF NOT (
    (current_application.status = 'submitted' AND p_to_status IN ('reviewing', 'rejected')) OR
    (current_application.status = 'reviewing' AND p_to_status IN ('interview', 'rejected')) OR
    (current_application.status = 'interview' AND p_to_status IN ('accepted', 'rejected')) OR
    (current_application.status = 'accepted' AND p_to_status = 'accepted')
  ) THEN
    RAISE EXCEPTION 'invalid_application_transition';
  END IF;

  previous_status := current_application.status;
  UPDATE public.applications
  SET status = p_to_status, updated_at = NOW()
  WHERE id = p_application_id
  RETURNING * INTO current_application;

  INSERT INTO public.application_events (application_id, actor_id, event_type, from_status, to_status)
  VALUES (
    p_application_id,
    auth.uid(),
    CASE p_to_status
      WHEN 'reviewing' THEN 'viewed'::public.application_event_type
      WHEN 'interview' THEN 'interview'::public.application_event_type
      WHEN 'accepted' THEN 'hired'::public.application_event_type
      WHEN 'rejected' THEN 'rejected'::public.application_event_type
      ELSE 'viewed'::public.application_event_type
    END,
    previous_status,
    p_to_status
  );

  RETURN current_application;
END;
$$;

COMMENT ON FUNCTION public.update_application_status(UUID, public.application_status)
IS 'Narrow, server-validated application status transition for employer members';

CREATE POLICY "Platform admins can manage profiles"
ON public.profiles FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY "Platform admins can manage companies"
ON public.companies FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY "Platform admins can manage jobs"
ON public.job_posts FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY "Platform admins can manage applications"
ON public.applications FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY "Platform admins can manage payments"
ON public.payments FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY "Platform admins can manage notifications"
ON public.notifications FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY "Platform admins can manage audit logs"
ON public.audit_logs FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
