import { rolKontrolluKullaniciGetir, sirketUyeliginiDogrula } from "@/lib/guvenlik/yetki";
import { hizmetRoluIcinSupabaseOlustur } from "@/lib/supabase/sunucu-istemci";
import { log } from "@/lib/sunucu/loglama";

export type SirketOlusturmaVerisi = {
  company_name: string;
  slug: string;
  legal_name?: string;
  company_email?: string;
  phone?: string;
  website?: string;
  location?: string;
  description?: string;
};

export type IlanOlusturmaVerisi = {
  company_id: string;
  title: string;
  slug: string;
  summary?: string;
  description: string;
  location: string;
  employment_type: string;
  remote_policy?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  expires_at?: string;
  status?: "draft" | "active" | "paused" | "filled" | "archived";
};

export type SirketGuncellemeVerisi = Partial<
  Pick<SirketOlusturmaVerisi, "company_name" | "legal_name" | "company_email" | "phone" | "website" | "location" | "description">
>;

export async function kamuyaAcikSirketleriGetir() {
  const supabase = await hizmetRoluIcinSupabaseOlustur();
  const { data, error } = await supabase
    .from("companies")
    .select("id, company_name, slug, logo_url, location, description, is_verified")
    .eq("status", "active")
    .eq("is_verified", true)
    .order("company_name", { ascending: true });

  if (error) {
    log.hata("kamuyaAcikSirketleriGetir: dogrulanmis sirket listesi alinamadi", error);
    throw new Error("Şirket listesi alınamadı.");
  }
  return data ?? [];
}

