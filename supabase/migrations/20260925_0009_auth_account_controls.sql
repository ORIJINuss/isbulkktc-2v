-- Phase 3 authentication controls: explicit account state and safe self-service updates.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_status_valid;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_valid
  CHECK (account_status IN ('active', 'suspended', 'deleted'));

CREATE INDEX IF NOT EXISTS idx_profiles_account_status
ON public.profiles(account_status);

CREATE OR REPLACE FUNCTION public.prevent_profile_account_control_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_status IS DISTINCT FROM OLD.account_status
     AND NOT public.is_platform_admin() THEN
    NEW.account_status := OLD.account_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_account_control_escalation ON public.profiles;
CREATE TRIGGER prevent_profile_account_control_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_account_control_escalation();

COMMENT ON COLUMN public.profiles.account_status IS 'Platform access state controlled by platform admins';
