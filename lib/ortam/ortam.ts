const DEFAULT_LOCAL_SUPABASE_URL = "http://local-supabase.invalid";
const DEFAULT_LOCAL_SUPABASE_ANON_KEY = "local-anon-key";
const DEFAULT_LOCAL_SERVICE_ROLE_KEY = "local-service-role-key";
const DEFAULT_LOCAL_TURNSTILE_SECRET = "1x0000000000000000000000000000000AA";
const DEFAULT_LOCAL_TURNSTILE_SITE = "1x00000000000000000000AA";
const VARSAYILAN_ANA_DOMAIN = "https://isbukkibris.com";

export class OrtamYapilandirmaHatasi extends Error {
  constructor(public readonly anahtar: string) {
    super(`${anahtar} yapılandırılmamış veya geçersiz.`);
    this.name = "OrtamYapilandirmaHatasi";
  }
}

function kullanilabilirMi(deger: string | undefined): deger is string {
  if (!deger) return false;
  return !["******", "[REDACTED]", "your-project", "ORNEK", "ornek"].some((yerTutucu) =>
    deger.includes(yerTutucu),
  );
}

export function ortamDegeri(anahtar: string, varsayilan?: string): string | undefined {
  const deger = process.env[anahtar]?.trim();
  if (kullanilabilirMi(deger)) return deger;
  return process.env.NODE_ENV === "production" ? undefined : varsayilan;
}

export function zorunluOrtamDegeri(anahtar: string, aciklama: string, varsayilan?: string): string {
  return zorunluOrtamDegeriniDogrula(ortamDegeri(anahtar), aciklama, varsayilan);
}

function zorunluOrtamDegeriniDogrula(deger: string | undefined, aciklama: string, varsayilan?: string): string {
  const temizDeger = deger?.trim();
  if (kullanilabilirMi(temizDeger)) return temizDeger;
  if (process.env.NODE_ENV === "production") throw new OrtamYapilandirmaHatasi(aciklama);
  if (kullanilabilirMi(varsayilan)) return varsayilan;
  throw new OrtamYapilandirmaHatasi(aciklama);
}

export function anaDomain(): string {
  const tanimli = process.env.NEXT_PUBLIC_ANA_DOMAIN?.trim();
  const kaynak = tanimli && kullanilabilirMi(tanimli) ? tanimli : VARSAYILAN_ANA_DOMAIN;
  return kaynak.replace(/\/+$/, "");
}

export function supabaseOrtamYapilandir() {
  return {
    url: zorunluOrtamDegeri("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", DEFAULT_LOCAL_SUPABASE_URL),
    anonAnahtar: zorunluOrtamDegeri(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      DEFAULT_LOCAL_SUPABASE_ANON_KEY,
    ),
  };
}

export function tarayiciSupabaseOrtamYapilandir() {
  return {
    url: zorunluOrtamDegeriniDogrula(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
      DEFAULT_LOCAL_SUPABASE_URL,
    ),
    anonAnahtar: zorunluOrtamDegeriniDogrula(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      DEFAULT_LOCAL_SUPABASE_ANON_KEY,
    ),
  };
}

export function supabaseHizmetRoluOrtamYapilandir() {
  const url = zorunluOrtamDegeri("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", DEFAULT_LOCAL_SUPABASE_URL);
  const servisAnahtari = ortamDegeri("SUPABASE_SERVICE_ROLE_KEY");
  if (process.env.NODE_ENV === "production" && !servisAnahtari) {
    throw new OrtamYapilandirmaHatasi("SUPABASE_SERVICE_ROLE_KEY");
  }
  return { url, servisAnahtari: servisAnahtari ?? DEFAULT_LOCAL_SERVICE_ROLE_KEY };
}

export function turnstileOrtamYapilandir() {
  const siteAnahtari = ortamDegeri("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
  const gizliAnahtar = ortamDegeri("TURNSTILE_SECRET_KEY");
  if (process.env.NODE_ENV === "production" && !siteAnahtari) {
    throw new OrtamYapilandirmaHatasi("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
  }
  if (process.env.NODE_ENV === "production" && !gizliAnahtar) {
    throw new OrtamYapilandirmaHatasi("TURNSTILE_SECRET_KEY");
  }
  return {
    siteAnahtari: siteAnahtari ?? DEFAULT_LOCAL_TURNSTILE_SITE,
    gizliAnahtar: gizliAnahtar ?? DEFAULT_LOCAL_TURNSTILE_SECRET,
  };
}
