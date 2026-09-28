import { kimlikliKullaniciGetir } from "@/lib/guvenlik/yetki";
import { randomUUID } from "node:crypto";

type CandidateProfilePatch = {
  headline?: string;
  summary?: string;
  city?: string;
  country?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  preferred_locations?: string[];
  salary_expectation_min?: number;
  salary_expectation_max?: number;
  availability?: string;
};

export type BasvuruOlusturmaVerisi = {
  job_id: string;
  cover_letter?: string;
  cv_url?: string;
};

export async function adayProfiliniGetir() {
  const { supabase, kullanici } = await kimlikliKullaniciGetir();
  const { data, error } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", kullanici.id)
    .maybeSingle();

  if (error) throw new Error("Aday profili alınamadı.");
  return data;
}

export async function adayProfiliniGuncelle(degisiklik: CandidateProfilePatch) {
  const { supabase, kullanici } = await kimlikliKullaniciGetir();
  const { data, error } = await supabase
    .from("candidate_profiles")
    .upsert({ user_id: kullanici.id, ...degisiklik }, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw new Error("Aday profili güncellenemedi.");
  return data;
}

export async function kayitliIlanlariGetir() {
  const { supabase, kullanici } = await kimlikliKullaniciGetir();
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("id, job_id, created_at, job_posts(*)")
    .eq("user_id", kullanici.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Kayıtlı ilanlar alınamadı.");
  return data;
}

export async function ilanKaydet(ilanId: string) {
  const { supabase, kullanici } = await kimlikliKullaniciGetir();
  const { data, error } = await supabase
    .from("saved_jobs")
    .insert({ user_id: kullanici.id, job_id: ilanId })
    .select("id, job_id, created_at")
    .single();

  if (error) throw new Error("İlan kaydedilemedi.");
  return data;
}

export async function ilanKaydiniKaldir(ilanId: string) {
  const { supabase, kullanici } = await kimlikliKullaniciGetir();
  const { error } = await supabase
    .from("saved_jobs")
    .delete()
    .eq("user_id", kullanici.id)
    .eq("job_id", ilanId);

  if (error) throw new Error("Kayıtlı ilan kaldırılamadı.");
}

export async function adayBasvurulariniGetir() {
  const { supabase, kullanici } = await kimlikliKullaniciGetir();
  const { data, error } = await supabase
    .from("applications")
    .select("id, job_id, cover_letter, status, source, created_at, updated_at, job_posts(id, title, slug, location, companies(company_name))")
    .eq("candidate_id", kullanici.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Başvurularınız alınamadı.");
  return data;
}

export async function ilanaBasvur(veri: BasvuruOlusturmaVerisi) {
  const { supabase, kullanici } = await kimlikliKullaniciGetir();
  const { data, error } = await supabase
    .from("applications")
    .insert({ ...veri, candidate_id: kullanici.id, status: "submitted" })
    .select("id, job_id, status, created_at")
    .single();

  if (error) throw new Error("Başvuru oluşturulamadı.");
  return data;
}

export async function adayBildirimleriniGetir() {
  const { supabase, kullanici } = await kimlikliKullaniciGetir();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, status, title, message, metadata, created_at")
    .eq("user_id", kullanici.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error("Bildirimler alınamadı.");
  return data;
}

export async function bildirimiOkunduIsaretle(bildirimId: string) {
  const { supabase, kullanici } = await kimlikliKullaniciGetir();
  const { error } = await supabase
    .from("notifications")
    .update({ status: "read" })
    .eq("id", bildirimId)
    .eq("user_id", kullanici.id);

  if (error) throw new Error("Bildirim güncellenemedi.");
}

export async function adayCvBelgeleriniGetir() {
  const { supabase, kullanici } = await kimlikliKullaniciGetir();
  const { data, error } = await supabase
    .from("cv_documents")
    .select("id, storage_path, original_filename, mime_type, byte_size, processing_status, is_active, created_at, updated_at, cv_versions(*)")
    .eq("candidate_id", kullanici.id)
    .neq("processing_status", "deleted")
    .order("created_at", { ascending: false });

  if (error) throw new Error("CV belgeleri alınamadı.");
  return data;
}

export async function cvYukle(
  dosya: { name: string; type: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> },
) {
  const { supabase, kullanici } = await kimlikliKullaniciGetir();
  const izinliTipler = new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);
  if (!izinliTipler.has(dosya.type) || dosya.size <= 0 || dosya.size > 10 * 1024 * 1024) {
    throw new Error("CV yalnızca PDF veya DOCX ve en fazla 10 MB olabilir.");
  }

  const uzanti = dosya.type === "application/pdf" ? "pdf" : "docx";
  const yol = `${kullanici.id}/${randomUUID()}.${uzanti}`;
  const { error: yuklemeHatasi } = await supabase.storage
    .from("candidate-cvs")
    .upload(yol, await dosya.arrayBuffer(), {
      contentType: dosya.type,
      upsert: false,
    });
  if (yuklemeHatasi) throw new Error("CV dosyası yüklenemedi.");

  const { data, error } = await supabase
    .from("cv_documents")
    .insert({
      candidate_id: kullanici.id,
      storage_path: yol,
      original_filename: dosya.name,
      mime_type: dosya.type,
      byte_size: dosya.size,
      processing_status: "queued",
    })
    .select("id, storage_path, original_filename, processing_status, created_at")
    .single();
  if (error) {
    await supabase.storage.from("candidate-cvs").remove([yol]);
    throw new Error("CV kaydı oluşturulamadı.");
  }
  return data;
}
