-- Phase 6 billing lifecycle: explicit cancellation/refund metadata and entitlement usage.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.entitlement_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  entitlement_code TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  used_quantity INTEGER NOT NULL DEFAULT 0 CHECK (used_quantity >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, entitlement_code, period_start),
  CHECK (period_end > period_start)
);

CREATE INDEX IF NOT EXISTS idx_entitlement_usage_company_period
ON public.entitlement_usage(company_id, period_start DESC);

ALTER TABLE public.entitlement_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view entitlement usage"
ON public.entitlement_usage FOR SELECT
USING (
  public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.company_members m
    WHERE m.company_id = entitlement_usage.company_id AND m.user_id = auth.uid()
  )
);

CREATE TRIGGER set_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_entitlement_usage_updated_at
BEFORE UPDATE ON public.entitlement_usage
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.entitlement_usage IS 'Provider-independent quota consumption per company and billing period';
