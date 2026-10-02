-- İşveren VKN gizliliği: vergi kimlik numarasını companies.legal_name içinde
-- tutmak yerine yalnızca sunucu tarafının okuyabildiği özel bir tabloya taşı.
--
-- Kapsam:
--   1. public.employer_tax_identifiers tablosu (CREATE TABLE IF NOT EXISTS,
--      ENABLE + FORCE RLS, policy yok → varsayılan reddet; anon/authenticated
--      ve PUBLIC'ten REVOKE, yalnızca service_role GRANT).
--   2. Geriye dönük taşıma: eski handle_new_user imzasının signup metadata
--      içindeki company_legal_name anahtarını companies.legal_name'e yazdığı
--      satırları private tabloya kopyala, kopyalama eşleşen legal_name ile
--      başarılıysa auth kullanıcısının raw_user_meta_data'sından yalnızca
--      company_legal_name anahtarını sil (diğer anahtarlar korunur), sonra
--      eşleşen legal_name değerlerini NULL'a çek.
--   3. handle_new_user'ı yeniden tanımla: yeni kayıtlarda legal_name hiç
--      yazılmaz, VKN company_tax_identifier meta anahtarıyla okunup private
--      tabloya yazılır (eski paketler için company_legal_name yedeği);
--      private tabloya yazım başarılıysa auth metadata'sından
--      company_tax_identifier ve company_legal_name anahtarları silinir.
--
-- Kabul varsayımları:
--   * companies.legal_name yalnızca legacy trigger tarafından signup
--     metadata'dan yazılmıştır; sahibinin auth metadata'sı ile btrim() bazında
--     eşleşmeyen (elle düzenlenmiş) legal_name değerlerine dokunulmaz.
--   * Migration ve SECURITY DEFINER trigger `postgres` rolüyle çalışır;
--     Supabase'de postgres'in BYPASSRLS özelliği vardır, bu yüzden FORCE RLS
--     altındaki tablo migration/trigger yazımını engellemez. anon ve
--     authenticated policy olmadığı için reddedilir; service_role BYPASSRLS
--     ile sunucu tarafından okur.
--   * Supabase yeni public tablolara default privileges ile anon/authenticated
--     grant'ı ekler → CREATE sonrası açık REVOKE zorunludur.

-- 1) Özel tablo ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.employer_tax_identifiers (
  company_id uuid NOT NULL
    REFERENCES public.companies (id) ON DELETE CASCADE,
  tax_identifier text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employer_tax_identifiers_pkey PRIMARY KEY (company_id)
);

COMMENT ON TABLE public.employer_tax_identifiers IS
  'İşveren vergi kimlik numaraları (VKN/TCKN). Yalnızca service_role erişir; istemciye açık değildir.';
COMMENT ON COLUMN public.employer_tax_identifiers.tax_identifier IS
  'Vergi kimlik numarası; companies.legal_name yerine burada saklanır.';

ALTER TABLE public.employer_tax_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_tax_identifiers FORCE ROW LEVEL SECURITY;

-- Policy yok → anon/authenticated için default deny.
REVOKE ALL ON TABLE public.employer_tax_identifiers FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.employer_tax_identifiers TO service_role;

-- 2) Geriye dönük taşıma ------------------------------------------------------
-- Eski signup metadata'sındaki company_legal_name ile sahibinin
-- companies.legal_name değeri eşleşiyorsa VKN'yi private tabloya taşı.

INSERT INTO public.employer_tax_identifiers (company_id, tax_identifier)
SELECT
  c.id,
  NULLIF(btrim(u.raw_user_meta_data ->> 'company_legal_name'), '')
FROM auth.users u
JOIN public.companies c ON c.owner_id = u.id
WHERE c.legal_name IS NOT NULL
  AND NULLIF(btrim(u.raw_user_meta_data ->> 'company_legal_name'), '') IS NOT NULL
  AND btrim(c.legal_name) = btrim(u.raw_user_meta_data ->> 'company_legal_name')
ON CONFLICT (company_id) DO NOTHING;

