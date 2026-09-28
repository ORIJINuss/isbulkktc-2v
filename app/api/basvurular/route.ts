import { NextRequest } from "next/server";
import { apiHatasi, apiJson } from "@/lib/api/yanit";
import { istekBaglamiOlustur, log } from "@/lib/sunucu/loglama";
import { BASVURU_SEMA } from "@/lib/veri/basvuru-sema";
import { turnstileDogrula } from "@/lib/guvenlik/turnstile";
import { rolKontrolluKullaniciGetir, YetkiHatasi } from "@/lib/guvenlik/yetki";

type BasvuruGovdesi = Record<string, unknown> & { turnstileToken?: unknown };

export async function POST(istek: NextRequest) {
  const baglam = istekBaglamiOlustur(istek);

  try {
    const govde = (await istek.json().catch(() => null)) as BasvuruGovdesi | null;
    if (!govde || typeof govde !== "object") {
      return apiHatasi("Başvuru verisi okunamadı.", 400, "GECERSIZ_ISTEK", baglam);
    }

    const dogrulama = await turnstileDogrula(govde.turnstileToken);
    if (!dogrulama.basarili) {
      return apiHatasi(
        dogrulama.hataKodu === 503
          ? "Doğrulama şu anda kullanılamıyor."
          : "Doğrulama başarısız.",
        dogrulama.hataKodu,
        dogrulama.hataKodu === 503 ? "YAPILANDIRMA_HATASI" : "GECERSIZ_ISTEK",
        baglam
      );
    }

    const { turnstileToken: _token, ...alanlar } = govde;
    void _token;
    const veri = BASVURU_SEMA.safeParse(alanlar);
    if (!veri.success) {
      return apiHatasi(
        "Başvuru bilgileri geçersiz.",
        400,
        "GECERSIZ_ISTEK",
        baglam
      );
    }

    const { supabase, kullanici } = await rolKontrolluKullaniciGetir(["candidate"]);

    const { data: ilan, error: ilanHatasi } = await supabase
      .from("job_posts")
      .select("id, status, expires_at")
      .eq("slug", veri.data.ilanSlug)
      .maybeSingle();

    if (ilanHatasi) {
      log.hata("Başvuru ilan sorgusu başarısız.", ilanHatasi, baglam);
      return apiHatasi("Başvuru gönderilemedi.", 500, "SUNUCU_HATASI", baglam);
    }
    if (!ilan) {
      return apiHatasi(
        "Bu ilan başvuru kanalı üzerinden yayımlanmıyor.",
        409,
        "GECERSIZ_ISTEK",
        baglam
      );
    }
    if (ilan.status !== "active") {
      return apiHatasi("Bu ilan artık başvuru kabul etmiyor.", 409, "GECERSIZ_ISTEK", baglam);
    }
    if (ilan.expires_at && new Date(ilan.expires_at).getTime() < Date.now()) {
      return apiHatasi("Bu ilanın başvuru süresi dolmuş.", 409, "GECERSIZ_ISTEK", baglam);
    }

    const istenenCvYolu = veri.data.cvDosyaYolu?.trim() ?? "";
    let onayliCvYolu: string | null = null;
    if (istenenCvYolu) {
      const { data: cvKayitlari, error: cvHatasi } = await supabase
        .from("cv_documents")
        .select("id")
        .eq("storage_path", istenenCvYolu)
        .eq("candidate_id", kullanici.id)
        .neq("processing_status", "deleted")
        .limit(1);

      if (cvHatasi) {
        log.hata("Başvuru CV doğrulama sorgusu başarısız.", cvHatasi, baglam);
        return apiHatasi("Başvuru gönderilemedi.", 500, "SUNUCU_HATASI", baglam);
      }
      const kayit = Array.isArray(cvKayitlari) ? cvKayitlari[0] : null;
      if (!kayit) {
        return apiHatasi(
          "Yüklediğiniz CV kaydı doğrulanamadı. Lütfen CV'yi yeniden yükleyin.",
          400,
          "GECERSIZ_ISTEK",
          baglam
        );
      }
      onayliCvYolu = istenenCvYolu;
    }

    const { data, error } = await supabase
      .from("applications")
      .insert({
        job_id: ilan.id,
        candidate_id: kullanici.id,
        cover_letter: veri.data.kapakMektubu ?? null,
        cv_url: onayliCvYolu,
        status: "submitted",
        source: "website",
      })
      .select("id, status, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return apiHatasi("Bu ilana zaten başvurdunuz.", 409, "GECERSIZ_ISTEK", baglam);
      }
      log.hata("Başvuru kaydı oluşturulamadı.", error, baglam);
      return apiHatasi("Başvuru gönderilemedi.", 500, "SUNUCU_HATASI", baglam);
    }

    return apiJson({ basarili: true, basvuru: data }, 201, baglam);
  } catch (hata) {
    if (hata instanceof YetkiHatasi) {
      return apiHatasi(hata.message, hata.durum, "GECERSIZ_ISTEK", baglam);
    }
    log.hata("Başvuru isteği işlenemedi.", hata, baglam);
    return apiHatasi("Başvuru gönderilemedi.", 500, "SUNUCU_HATASI", baglam);
  }
}
