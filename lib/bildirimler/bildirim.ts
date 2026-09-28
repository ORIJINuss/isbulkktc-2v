import { sunucuIcinSupabaseOlustur } from "@/lib/supabase/sunucu-istemci";

export type BildirimOlusturma = {
  userId: string;
  kind: "system" | "application" | "message" | "payment" | "job";
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  code: string;
};

export async function bildirimOlustur(veri: BildirimOlusturma) {
  const supabase = await sunucuIcinSupabaseOlustur();
  const { data: bildirim, error } = await supabase
    .from("notifications")
    .insert({
      user_id: veri.userId,
      kind: veri.kind,
      title: veri.title,
      message: veri.message,
      metadata: veri.metadata ?? {},
    })
    .select("id")
    .single();

  if (error) throw new Error("Bildirim oluşturulamadı.");

  const { error: teslimHatasi } = await supabase.from("notification_deliveries").insert({
    notification_id: bildirim.id,
    channel: "in_app",
    status: "queued",
  });

  if (teslimHatasi) throw new Error("Bildirim teslimatı kuyruğa alınamadı.");
  return bildirim;
}
