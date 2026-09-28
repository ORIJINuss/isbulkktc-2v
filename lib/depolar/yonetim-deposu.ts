import { rolKontrolluKullaniciGetir } from "@/lib/guvenlik/yetki";

export async function yonetimOzetiniGetir() {
  const { supabase } = await rolKontrolluKullaniciGetir(["admin", "super_admin"]);
  const [acikDosyalar, raporlar, bekleyenSirketler] = await Promise.all([
    supabase.from("moderation_cases").select("id, entity_type, entity_id, reason, status, created_at").in("status", ["open", "reviewing"]).order("created_at", { ascending: false }).limit(50),
    supabase.from("reports").select("id, entity_type, entity_id, reason, details, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("companies").select("id, company_name, status, verification_notes, created_at").eq("status", "pending").order("created_at", { ascending: true }).limit(50),
  ]);

  const hata = acikDosyalar.error ?? raporlar.error ?? bekleyenSirketler.error;
  if (hata) throw new Error("Yönetim verileri alınamadı.");
  return {
    moderasyon: acikDosyalar.data ?? [],
    raporlar: raporlar.data ?? [],
    bekleyenSirketler: bekleyenSirketler.data ?? [],
  };
}

export async function moderasyonDosyasiniGuncelle(
  dosyaId: string,
  durum: "reviewing" | "resolved" | "dismissed",
) {
  const { supabase, kullanici } = await rolKontrolluKullaniciGetir(["admin", "super_admin"]);
  const { error } = await supabase
    .from("moderation_cases")
    .update({
      status: durum,
      reviewed_by: kullanici.id,
      resolved_at: durum === "resolved" || durum === "dismissed" ? new Date().toISOString() : null,
    })
    .eq("id", dosyaId);
  if (error) throw new Error("Moderasyon dosyası güncellenemedi.");
  await supabase.from("audit_logs").insert({
    actor_id: kullanici.id,
    entity_type: "moderation_case",
    entity_id: dosyaId,
    action: `status_${durum}`,
    details: { status: durum },
  });
}
