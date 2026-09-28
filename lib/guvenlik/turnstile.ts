import { turnstileOrtamYapilandir } from "@/lib/ortam/ortam";

export type TurnstileDogrulamaSonucu =
  | { basarili: true; zamanDamgasi?: string; sunucu?: string }
  | { basarili: false; hataKodu: 400 | 403 | 503 };

export async function turnstileDogrula(
  token: unknown
): Promise<TurnstileDogrulamaSonucu> {
  if (typeof token !== "string" || token.trim().length === 0) {
    return { basarili: false, hataKodu: 400 };
  }

  let gizliAnahtar: string;
  try {
    ({ gizliAnahtar } = turnstileOrtamYapilandir());
  } catch {
    return { basarili: false, hataKodu: 503 };
  }

  const form = new URLSearchParams();
  form.append("secret", gizliAnahtar);
  form.append("response", token);

  let disCevap: Response;
  try {
    disCevap = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
        cache: "no-store",
      }
    );
  } catch {
    return { basarili: false, hataKodu: 503 };
  }

  const yanit = (await disCevap.json().catch(() => null)) as {
    success?: boolean;
    challenge_ts?: string;
    hostname?: string;
  } | null;

  if (!disCevap.ok || !yanit?.success) {
    return { basarili: false, hataKodu: 403 };
  }

  return {
    basarili: true,
    zamanDamgasi: yanit.challenge_ts,
    sunucu: yanit.hostname,
  };
}
