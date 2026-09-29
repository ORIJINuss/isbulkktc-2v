-- Atomic, idempotent payment event recording and entitlement fulfillment.

CREATE OR REPLACE FUNCTION public.record_payment_event(
  p_order_id UUID,
  p_provider TEXT,
  p_event_id TEXT,
  p_event_type TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted UUID;
BEGIN
  INSERT INTO public.payment_events (order_id, provider, provider_event_id, event_type, payload)
  VALUES (p_order_id, p_provider, p_event_id, p_event_type, COALESCE(p_payload, '{}'::jsonb))
  ON CONFLICT (provider, provider_event_id) DO NOTHING
  RETURNING id INTO v_inserted;

  RETURN v_inserted IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_paid_order(
  p_order_id UUID,
  p_provider TEXT,
  p_provider_reference TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    RAISE EXCEPTION 'Sipariş bulunamadı';
  END IF;

  IF v_order.status = 'paid' THEN
    IF v_order.provider_reference IS DISTINCT FROM p_provider_reference THEN
      RAISE EXCEPTION 'Sipariş farklı ödeme referansına sahip';
    END IF;
    RETURN FALSE;
  END IF;

  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'Sipariş ödeme için uygun değil';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.orders
    WHERE provider_reference = p_provider_reference AND id <> p_order_id
  ) THEN
    RAISE EXCEPTION 'Ödeme referansı başka siparişte kullanılmış';
  END IF;

  SELECT duration_days INTO v_duration
  FROM public.packages
  WHERE id = v_order.package_id;

  IF v_duration IS NULL OR v_duration <= 0 THEN
    RAISE EXCEPTION 'Paket süresi geçersiz';
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

REVOKE ALL ON FUNCTION public.record_payment_event(UUID, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_paid_order(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment_event(UUID, TEXT, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_paid_order(UUID, TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION public.record_payment_event IS 'Records Stripe webhook events exactly once by provider event id.';
COMMENT ON FUNCTION public.apply_paid_order IS 'Atomically marks a pending order paid and creates invoice/subscription exactly once.';
