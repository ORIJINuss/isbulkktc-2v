import { generateText, gateway } from "ai";
import { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { apiHatasi, apiJson } from "@/lib/api/yanit";
import { hazirYanitiBul, destekSistemiTalimatlari } from "@/lib/destek/sohbet-kaynagi";
import { ISVEREN_PAKETLERI } from "@/lib/sabitler/isveren-paketleri";
import { SITEMAP_LOCALES, yerellestirilmisSiteHaritasi } from "@/lib/sabitler/site-haritasi";
import { istekBaglamiOlustur, log } from "@/lib/sunucu/loglama";
import {
  DestekSohbetCevapSema,
  DestekSohbetIstekSema,
} from "@/lib/veri/destek-sohbet-sema";

export const dynamic = "force-dynamic";

const MODEL = "inclusionai/ling-3.1-flash-free";
const RATE_LIMIT_PENCERE_MS = 10 * 60 * 1000;
const RATE_LIMIT_SAYISI = 10;
const RATE_LIMIT_KAYIT_SINIRI = 500;
// ponytail: Sınır süreç başınadır; instance'lar arası koruma için paylaşımlı depoya geç.
const modelIstekleri = new Map<string, { sayi: number; sifirlanma: number }>();

function istemciAnahtari(istek: NextRequest): string {
  const iletilen =
    istek.headers.get("cf-connecting-ip") ??
    istek.headers.get("x-real-ip") ??
    istek.headers.get("x-forwarded-for");
  return iletilen?.split(",")[0]?.trim().slice(0, 64) || "bilinmeyen";
}

function modelIstekSiniriDolduMu(anahtar: string): boolean {
  const simdi = Date.now();
  if (modelIstekleri.size >= RATE_LIMIT_KAYIT_SINIRI) {
    for (const [kayitAnahtari, kayit] of modelIstekleri) {
      if (kayit.sifirlanma <= simdi) modelIstekleri.delete(kayitAnahtari);
    }
  }

  const kayit = modelIstekleri.get(anahtar);
  if (!kayit || kayit.sifirlanma <= simdi) {
    if (modelIstekleri.size >= RATE_LIMIT_KAYIT_SINIRI) return true;
    modelIstekleri.set(anahtar, { sayi: 1, sifirlanma: simdi + RATE_LIMIT_PENCERE_MS });
    return false;
  }
  if (kayit.sayi >= RATE_LIMIT_SAYISI) return true;
  kayit.sayi += 1;
  return false;
}

async function hazirYanitiYanitla(
  anahtar: string,
  yerel: (typeof SITEMAP_LOCALES)[number],
  rota?: z.infer<typeof DestekSohbetCevapSema>["rota"],
) {
  const t = await getTranslations({ locale: yerel, namespace: "altbilgi" });
  let cevap: string;

  if (anahtar === "destekYanitPaketler") {
    const fiyat = (tutar: number) =>
      new Intl.NumberFormat(yerel, {
        style: "currency",
        currency: "TRY",
        maximumFractionDigits: 0,
      }).format(tutar);
    const paketler = [
      t("destekPaketTek", {
        fiyat: fiyat(ISVEREN_PAKETLERI.tekIlan.fiyatTRY),
        sure: ISVEREN_PAKETLERI.tekIlan.sureGun,
      }),
      t("destekPaketBaslangic", {
        fiyat: fiyat(ISVEREN_PAKETLERI.baslangic.fiyatTRY),
        kredi: ISVEREN_PAKETLERI.baslangic.ilanKredisi,
        sure: ISVEREN_PAKETLERI.baslangic.sureGun,
      }),
      t("destekPaketProfesyonel", {
        fiyat: fiyat(ISVEREN_PAKETLERI.profesyonel.fiyatTRY),
        kredi: ISVEREN_PAKETLERI.profesyonel.ilanKredisi,
        sure: ISVEREN_PAKETLERI.profesyonel.sureGun,
      }),
      t("destekPaketKurumsal", {
        fiyat: fiyat(ISVEREN_PAKETLERI.kurumsal.fiyatTRY),
        kredi: ISVEREN_PAKETLERI.kurumsal.ilanKredisi,
        sure: ISVEREN_PAKETLERI.kurumsal.sureGun,
      }),
    ];
    cevap = t(anahtar, { paketler: paketler.join(" · ") });
  } else if (anahtar === "destekYanitSiteHaritasi") {
    cevap = t(anahtar, {
      rotalar: yerellestirilmisSiteHaritasi(yerel).join(", "),
    });
  } else {
    cevap = t(anahtar);
  }

  return DestekSohbetCevapSema.parse({ cevap, kaynak: "hazir", rota });
}

export async function POST(istek: NextRequest) {
  const baglam = istekBaglamiOlustur(istek);
  const uzunluk = Number(istek.headers.get("content-length"));
  if (Number.isFinite(uzunluk) && uzunluk > 12_000) {
    return apiHatasi("Sohbet isteği çok uzun.", 413, "GECERSIZ_ISTEK", baglam);
  }

  let govde: unknown;
  try {
    const hamGovde = await istek.text();
    if (new TextEncoder().encode(hamGovde).byteLength > 12_000) {
      return apiHatasi("Sohbet isteği çok uzun.", 413, "GECERSIZ_ISTEK", baglam);
    }
    govde = JSON.parse(hamGovde) as unknown;
  } catch {
    return apiHatasi("Sohbet isteği geçersiz.", 400, "GECERSIZ_ISTEK", baglam);
  }

  const dogrulama = DestekSohbetIstekSema.safeParse(govde);
  if (!dogrulama.success) {
    return apiHatasi("Sohbet isteği geçersiz.", 400, "GECERSIZ_ISTEK", baglam);
  }

  const veri = dogrulama.data;
  const sonMesaj = veri.mesajlar.at(-1);
  if (!sonMesaj || sonMesaj.rol !== "user") {
    return apiHatasi("Sohbet mesajı eksik.", 400, "GECERSIZ_ISTEK", baglam);
  }

  const hazirYaniti = hazirYanitiBul(sonMesaj.metin);
  if (hazirYaniti) {
    const cevap = await hazirYanitiYanitla(
      hazirYaniti.anahtar,
      veri.yerel,
      hazirYaniti.rota,
    );
    return apiJson(cevap, 200, baglam);
  }

  const t = await getTranslations({ locale: veri.yerel, namespace: "altbilgi" });
  if (!process.env.AI_GATEWAY_API_KEY?.trim()) {
    return apiJson(
      DestekSohbetCevapSema.parse({
        cevap: t("destekAiYapilandirilmadi"),
        kaynak: "yedek",
      }),
      200,
      baglam,
    );
  }

  if (modelIstekSiniriDolduMu(istemciAnahtari(istek))) {
    return apiHatasi(t("destekHizAsimi"), 429, "GECERSIZ_ISTEK", baglam);
  }

  try {
    const siteHaritasi = yerellestirilmisSiteHaritasi(veri.yerel);
    const sonuc = await generateText({
      model: gateway(MODEL),
      instructions: destekSistemiTalimatlari(
        veri.yerel,
        siteHaritasi,
        JSON.stringify(ISVEREN_PAKETLERI),
      ),
      messages: veri.mesajlar.slice(-8).map((mesaj) => ({
        role: mesaj.rol,
        content: mesaj.metin,
      })),
      maxOutputTokens: 280,
      abortSignal: AbortSignal.timeout(20_000),
    });
    const cevap = sonuc.text.trim();
    if (!cevap) throw new Error("Model boş yanıt döndürdü.");

    return apiJson(
      DestekSohbetCevapSema.parse({ cevap, kaynak: "ai" }),
      200,
      baglam,
    );
  } catch (hata) {
    log.hata("Destek sohbetinde AI yanıtı alınamadı.", hata, {
      yerel: veri.yerel,
      istekKimligi: baglam.istekKimligi,
    });
    return apiHatasi(t("destekYanitiAlinamadi"), 502, "SUNUCU_HATASI", baglam);
  }
}