export async function kamuyaAcikSirketiGetir(slug: string) {
  const supabase = await hizmetRoluIcinSupabaseOlustur();
  const { data: sirket, error: sirketHatasi } = await supabase
    .from("companies")
    .select("id, company_name, slug, logo_url, location, description, is_verified")
    .eq("slug", slug)
    .eq("status", "active")
    .eq("is_verified", true)
    .maybeSingle();

  if (sirketHatasi) {
    log.hata("kamuyaAcikSirketiGetir: sirket profili alinamadi", sirketHatasi, { slug });
    throw new Error("Şirket profili alınamadı.");
  }
  if (!sirket) return null;

  const { data: ilanlar, error: ilanHatasi } = await supabase
    .from("job_posts")
    .select("id, title, slug, summary, location, employment_type, salary_min, salary_max, currency, published_at")
    .eq("company_id", sirket.id)
    .eq("status", "active")
    .not("published_at", "is", null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("published_at", { ascending: false });

  if (ilanHatasi) {
    log.hata("kamuyaAcikSirketiGetir: sirketin acik ilanlari alinamadi", ilanHatasi, { slug, sirketId: sirket.id });
    throw new Error("Şirketin açık ilanları alınamadı.");
  }
  return { ...sirket, ilanlar: ilanlar ?? [] };
}

export async function sirketOlustur(veri: SirketOlusturmaVerisi) {
  const { supabase, kullanici } = await rolKontrolluKullaniciGetir(["employer"]);
  const { data: sirket, error } = await supabase
    .from("companies")
    .insert({ ...veri, owner_id: kullanici.id })
    .select("*")
    .single();

  if (error) throw new Error("Şirket profili oluşturulamadı.");

  const { error: uyelikHatasi } = await supabase.from("company_members").insert({
    company_id: sirket.id,
    user_id: kullanici.id,
    member_role: "owner",
  });

  if (uyelikHatasi) throw new Error("Şirket üyeliği oluşturulamadı.");
  return sirket;
}

export async function sirketlerimiGetir() {
  const { supabase, kullanici } = await rolKontrolluKullaniciGetir(["employer", "admin", "super_admin"]);
  const { data, error } = await supabase
    .from("company_members")
    .select("member_role, companies(*)")
    .eq("user_id", kullanici.id);

  if (error) throw new Error("Şirketleriniz alınamadı.");
  return data;
}

export async function sirketProfiliniGuncelle(
  sirketId: string,
  degisiklik: SirketGuncellemeVerisi,
) {
  const { supabase } = await sirketUyeliginiDogrula(sirketId, ["owner"]);
  const { data, error } = await supabase
    .from("companies")
    .update(degisiklik)
    .eq("id", sirketId)
    .select("*")
    .single();

  if (error) throw new Error("Şirket profili güncellenemedi.");
  return data;
}

export async function sirketUyeleriniGetir(sirketId: string) {
  const { supabase } = await sirketUyeliginiDogrula(sirketId, ["owner", "recruiter", "viewer"]);
  const { data, error } = await supabase
    .from("company_members")
    .select("company_id, user_id, member_role, created_at, profiles(id, email, full_name, role)")
    .eq("company_id", sirketId)
    .order("created_at", { ascending: true });

  if (error) throw new Error("Şirket üyeleri alınamadı.");
  return data;
}

export async function sirketUyesiEkle(
  sirketId: string,
  userId: string,
  memberRole: "recruiter" | "viewer",
) {
  const { supabase } = await sirketUyeliginiDogrula(sirketId, ["owner"]);
  const { data, error } = await supabase
    .from("company_members")
    .insert({ company_id: sirketId, user_id: userId, member_role: memberRole })
    .select("*")
    .single();

  if (error) throw new Error("Şirket üyesi eklenemedi.");
  return data;
}

export async function sirketIlanlariniGetir(sirketId: string) {
  const { supabase } = await sirketUyeliginiDogrula(sirketId, ["owner", "recruiter", "viewer"]);
  const { data, error } = await supabase
    .from("job_posts")
    .select("*")
    .eq("company_id", sirketId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Şirket ilanları alınamadı.");
  return data;
}

export async function sirketIlaniOlustur(veri: IlanOlusturmaVerisi) {
  const { supabase } = await sirketUyeliginiDogrula(veri.company_id, ["owner", "recruiter"]);
  const { data, error } = await supabase
    .from("job_posts")
    .insert({
      ...veri,
      status: veri.status ?? "draft",
      published_at: veri.status === "active" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error) throw new Error("İlan oluşturulamadı.");
  return data;
}

export async function sirketIlaniniGuncelle(
  sirketId: string,
  ilanId: string,
  degisiklik: Partial<Omit<IlanOlusturmaVerisi, "company_id" | "slug">>,
) {
  const { supabase } = await sirketUyeliginiDogrula(sirketId, ["owner", "recruiter"]);
  const payload = {
    ...degisiklik,
    ...(degisiklik.status === "active" ? { published_at: new Date().toISOString() } : {}),
  };
  const { data, error } = await supabase
    .from("job_posts")
    .update(payload)
    .eq("id", ilanId)
    .eq("company_id", sirketId)
    .select("*")
    .single();

  if (error) throw new Error("İlan güncellenemedi.");
  return data;
}

export async function sirketBasvurulariniGetir(sirketId: string) {
  const { supabase } = await sirketUyeliginiDogrula(sirketId, ["owner", "recruiter", "viewer"]);
  const { data, error } = await supabase
    .from("applications")
    .select("id, job_id, candidate_id, cover_letter, status, source, created_at, updated_at, job_posts!inner(id, title, company_id), profiles!applications_candidate_id_fkey(id, full_name, email, locale)")
    .eq("job_posts.company_id", sirketId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Başvurular alınamadı.");
  return data;
}

export async function sirketDashboardOzetiniGetir(sirketId: string) {
  const { supabase } = await sirketUyeliginiDogrula(sirketId, ["owner", "recruiter", "viewer"]);
  const [ilanlar, aktifIlanlar, basvurular] = await Promise.all([
    supabase.from("job_posts").select("id", { count: "exact", head: true }).eq("company_id", sirketId),
    supabase.from("job_posts").select("id", { count: "exact", head: true }).eq("company_id", sirketId).eq("status", "active"),
    supabase
      .from("applications")
      .select("id, job_posts!inner(company_id)", { count: "exact", head: true })
      .eq("job_posts.company_id", sirketId),
  ]);

  if (ilanlar.error || aktifIlanlar.error || basvurular.error) {
    throw new Error("İşveren paneli özeti alınamadı.");
  }

  return {
    ilanSayisi: ilanlar.count ?? 0,
    aktifIlanSayisi: aktifIlanlar.count ?? 0,
    basvuruSayisi: basvurular.count ?? 0,
  };
}

export async function basvuruDurumunuGuncelle(
  basvuruId: string,
  durum:
    | "submitted"
    | "viewed"
    | "reviewing"
    | "shortlisted"
    | "interview"
    | "offer"
    | "accepted"
    | "hired"
    | "rejected"
    | "withdrawn",
) {
  const { supabase } = await rolKontrolluKullaniciGetir(["employer", "admin", "super_admin"]);

  const { data, error } = await supabase.rpc("update_application_status", {
    p_application_id: basvuruId,
    p_to_status: durum,
  });

  if (error) throw new Error("Başvuru durumu güncellenemedi.");
  return data;
}
