-- Application lifecycle RPC is intentionally separated from enum additions.
-- PostgreSQL makes newly added enum values usable after the migration commits.

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

  IF p_to_status = 'withdrawn' THEN
    IF current_application.candidate_id <> auth.uid()
       OR current_application.status IN ('hired', 'rejected', 'withdrawn') THEN
      RAISE EXCEPTION 'forbidden';
    END IF;
  ELSE
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
  END IF;

  IF NOT (
    (current_application.status = 'submitted' AND p_to_status IN ('viewed', 'reviewing', 'rejected', 'withdrawn')) OR
    (current_application.status = 'viewed' AND p_to_status IN ('reviewing', 'rejected', 'withdrawn')) OR
    (current_application.status = 'reviewing' AND p_to_status IN ('shortlisted', 'interview', 'rejected', 'withdrawn')) OR
    (current_application.status = 'shortlisted' AND p_to_status IN ('interview', 'rejected', 'withdrawn')) OR
    (current_application.status = 'interview' AND p_to_status IN ('offer', 'accepted', 'rejected', 'withdrawn')) OR
    (current_application.status = 'offer' AND p_to_status IN ('accepted', 'rejected', 'withdrawn')) OR
    (current_application.status = 'accepted' AND p_to_status = 'hired') OR
    (current_application.status = 'withdrawn' AND p_to_status = 'withdrawn')
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
      WHEN 'submitted' THEN 'submitted'::public.application_event_type
      WHEN 'viewed' THEN 'viewed'::public.application_event_type
      WHEN 'shortlisted' THEN 'shortlisted'::public.application_event_type
      WHEN 'reviewing' THEN 'viewed'::public.application_event_type
      WHEN 'interview' THEN 'interview'::public.application_event_type
      WHEN 'offer' THEN 'offer'::public.application_event_type
      WHEN 'accepted' THEN 'hired'::public.application_event_type
      WHEN 'hired' THEN 'hired'::public.application_event_type
      WHEN 'rejected' THEN 'rejected'::public.application_event_type
      WHEN 'withdrawn' THEN 'withdrawn'::public.application_event_type
    END,
    previous_status,
    p_to_status
  );

  RETURN current_application;
END;
$$;

COMMENT ON FUNCTION public.update_application_status(UUID, public.application_status)
IS 'Server-validated application lifecycle transition with candidate withdrawal support';
