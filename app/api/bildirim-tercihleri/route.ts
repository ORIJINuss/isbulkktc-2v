import { NextRequest } from "next/server";
import { z } from "zod";
import { apiHatasi, apiJson } from "@/lib/api/yanit";
import { kimlikliKullaniciGetir, YetkiHatasi } from "@/lib/guvenlik/yetki";

const tercihSema = z.object({
  bildirimKodu: z.string().trim().min(1).max(100),
  uygulamaIci: z.boolean(),
  eposta: z.boolean(),
});

export async function GET() {
  try {
    const { supabase, kullanici } = await kimlikliKullaniciGetir();
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("notification_code, in_app_enabled, email_enabled")
      .eq("user_id", kullanici.id)
      .order("notification_code");
    if (error) return apiHatasi("Bildirim tercihleri alınamadı.", 500);
    return apiJson({ basarili: true, tercihler: data ?? [] });
  } catch (error) {
    if (error instanceof YetkiHatasi) return apiHatasi(error.message, error.durum, "GECERSIZ_ISTEK");
    return apiHatasi("Bildirim tercihleri alınamadı.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, kullanici } = await kimlikliKullaniciGetir();
    const veri = tercihSema.safeParse(await request.json());
    if (!veri.success) return apiHatasi("Bildirim tercihi geçersiz.", 400, "GECERSIZ_ISTEK");
    const { error } = await supabase.from("notification_preferences").upsert({
      user_id: kullanici.id,
      notification_code: veri.data.bildirimKodu,
      in_app_enabled: veri.data.uygulamaIci,
      email_enabled: veri.data.eposta,
    });
    if (error) return apiHatasi("Bildirim tercihi güncellenemedi.", 500);
    return apiJson({ basarili: true });
  } catch (error) {
    if (error instanceof YetkiHatasi) return apiHatasi(error.message, error.durum, "GECERSIZ_ISTEK");
    return apiHatasi("Bildirim tercihi güncellenemedi.", 500);
  }
}
