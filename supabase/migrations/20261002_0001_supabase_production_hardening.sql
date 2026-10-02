ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role::text IN ('admin', 'super_admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO anon, authenticated, service_role;

DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated';
  END IF;
END;
$$;

DROP POLICY IF EXISTS "Users can view own payments and admins can view all" ON public.payments;
CREATE POLICY "Users can view own payments and admins can view all"
ON public.payments FOR SELECT
USING (payer_id = auth.uid() OR public.is_platform_admin());

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

DROP POLICY IF EXISTS "Anyone can view active jobs" ON public.job_posts;
CREATE POLICY "Anyone can view active jobs"
ON public.job_posts FOR SELECT
USING (
  status = 'active'
  AND published_at IS NOT NULL
  AND (expires_at IS NULL OR expires_at > NOW())
);

CREATE OR REPLACE FUNCTION public.protect_company_verification_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('postgres', 'service_role') OR public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.is_verified := FALSE;
    NEW.verification_notes := NULL;
    NEW.verified_at := NULL;
    NEW.verified_by := NULL;
  ELSE
    NEW.owner_id := OLD.owner_id;
    NEW.status := OLD.status;
    NEW.is_verified := OLD.is_verified;
    NEW.verification_notes := OLD.verification_notes;
    NEW.verified_at := OLD.verified_at;
    NEW.verified_by := OLD.verified_by;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_company_verification_fields ON public.companies;
CREATE TRIGGER protect_company_verification_fields
BEFORE INSERT OR UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.protect_company_verification_fields();

REVOKE ALL ON FUNCTION public.protect_company_verification_fields() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.protect_job_post_control_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('postgres', 'service_role') OR public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_featured := FALSE;
    NEW.application_count := 0;
    NEW.view_count := 0;
  ELSE
    NEW.company_id := OLD.company_id;
    NEW.is_featured := OLD.is_featured;
    NEW.application_count := OLD.application_count;
    NEW.view_count := OLD.view_count;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_job_post_control_fields ON public.job_posts;
CREATE TRIGGER protect_job_post_control_fields
BEFORE INSERT OR UPDATE ON public.job_posts
FOR EACH ROW EXECUTE FUNCTION public.protect_job_post_control_fields();

REVOKE ALL ON FUNCTION public.protect_job_post_control_fields() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_pending_order(
  p_company_id UUID,
  p_package_id UUID,
  p_idempotency_key TEXT
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_package public.packages%ROWTYPE;
  v_order public.orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL
     OR p_idempotency_key !~ '^[A-Za-z0-9._:-]{16,128}$' THEN
    RAISE EXCEPTION 'invalid_order_request';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.companies c
    JOIN public.company_members m ON m.company_id = c.id
    JOIN public.profiles p ON p.id = m.user_id
    WHERE c.id = p_company_id
      AND c.owner_id = auth.uid()
      AND m.user_id = auth.uid()
      AND m.member_role = 'owner'
      AND p.role = 'employer'
      AND p.account_status = 'active'
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_package
  FROM public.packages
  WHERE id = p_package_id
    AND is_active = TRUE
    AND price > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'package_not_available';
  END IF;

  INSERT INTO public.orders (
    company_id,
    package_id,
    amount,
    currency,
    idempotency_key,
    status
  )
  VALUES (
    p_company_id,
    v_package.id,
    v_package.price,
    v_package.currency,
    p_idempotency_key,
    'pending'
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING * INTO v_order;

  IF NOT FOUND THEN
    SELECT * INTO v_order
    FROM public.orders
    WHERE idempotency_key = p_idempotency_key
    FOR UPDATE;

    IF NOT FOUND
       OR v_order.company_id <> p_company_id
       OR v_order.package_id IS DISTINCT FROM v_package.id
       OR v_order.status <> 'pending' THEN
      RAISE EXCEPTION 'idempotency_key_conflict';
    END IF;
  END IF;

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.create_pending_order(UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_pending_order(UUID, UUID, TEXT) TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.orders FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS public.apply_paid_order(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.apply_paid_order(
  p_order_id UUID,
  p_provider TEXT,
  p_provider_reference TEXT,
  p_amount NUMERIC,
  p_currency TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_duration INTEGER;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF p_amount IS NULL
     OR p_amount <> v_order.amount
     OR upper(COALESCE(p_currency, '')) <> upper(v_order.currency) THEN
    RAISE EXCEPTION 'payment_amount_or_currency_mismatch';
  END IF;

  IF v_order.status = 'paid' THEN
    IF v_order.provider IS DISTINCT FROM p_provider
       OR v_order.provider_reference IS DISTINCT FROM p_provider_reference THEN
      RAISE EXCEPTION 'order_has_different_payment_reference';
    END IF;
    RETURN FALSE;
  END IF;

  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'order_not_pending';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.orders
    WHERE provider_reference = p_provider_reference AND id <> p_order_id
  ) THEN
    RAISE EXCEPTION 'payment_reference_already_used';
  END IF;

  SELECT duration_days INTO v_duration
  FROM public.packages
  WHERE id = v_order.package_id;

  IF v_duration IS NULL OR v_duration <= 0 THEN
    RAISE EXCEPTION 'invalid_package_duration';
  END IF;

  UPDATE public.orders
  SET status = 'paid', provider = p_provider, provider_reference = p_provider_reference
  WHERE id = p_order_id;

  INSERT INTO public.invoices (order_id, invoice_number, amount, currency, metadata)
  VALUES (
    p_order_id,
    'IBK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)),
    v_order.amount,
    v_order.currency,
    jsonb_build_object('provider', p_provider, 'provider_reference', p_provider_reference)
  )
  ON CONFLICT (order_id) DO NOTHING;

  INSERT INTO public.subscriptions (company_id, package_id, status, starts_at, ends_at, provider_reference)
  VALUES (
    v_order.company_id,
    v_order.package_id,
    'active',
    NOW(),
    NOW() + make_interval(days => v_duration),
    p_provider_reference
  )
  ON CONFLICT (provider_reference) DO NOTHING;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_pending_order(
  p_order_id UUID,
  p_provider TEXT,
  p_provider_reference TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF v_order.status = 'failed'
     AND v_order.provider = p_provider
     AND v_order.provider_reference = p_provider_reference THEN
    RETURN FALSE;
  END IF;

  IF v_order.status <> 'pending' THEN
    RETURN FALSE;
  END IF;

  UPDATE public.orders
  SET status = 'failed', provider = p_provider, provider_reference = p_provider_reference
  WHERE id = p_order_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_paid_order(UUID, TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_pending_order(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_paid_order(UUID, TEXT, TEXT, NUMERIC, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_pending_order(UUID, TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION public.create_pending_order(UUID, UUID, TEXT)
IS 'Creates or safely replays a pending order using the active package price and verified company owner.';
COMMENT ON FUNCTION public.apply_paid_order(UUID, TEXT, TEXT, NUMERIC, TEXT)
IS 'Validates the provider-confirmed amount and currency before atomically fulfilling a pending order.';
COMMENT ON FUNCTION public.fail_pending_order(UUID, TEXT, TEXT)
IS 'Marks a pending order failed without allowing a late event to reverse a paid order.';

UPDATE public.packages
SET is_active = FALSE
WHERE code IN ('starter', 'growth', 'scale');

DROP TABLE IF EXISTS public.payments;
DROP TYPE IF EXISTS public.payment_status;