-- Kopyalama başarılı olan (private tabloda satırı olan) ve companies.legal_name
-- ile eşleşen kullanıcılardan signup metadata'sındaki company_legal_name
-- anahtarını sil; diğer anahtarlar aynen kalır. companies.legal_name'i NULL'a
-- çeken UPDATE'ten ÖNCE çalışmalıdır (o UPDATE eşleşme kanıtını yok eder).
-- - operatörü eksik anahtarda no-op olduğundan tekrarlı çalıştırmalar güvenlidir.
UPDATE auth.users u
SET raw_user_meta_data = u.raw_user_meta_data - 'company_legal_name'
FROM public.companies c
WHERE c.owner_id = u.id
  AND EXISTS (
    SELECT 1
    FROM public.employer_tax_identifiers t
    WHERE t.company_id = c.id
      AND t.tax_identifier = NULLIF(btrim(u.raw_user_meta_data ->> 'company_legal_name'), '')
  )
  AND NULLIF(btrim(u.raw_user_meta_data ->> 'company_legal_name'), '') IS NOT NULL
  AND btrim(c.legal_name) = btrim(u.raw_user_meta_data ->> 'company_legal_name');

-- Yalnızca taşıma başarılı olan (private tabloda satırı olan) eşleşen
-- legal_name değerlerini temizle; elle düzenlenmiş değerler korunur.
UPDATE public.companies c
SET legal_name = NULL
FROM public.employer_tax_identifiers t
WHERE t.company_id = c.id
  AND c.legal_name IS NOT NULL
  AND btrim(c.legal_name) = btrim(t.tax_identifier);

-- 3) Yeni kayıtlar için trigger ----------------------------------------------
-- companies INSERT'TE legal_name sütunu artık hiç geçilmez (NULL kalır);
-- VKN private tabloya yazılır. Profiller/sirket/üyelik provisioning ve
-- legacy meta anahtarları (company_phone/company_location) korunur.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role TEXT := NEW.raw_user_meta_data ->> 'role';
  safe_role public.user_role := 'candidate';
  company_id UUID;
  company_name TEXT := NULLIF(NEW.raw_user_meta_data ->> 'company_name', '');
  company_slug TEXT;
  tax_identifier TEXT := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'company_tax_identifier', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'company_legal_name', '')
  );
  tax_inserted INTEGER := 0;
BEGIN
  IF requested_role = 'employer' THEN
    safe_role := 'employer';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    safe_role
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
      updated_at = NOW();

  IF safe_role = 'employer' AND company_name IS NOT NULL THEN
    company_slug := regexp_replace(lower(company_name), '[^a-z0-9]+', '-', 'g');
    company_slug := trim(both '-' FROM company_slug) || '-' || substr(replace(NEW.id::text, '-', ''), 1, 8);

    INSERT INTO public.companies (
      owner_id,
      company_name,
      slug,
      company_email,
      phone,
      location,
      status
    )
    VALUES (
      NEW.id,
      company_name,
      company_slug,
      NULLIF(NEW.raw_user_meta_data ->> 'company_email', ''),
      NULLIF(NEW.raw_user_meta_data ->> 'company_phone', ''),
      NULLIF(NEW.raw_user_meta_data ->> 'company_location', ''),
      'pending'
    )
    RETURNING id INTO company_id;

    INSERT INTO public.company_members (company_id, user_id, member_role)
    VALUES (company_id, NEW.id, 'owner')
    ON CONFLICT DO NOTHING;

    IF tax_identifier IS NOT NULL THEN
      INSERT INTO public.employer_tax_identifiers (company_id, tax_identifier)
      VALUES (company_id, tax_identifier)
      ON CONFLICT (company_id) DO NOTHING;
      GET DIAGNOSTICS tax_inserted = ROW_COUNT;

      -- Yalnızca private tabloya yazım gerçekten gerçekleştiyse signup
      -- metadata'sından VKN anahtarlarını sil (diğer anahtarlar korunur).
      -- INSERT atlanırsa (çakışma) veya tax_identifier yoksa temizlik yapılmaz.
      IF tax_inserted > 0 THEN
        UPDATE auth.users
        SET raw_user_meta_data = raw_user_meta_data
          - 'company_tax_identifier'
          - 'company_legal_name'
        WHERE id = NEW.id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
