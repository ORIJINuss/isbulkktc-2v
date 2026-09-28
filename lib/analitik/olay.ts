import { sunucuIcinSupabaseOlustur } from "@/lib/supabase/sunucu-istemci";

export type AnalitikOlayAdi =
  | "job_viewed"
  | "job_searched"
  | "filter_used"
  | "application_submitted"
  | "cv_uploaded"
  | "cv_activated"
  | "job_published"
  | "checkout_started"
  | "payment_completed";

type AnalitikOlay = {
  ad: AnalitikOlayAdi;
  companyId?: string;
  jobId?: string;
  ozellikler?: Record<string, string | number | boolean | null>;
  requestId?: string;
};

export async function analitikOlayKaydet(olay: AnalitikOlay) {
  const supabase = await sunucuIcinSupabaseOlustur();
  const { data } = await supabase.auth.getUser();
  const { error } = await supabase.from("analytics_events").insert({
    event_name: olay.ad,
    actor_id: data.user?.id ?? null,
    company_id: olay.companyId ?? null,
    job_id: olay.jobId ?? null,
    properties: olay.ozellikler ?? {},
    request_id: olay.requestId ?? null,
  });

  if (error) throw new Error("Analitik olayı kaydedilemedi.");
}
