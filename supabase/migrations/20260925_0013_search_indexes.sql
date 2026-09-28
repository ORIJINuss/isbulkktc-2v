-- Phase 7: indexes for public job search and expiry filtering.
CREATE INDEX IF NOT EXISTS idx_job_posts_public_search
  ON public.job_posts (is_featured DESC, published_at DESC)
  WHERE status = 'active' AND published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_job_posts_location_active
  ON public.job_posts (location)
  WHERE status = 'active' AND published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_job_posts_title_search
  ON public.job_posts USING gin (to_tsvector('simple', title));
