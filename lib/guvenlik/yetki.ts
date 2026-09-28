import { sunucuIcinSupabaseOlustur } from "@/lib/supabase/sunucu-istemci";

export type PlatformRolu = "candidate" | "employer" | "admin" | "super_admin";

export class YetkiHatasi extends Error {
  constructor(
    public readonly durum: 401 | 403,
    mesaj: string,
  ) {
    super(mesaj);
    this.name = "YetkiHatasi";
  }
}

export async function kimlikliKullaniciGetir() {
  const supabase = await sunucuIcinSupabaseOlustur();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new YetkiHatasi(401, "Bu işlem için giriş yapmanız gerekiyor.");
  }

  const { data: profil, error: profilHatasi } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profilHatasi) {
    throw new YetkiHatasi(401, "Oturum doğrulanamadı. Lütfen tekrar giriş yapın.");
  }

  if (profil?.account_status === "suspended" || profil?.account_status === "deleted") {
    throw new YetkiHatasi(403, "Hesabınız platform erişimine kapatılmıştır.");
  }

  return { supabase, kullanici: data.user };
}

export async function rolKontrolluKullaniciGetir(roller: PlatformRolu[]) {
  const { supabase, kullanici } = await kimlikliKullaniciGetir();
  const { data: profil, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", kullanici.id)
    .single();

  if (error || !profil || !roller.includes(profil.role as PlatformRolu)) {
    throw new YetkiHatasi(403, "Bu işlem için gerekli yetkiye sahip değilsiniz.");
  }

  return { supabase, kullanici, rol: profil.role as PlatformRolu };
}

export async function sirketUyeliginiDogrula(
  sirketId: string,
  roller: Array<"owner" | "recruiter" | "viewer"> = ["owner", "recruiter"],
) {
  const { supabase, kullanici } = await kimlikliKullaniciGetir();
  const { data, error } = await supabase
    .from("company_members")
    .select("member_role")
    .eq("company_id", sirketId)
    .eq("user_id", kullanici.id)
    .single();

  if (error || !data || !roller.includes(data.member_role as (typeof roller)[number])) {
    throw new YetkiHatasi(403, "Bu şirket kaynağına erişim yetkiniz yok.");
  }

  return { supabase, kullanici, memberRole: data.member_role };
}
