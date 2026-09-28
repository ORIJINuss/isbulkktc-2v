import { apiJson } from "@/lib/api/yanit";
import { ortamDegeri } from "@/lib/ortam/ortam";

export const dynamic = "force-dynamic";

type HazirlikKontrolleri = {
  supabaseUrl: boolean;
  supabaseAnonKey: boolean;
  supabaseServiceRoleKey: boolean;
  turnstile: boolean;
  paymentWebhook: boolean;
};

export async function GET() {
  const production = process.env.NODE_ENV === "production";
  const kontroller: HazirlikKontrolleri = {
    supabaseUrl: Boolean(ortamDegeri("NEXT_PUBLIC_SUPABASE_URL")),
    supabaseAnonKey: Boolean(ortamDegeri("NEXT_PUBLIC_SUPABASE_ANON_KEY")),
    supabaseServiceRoleKey: Boolean(ortamDegeri("SUPABASE_SERVICE_ROLE_KEY")),
    turnstile:
      Boolean(ortamDegeri("NEXT_PUBLIC_TURNSTILE_SITE_KEY")) &&
      Boolean(ortamDegeri("TURNSTILE_SECRET_KEY")),
    paymentWebhook: Boolean(ortamDegeri("PAYMENT_WEBHOOK_SECRET")),
  };

  const zorunluKontroller = [
    kontroller.supabaseUrl,
    kontroller.supabaseAnonKey,
    kontroller.supabaseServiceRoleKey,
    kontroller.turnstile,
    kontroller.paymentWebhook,
  ];
  const hazir = zorunluKontroller.every(Boolean);

  return apiJson(
    {
      basarili: hazir,
      durum: hazir ? "ready" : production ? "not_ready" : "development",
      kontroller,
      zaman: new Date().toISOString(),
    },
    hazir || !production ? 200 : 503,
  );
}
