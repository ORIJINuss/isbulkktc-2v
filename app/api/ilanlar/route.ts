import { NextRequest } from "next/server";
import { z } from "zod";
import { apiHatasi, apiJson } from "@/lib/api/yanit";
import {
  DESTEKLENMEYEN_FILTRELER,
  ILAN_SIRALAMALARI,
  ilanlariAra,
} from "@/lib/depolar/ilan-arama-deposu";
import { OrtamYapilandirmaHatasi } from "@/lib/ortam/ortam";
import { istekBaglamiOlustur, log } from "@/lib/sunucu/loglama";

export const dynamic = "force-dynamic";

const IlanAraSorguSema = z.object({
  arananKelime: z
    .string()
    .trim()
    .max(120, "Arama sorgusu en fazla 120 karakter olabilir")
    .optional(),
  konum: z
    .string()
    .trim()
    .max(80, "Konum en fazla 80 karakter olabilir")
    .optional(),
  sayfa: z.coerce.number().int().positive().max(500).default(1),
  sayfaBasi: z.coerce.number().int().min(1).max(50).default(10),
  minMaas: z.coerce.number().nonnegative().max(100_000_000).optional(),
  makMaas: z.coerce.number().nonnegative().max(100_000_000).optional(),
  paraBirimi: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Para birimi 3 harfli bir kod olmalı")
    .optional(),
  yayinGun: z.coerce.number().int().min(0).max(365).default(0),
  maasBelirtilmisMi: z
    .enum(["true", "false"])
    .default("false")
    .transform((deger) => deger === "true"),
  oneCikanlarMi: z
    .enum(["true", "false"])
    .default("false")
    .transform((deger) => deger === "true"),
  uzaktan: z
    .enum(["true", "false"])
    .default("false")
    .transform((deger) => deger === "true"),
  siralama: z.enum(ILAN_SIRALAMALARI).default("akilli"),
});

export async function GET(request: NextRequest) {
  const baglam = istekBaglamiOlustur(request);
  const params = request.nextUrl.searchParams;

  const parse = IlanAraSorguSema.safeParse({
    arananKelime: params.get("arananKelime") || undefined,
    konum: params.get("konum") || undefined,
    sayfa: params.get("sayfa") || 1,
    sayfaBasi: params.get("sayfaBasi") || 10,
    minMaas: params.get("minMaas") || undefined,
    makMaas: params.get("makMaas") || undefined,
    paraBirimi: params.get("paraBirimi") || undefined,
    yayinGun: params.get("yayinGun") || 0,
    maasBelirtilmisMi: params.get("maasBelirtilmisMi") || "false",
    oneCikanlarMi: params.get("oneCikanlarMi") || "false",
    uzaktan: params.get("uzaktan") || "false",
    siralama: params.get("siralama") || "akilli",
  });

  if (!parse.success) {
    log.uyari("ilanlar GET: arama parametreleri gecersiz", {
      sorunlar: parse.error.issues.slice(0, 5).map((i) => i.path.join(".")),
    });
    return apiHatasi(
      "Arama filtreleri geçersiz.",
      400,
      "GECERSIZ_ISTEK",
      baglam
    );
  }

  if (
    parse.data.minMaas !== undefined &&
    parse.data.makMaas !== undefined &&
    parse.data.minMaas > parse.data.makMaas
  ) {
    return apiHatasi(
      "Minimum maaş maksimum maaştan büyük olamaz.",
      400,
      "GECERSIZ_ISTEK",
      baglam
    );
  }

  try {
    const sonuc = await ilanlariAra({
      arama: parse.data.arananKelime,
      konum: parse.data.konum,
      sayfa: parse.data.sayfa,
      sayfaBoyutu: parse.data.sayfaBasi,
      minMaas: parse.data.minMaas,
      makMaas: parse.data.makMaas,
      paraBirimi: parse.data.paraBirimi,
      maasBelirtilmisMi: parse.data.maasBelirtilmisMi,
      oneCikanlarMi: parse.data.oneCikanlarMi,
      uzaktan: parse.data.uzaktan,
      yayinGun: parse.data.yayinGun,
      siralama: parse.data.siralama,
    });

    return apiJson(
      {
        basarili: true,
        ilanlar: sonuc.ilanlar,
        toplam: sonuc.toplam,
        sayfa: sonuc.sayfa,
        sayfaBasi: sonuc.sayfaBoyutu,
        dahaFazla: sonuc.dahaFazla,
        desteklenmeyenFiltreler: [...DESTEKLENMEYEN_FILTRELER] as string[],
      },
      200,
      baglam
    );
  } catch (hata) {
    if (hata instanceof OrtamYapilandirmaHatasi) {
      log.hata("ilanlar GET: ortam yapilandirmasi eksik", hata, baglam);
      return apiHatasi(
        "İlan servisi şu anda yapılandırılmamış.",
        503,
        "YAPILANDIRMA_HATASI",
        baglam
      );
    }
    log.hata("ilanlar GET: arama tamamlanamadi", hata, baglam);
    return apiHatasi(
      "İlan araması tamamlanamadı.",
      500,
      "SUNUCU_HATASI",
      baglam
    );
  }
}
