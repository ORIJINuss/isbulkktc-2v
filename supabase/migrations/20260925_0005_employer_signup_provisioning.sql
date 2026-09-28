-- Provision the employer tenant from verified Auth metadata in the same transaction.

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
      legal_name,
      slug,
      company_email,
      phone,
      location,
      status
    )
    VALUES (
      NEW.id,
      company_name,
      NULLIF(NEW.raw_user_meta_data ->> 'company_legal_name', ''),
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
  END IF;

  RETURN NEW;
END;
$$;
