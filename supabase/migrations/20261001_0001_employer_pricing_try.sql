INSERT INTO public.packages (code, name, description, price, currency, duration_days)
VALUES
  ('job-single-30d', 'Tek İlan', '1 ilan kredisi; ilan 30 gün yayında kalır. Tek seferlik ödeme.', 390, 'TRY', 30),
  ('job-bundle-5-90d', 'Başlangıç', '5 ilan kredisi; her ilan 30 gün yayında kalır. Krediler 90 gün geçerlidir.', 1790, 'TRY', 90),
  ('job-bundle-15-180d', 'Profesyonel', '15 ilan kredisi; her ilan 30 gün yayında kalır. Krediler 180 gün geçerlidir.', 4490, 'TRY', 180),
  ('job-unlimited-365d', 'Kurumsal', 'Sınırsız ilan kredisi; her ilan 30 gün yayında kalır. Paket 365 gün geçerlidir.', 8990, 'TRY', 365)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  duration_days = EXCLUDED.duration_days;

ALTER TABLE public.packages
  ALTER COLUMN currency SET DEFAULT 'TRY';

ALTER TABLE public.orders
  ALTER COLUMN currency SET DEFAULT 'TRY';

INSERT INTO public.package_entitlements (package_id, entitlement_code, quota)
SELECT p.id, v.entitlement_code, v.quota
FROM public.packages p
JOIN (
  VALUES
    ('job-single-30d', 'job_posts', 1),
    ('job-bundle-5-90d', 'job_posts', 5),
    ('job-bundle-15-180d', 'job_posts', 15),
    ('job-unlimited-365d', 'job_posts', NULL)
) AS v(package_code, entitlement_code, quota)
  ON p.code = v.package_code
ON CONFLICT (package_id, entitlement_code) DO UPDATE
SET quota = EXCLUDED.quota;
