-- 0003 may already have run with the legacy legal_name cleanup ordering.
-- Clear only values whose exact trimmed value was also migrated as a VKN.
UPDATE public.companies c
SET legal_name = NULL
FROM public.employer_tax_identifiers t
WHERE t.company_id = c.id
  AND c.legal_name IS NOT NULL
  AND btrim(c.legal_name) = btrim(t.tax_identifier);
