-- Application submission integrity guards.
--
-- 1) job_posts.application_count is maintained by the database, not by the caller.
--    A candidate cannot pass the "Recruiters can update jobs" policy on job_posts,
--    so any read-modify-write performed with the caller's token was rejected by RLS
--    and silently discarded. The trigger also removes the lost-update race that a
--    client-side "count + 1" would still have.
-- 2) applications may only be inserted by accounts whose profile role is candidate.

CREATE OR REPLACE FUNCTION public.sync_job_post_application_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.job_posts
    SET application_count = application_count + 1
    WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.job_posts
    SET application_count = GREATEST(application_count - 1, 0)
    WHERE id = OLD.job_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_job_post_application_count ON public.applications;
CREATE TRIGGER sync_job_post_application_count
AFTER INSERT OR DELETE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.sync_job_post_application_count();

DROP POLICY IF EXISTS "Candidates can submit applications" ON public.applications;

CREATE POLICY "Candidates can submit applications"
ON public.applications FOR INSERT
WITH CHECK (
  candidate_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'candidate'
      AND p.account_status = 'active'
  )
  AND EXISTS (
    SELECT 1
    FROM public.job_posts j
    WHERE j.id = applications.job_id
      AND j.status = 'active'
      AND (j.expires_at IS NULL OR j.expires_at > NOW())
  )
);

COMMENT ON FUNCTION public.sync_job_post_application_count()
IS 'Maintains job_posts.application_count atomically on application insert and delete';
