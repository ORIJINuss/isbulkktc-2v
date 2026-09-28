import { apiHatasi, apiJson } from "@/lib/api/yanit";
import { istekBaglamiOlustur, log } from "@/lib/sunucu/loglama";
import { turnstileDogrula } from "@/lib/guvenlik/turnstile";

type DogrulamaIstegi = {
  token?: string;
  gizliAnahtar?: string;
};

export async function POST(istek: Request) {
  const baglam = istekBaglamiOlustur(istek);
  try {
    const govde = (await istek.json()) as DogrulamaIstegi;
    const dogrulama = await turnstileDogrula(govde?.token);
    if (!dogrulama.basarili) {
      if (dogrulama.hataKodu === 400) {
        return apiHatasi(
          "Turnstile doğrulama belirteci (token) eksik.",
          400,
          "GECERSIZ_ISTEK",
          baglam
        );
      }
      if (dogrulama.hataKodu === 503) {
        return apiHatasi(
          "Doğrulama şu anda kullanılamıyor.",
          503,
          "YAPILANDIRMA_HATASI",
          baglam
        );
      }
      return apiHatasi("Doğrulama başarısız.", 403, "GECERSIZ_ISTEK", baglam);
    }

    return apiJson(
      {
        basarili: true,
        zamanDamgasi: dogrulama.zamanDamgasi,
        sunucu: dogrulama.sunucu,
      },
      200,
      baglam
    );
  } catch (hata) {
    log.hata("Turnstile isteği işlenemedi.", hata, baglam);
    return apiHatasi("Doğrulama şu anda kullanılamıyor.", 500, "SUNUCU_HATASI", baglam);
  }
}
