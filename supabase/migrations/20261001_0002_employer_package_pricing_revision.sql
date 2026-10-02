INSERT INTO public.packages (code, name, description, price, currency, duration_days)
VALUES
  ('job-single-30d', 'Tek İlan', '1 ilan kredisi; ilan 30 gün yayında kalır. Tek seferlik ödeme.', 990, 'TRY', 30),
  ('job-bundle-5-90d', 'Başlangıç', '5 ilan kredisi; her ilan 30 gün yayında kalır. Krediler 90 gün geçerlidir.', 3490, 'TRY', 90),
  ('job-bundle-15-90d', 'Profesyonel', '15 ilan kredisi; her ilan 30 gün yayında kalır. Krediler 90 gün geçerlidir.', 7490, 'TRY', 90),
  ('job-bundle-30-90d', 'Kurumsal', '30 ilan kredisi; her ilan 30 gün yayında kalır. Krediler 90 gün geçerlidir.', 11990, 'TRY', 90)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  duration_days = EXCLUDED.duration_days,
  is_active = TRUE;

UPDATE public.packages
SET is_active = FALSE
WHERE code IN (
  'job-unlimited-365d',
  'job-bundle-15-180d',
  'job-bundle-30-365d'
);

INSERT INTO public.package_entitlements (package_id, entitlement_code, quota)
SELECT p.id, 'job_posts', v.quota
FROM public.packages p
JOIN (
  VALUES
    ('job-single-30d', 1),
    ('job-bundle-5-90d', 5),
    ('job-bundle-15-90d', 15),
    ('job-bundle-30-90d', 30)
) AS v(package_code, quota)
  ON p.code = v.package_code
ON CONFLICT (package_id, entitlement_code) DO UPDATE
SET quota = EXCLUDED.quota;
