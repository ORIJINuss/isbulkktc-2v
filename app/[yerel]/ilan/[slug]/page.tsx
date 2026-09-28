"use client";

import { useState, useMemo } from "react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { sb } from "@/lib/yardimcilar/sinif-yardimcisi";
import {
  tarihFormatla,
  paraFormatla,
  gunBazliNeKadarOnce,
} from "@/lib/yardimcilar/bicimlendiriciler";
import Buton from "@/bilesenler/genel/Buton";
import Rozet from "@/bilesenler/genel/Rozet";
import IlanKartı from "@/bilesenler/ilan/IlanKartı";
import TurnstileBileseni from "@/bilesenler/genel/TurnstileBileseni";
import { BASVURU_SEMA } from "@/lib/veri/basvuru-sema";
import {
  IZIN_TIPLERI,
  ILCELER,
  YAN_HAKLAR,
  PARA_BIRIMLERI,
  CALISMA_SEKILLERI,
  SEKTORLER,
} from "@/lib/sabitler/alan-degiskenleri";

import {
  ilanGetir,
  benzerIlanlar,
  ilanEkMetaGetir,
} from "@/lib/depolar/ilan-deposu";
import VeritabaniIlanDetayi from "@/bilesenler/ilan/VeritabaniIlanDetayi";
import type { Ilan } from "@/lib/veri/ilan-tipi";

type Props = {
  params: { slug: string; yerel: string };
};

type DemoIlanProps = {
  slug: string;
  yerel: string;
};

const CV_EN_FAZLA_BOYUT = 10 * 1024 * 1024;
const CV_IZINLI_TIPLER: readonly string[] = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

type CvYuklemeCevabi = {
  basarili?: boolean;
  hata?: string;
  veri?: { storage_path?: unknown } | null;
};

async function cvDosyayiYukle(dosya: File, varsayilanHata: string): Promise<string> {
  const formVerisi = new FormData();
  formVerisi.append("file", dosya);
  const cevap = await fetch("/api/aday/cv", { method: "POST", body: formVerisi });
  const govde = (await cevap.json().catch(() => null)) as CvYuklemeCevabi | null;
  const yol = govde?.veri?.storage_path;
  if (!cevap.ok || typeof yol !== "string" || yol.length === 0) {
    throw new Error(govde?.hata ?? varsayilanHata);
  }
  return yol;
}

function schemaOrgIcinIlan(ilan: Ilan, ekMeta: ReturnType<typeof ilanEkMetaGetir>, yerel: string) {
  const paraBirimi =
    !ilan.maasAraligi.gizli && ilan.maasAraligi.para
      ? ilan.maasAraligi.para
      : "GBP";
  const min =
    !ilan.maasAraligi.gizli && ilan.maasAraligi.min != null
      ? ilan.maasAraligi.min
      : ilan.minNetAylik ?? 0;
  const mak =
    !ilan.maasAraligi.gizli && ilan.maasAraligi.mak != null
      ? ilan.maasAraligi.mak
      : ilan.makNetAylik ?? min;
  const ilce = ILCELER.find((i) => ilan.ilceler.includes(i.deger))?.etiket ??
    "Lefkoşa";
  const pozisyonTanimi = ekMeta?.pozisyonTanimi?.length
    ? ekMeta.pozisyonTanimi
    : [ilan.isTanimi ?? ilan.pozisyonBasligi];
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: ilan.pozisyonBasligi,
    description: pozisyonTanimi.join("\n"),
    identifier: {
      "@type": "PropertyValue",
      name: "İşBulKKTC Referans No",
      value: ilan.referansNo,
    },
    datePosted: ilan.yayinTarihi,
    validThrough: ilan.sonBasvuruTarihi,
    employmentType: ilan.calismaSekli,
    hiringOrganization: {
      "@type": "Organization",
      name: ilan.sirketAdi,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: ilce,
        addressCountry: "CY",
        addressRegion: "KKTC",
      },
    },
    baseSalary: ilan.maasAraligi.gizli
      ? undefined
      : {
          "@type": "MonetaryAmount",
          currency: paraBirimi,
          value: {
            "@type": "QuantitativeValue",
            minValue: min,
            maxValue: mak,
            unitText: "AY",
          },
        },
    inLanguage: [yerel, "en"],
    totalJobOpenings: 1,
  };
}

function DemoIlanDetay({ slug, yerel }: DemoIlanProps) {
  const t = useTranslations("ilanDetay");
  const a = useTranslations("ilanAra");
  const g = useTranslations("genel");
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [izinTipi, setIzinTipi] = useState<string>("VATANDAS");
  const [kapakMetni, setKapakMetni] = useState<string>("");
  const [adSoyad, setAdSoyad] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [cepTelefonu, setCepTelefonu] = useState<string>("");
  const [cvDosya, setCvDosya] = useState<File | undefined>();
  const [gizlilikOnayi, setGizlilikOnayi] = useState(false);
  const [alanHatalari, setAlanHatalari] = useState<
    Partial<Record<"adSoyad" | "email" | "cepTelefonu" | "gizlilikIzni", string>>
  >({});
  const [yukleniyor, setYukleniyor] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);
  const [kanalHatasi, setKanalHatasi] = useState<string | null>(null);

  const ilan = ilanGetir(slug);
  if (!ilan) notFound();
  const ekMeta = ilanEkMetaGetir(slug);
  const benzer = benzerIlanlar(slug, 2);

  const jsonLd = useMemo(() => schemaOrgIcinIlan(ilan, ekMeta, yerel), [ilan, ekMeta, yerel]);

  const paraBirimi =
    !ilan.maasAraligi.gizli && ilan.maasAraligi.para
      ? ilan.maasAraligi.para
      : "GBP";
  const minMaas =
    !ilan.maasAraligi.gizli && ilan.maasAraligi.min != null
      ? ilan.maasAraligi.min
      : ilan.minNetAylik ?? 0;
  const makMaas =
    !ilan.maasAraligi.gizli && ilan.maasAraligi.mak != null
      ? ilan.maasAraligi.mak
      : ilan.makNetAylik ?? minMaas;

  const ilceler = ilan.ilceler
    .map((k) => ILCELER.find((i) => i.deger === k)?.etiket ?? k)
    .join(", ");

  const pozisyonTanimi = ekMeta?.pozisyonTanimi?.length
    ? ekMeta.pozisyonTanimi
    : [ilan.isTanimi ?? `${ilan.pozisyonBasligi} pozisyonunda yetenekli ekip arkadaşları arıyoruz.`];
  const teknikYetenekler = ekMeta?.teknikYetenekler?.length
    ? ekMeta.teknikYetenekler
    : [
        {
          grup: "Temel Beceriler",
          etiketler: ilan.zorunluBeceriler?.slice(0, 8) ?? ["İletişim", "Takım Çalışması"],
        },
      ];
  const sektorEtiketi = SEKTORLER.find((s) => s.deger === ilan.sektorKodu)?.etiket
    ?? ilan.sektor ?? "—";
  const aiGerekce = ilan.aiEslestirme?.gerekce
    ?? ekMeta?.tanitim
    ?? `${ilan.sirketAdi} KKTC'nin önde gelen kurumlarından biridir.`;

  const calismaModeliEtiketi =
    ilan.calismaModeli === "HIBRIT"
      ? a("calismaModeliHibrit")
      : ilan.calismaModeli === "UZAKTAN"
        ? a("calismaModeliUzaktan")
        : a("calismaModeliOfiste");
  const calismaDuzeniSatirlari = Array.from(
    new Set(
      [
        CALISMA_SEKILLERI.find((s) => s.deger === ilan.calismaSekli)?.etiket,
        calismaModeliEtiketi,
        ekMeta?.calismaSekliAciklama,
      ].filter(
        (satir): satir is string => typeof satir === "string" && satir.trim().length > 0
      )
    )
  );

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) return;

    const veri = BASVURU_SEMA.safeParse({
      ilanSlug: ilan.slug,
      adSoyad: adSoyad.trim(),
      email: email.trim(),
      cepTelefonu: cepTelefonu.trim(),
      ikametIzinDurumu: izinTipi,
      kapakMektubu: kapakMetni.trim() || undefined,
      cvDosyaYolu: "",
      gizlilikIzni: gizlilikOnayi,
    });

    if (!veri.success) {
      const gosterilecekAlanlar = [
        "adSoyad",
        "email",
        "cepTelefonu",
        "gizlilikIzni",
      ] as const;
      const hatalar: typeof alanHatalari = {};
      for (const [alan, hata] of Object.entries(
        veri.error.flatten().fieldErrors
      )) {
        const ilk = hata?.[0];
        if (!ilk) continue;
        if ((gosterilecekAlanlar as readonly string[]).includes(alan)) {
          hatalar[alan as keyof typeof hatalar] = ilk;
        }
      }
      setAlanHatalari(hatalar);
      return;
    }

    setAlanHatalari({});
    setYukleniyor(true);
    setKanalHatasi(null);
    try {
      const cvYolu = cvDosya
        ? await cvDosyayiYukle(cvDosya, t("basvuruCvYukleHatasi"))
        : "";
      const cevap = await fetch("/api/basvurular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...veri.data, cvDosyaYolu: cvYolu, turnstileToken }),
      });
      if (!cevap.ok) {
        const govde = (await cevap.json().catch(() => null)) as {
          hata?: string;
        } | null;
        setKanalHatasi(govde?.hata ?? t("basvuruKanalHatasi"));
        return;
      }
      setGonderildi(true);
    } catch (hata) {
      setKanalHatasi(
        hata instanceof Error ? hata.message : t("basvuruKanalHatasi")
      );
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="py-8 sm:py-10 space-y-7">
        {/* Üst Başlık Kuşağı */}
        <section className="mineral-kart rounded-[24px] p-6 sm:p-7 overflow-hidden relative">
          <div className="absolute -top-40 -end-40 w-[520px] h-[520px] rounded-full bg-ana-kapsayici/50 blur-[120px] pointer-events-none" />
          <div className="relative grid lg:grid-cols-[1fr_auto] gap-5 lg:gap-6 items-start">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <Rozet tur="ozel-mineral" ikon="apartment">
                  {ilan.sirketAdi}
                </Rozet>
                {ilan.izinTipleri.map((it) => {
                  const bulundu = IZIN_TIPLERI.find((z) => z.deger === it);
                  return bulundu ? (
                    <Rozet key={it} tur="ana" ikon="workspace_premium" kucuk>
                      {bulundu.etiket}
                    </Rozet>
                  ) : null;
                })}
              </div>
              <h1 className="font-haber font-black tracking-tight leading-[1.03] text-3xl sm:text-4xl lg:text-5xl text-ikincil">
                {ilan.pozisyonBasligi}
              </h1>
              <div className="flex flex-wrap gap-3 text-xs text-ikincil/75 font-semibold">
                <span className="inline-flex items-center gap-1">
                  <span className="msimge text-[18px] text-ana">place</span>
                  {ilceler}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="msimge text-[18px] text-ana">calendar_month</span>
                  Yayın: {tarihFormatla(ilan.yayinTarihi)} ({gunBazliNeKadarOnce(ilan.yayinTarihi)})
                </span>
                {ilan.sonBasvuruTarihi && (
                  <span className="inline-flex items-center gap-1">
                    <span className="msimge text-[18px] text-ana">schedule</span>
                    Bitiş: {tarihFormatla(ilan.sonBasvuruTarihi)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                  <span className="msimge text-[18px] text-altin-cila">
                    confirmation_number
                  </span>
                  {ilan.referansNo}
                </span>
              </div>
            </div>
            <div className="lg:min-w-[320px] p-4 rounded-2xl bg-beyaz border border-ana-outline/30 shadow-mineral-dosye space-y-2.5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-ikincil/50 font-black">
                {t("netMaas")}
              </div>
              {ilan.maasAraligi.gizli ? (
                <div className="font-haber font-black text-2xl text-ana leading-tight">
                  Pazarlık · Gizli
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-1.5 leading-none">
                    <div className="font-haber font-black text-3xl sm:text-4xl text-ikincil tabular-nums">
                      {paraFormatla(minMaas, paraBirimi)}
                    </div>
                    <span className="text-ikincil/50 font-bold pb-1 text-base">
                      –
                    </span>
                    <div className="font-haber font-black text-3xl sm:text-4xl text-ana tabular-nums">
                      {paraFormatla(makMaas, paraBirimi)}
                    </div>
                  </div>
                  <div className="text-[11px] text-ikincil/70 font-semibold">
                    Net · Aylık ·{" "}
                    {PARA_BIRIMLERI.find((p) => p.deger === paraBirimi)?.etiket ?? ""}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Ana İçerik 8/4 grid */}
        <section className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
          <div className="space-y-6">
            <div className="mineral-kart p-6 rounded-2xl space-y-5">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-ikincil/50 mb-1.5">
                  01 · {t("hakkimizda")}
                </div>
                <h2 className="font-haber font-black text-2xl text-ikincil leading-tight mb-2.5">
                  Pozisyon özeti & ekip kültürü
                </h2>
                <div className="space-y-2.5 text-ikincil/85 leading-relaxed">
                  {pozisyonTanimi.map((parca, i) => (
                    <p key={i}>{parca}</p>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-4 gap-2.5 pt-1">
                {[
                  { anahtar: t("kategori"), deger: sektorEtiketi },
                  { anahtar: t("sehir"), deger: ilceler },
                  { anahtar: t("sirket"), deger: ilan.sirketAdi },
                  { anahtar: t("referansNo"), deger: ilan.referansNo },
                ].map((h) => (
                  <div
                    key={h.anahtar}
                    className="p-3 rounded-xl bg-ikincil-kapsayici/50 border border-ana-outline/25"
                  >
                    <div className="text-[10px] font-black uppercase tracking-wider text-ikincil/55">
                      {h.anahtar}
                    </div>
                    <div className="text-[13px] font-bold text-ana leading-snug mt-1">
                      {h.deger}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Teknik Yetenekler */}
            <div className="mineral-kart p-6 rounded-2xl space-y-4">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-ikincil/50 mb-1.5">
                  02 · {t("teknikYetenekler")}
                </div>
                <h2 className="font-haber font-black text-2xl text-ikincil leading-tight">
                  İlanı başarılı kılan anahtar kelimeler
                </h2>
              </div>
              <div className="space-y-3.5">
                {teknikYetenekler.map((g, gi) => (
                  <div key={gi}>
                    <div className="text-xs font-bold text-ana uppercase tracking-wider mb-1.5">
                      {g.grup}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {g.etiketler.map((et) => (
                        <span
                          key={et}
                          className="px-3 py-1.5 rounded-full bg-ana-kapsayici/60 border border-ana-outline/30 text-xs font-bold text-ana"
                        >
                          {et}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Çalışma Düzeni / Yan Haklar */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="mineral-kart p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-ana-kapsayici grid place-items-center">
                    <span className="msimge text-ana">schedule</span>
                  </div>
                  <h3 className="font-haber font-bold text-lg text-ikincil leading-tight">
                    {t("calismaDuzeni")}
                  </h3>
                </div>
                {calismaDuzeniSatirlari.length > 0 && (
                  <ul className="space-y-2">
                    {calismaDuzeniSatirlari.map((satir) => (
                      <li key={satir} className="flex items-start gap-2 text-sm text-ikincil/85">
                        <span className="msimge text-basari-900 mt-0.5 text-base">check_circle</span>
                        <span>{satir}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mineral-kart p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-altin-sabit/20 grid place-items-center">
                    <span className="msimge text-altin-cila">card_giftcard</span>
                  </div>
                  <h3 className="font-haber font-bold text-lg text-ikincil leading-tight">
                    {t("yanHaklar")}
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {ilan.yanHaklar.map((yh) => {
                    const bulundu = YAN_HAKLAR.find((y) => y.deger === yh);
                    return (
                      <div
                        key={yh}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-ana-kapsayici/40 border border-ana-outline/25"
                      >
                        <span className="msimge text-ana text-lg">
                          {bulundu?.ikon ?? "check"}
                        </span>
                        <span className="text-[13px] font-bold text-ana">
                          {bulundu?.etiket ?? yh}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Şirket Profili */}
            <div className="mineral-kart p-6 rounded-2xl space-y-4">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-ikincil-kapsayici/70 grid place-items-center border-2 border-beyaz shadow-mineral-dosye">
                    <span className="msimge text-ana text-3xl">apartment</span>
                  </div>
                  <div>
                    <h2 className="font-haber font-black text-2xl text-ikincil leading-tight">
                      {ilan.sirketAdi}
                    </h2>
                    <div className="text-xs text-ikincil/75 font-semibold mt-0.5">
                      {t("sirketProfili")}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-ikincil/80 leading-relaxed">
                {aiGerekce} Kurumsal sosyal sorumluluk projeleri ve
                KKTC geneli üniversite iş birliği programları ile çalışanlarına
                sürekli gelişim fırsatı sunmaktadır.
              </p>
            </div>

            {/* Benzer İlanlar */}
            {benzer.length > 0 && (
              <section>
                <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.18em] text-ikincil/50 mb-1.5">
                      05 · Önerilen
                    </div>
                    <h2 className="font-haber font-black text-2xl text-ikincil leading-tight">
                      {t("benzerIlanlar")}
                    </h2>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {benzer.map((b) => (
                    <IlanKartı key={b.slug} ilan={b} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sağ Başvuru Formu */}
          <aside className="sticky top-28 self-start space-y-4">
            <form
              onSubmit={gonder}
              className="mineral-kart rounded-[22px] p-6 space-y-5 shadow-mineral-yukseltilmis"
            >
              <div>
                <h3 className="font-haber font-black text-xl text-ikincil leading-tight">
                  {g("hemenBasvur")}
                </h3>
              </div>

              <div>
                <div className="girdiEtiket">{t("basvuruAdSoyad")} *</div>
                <input
                  name="adSoyad"
                  className="girdi w-full"
                  placeholder={t("basvuruAdSoyadYerTutucu")}
                  value={adSoyad}
                  onChange={(e) => setAdSoyad(e.target.value)}
                  maxLength={80}
                  required
                  aria-invalid={Boolean(alanHatalari.adSoyad)}
                />
                {alanHatalari.adSoyad && (
                  <p className="alanHatasi">{alanHatalari.adSoyad}</p>
                )}
              </div>
              <div>
                <div className="girdiEtiket">{t("basvuruEmail")} *</div>
                <input
                  name="email"
                  type="email"
                  className="girdi w-full"
                  placeholder="ahmet@email.ku"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={254}
                  required
                  aria-invalid={Boolean(alanHatalari.email)}
                />
                {alanHatalari.email && (
                  <p className="alanHatasi">{alanHatalari.email}</p>
                )}
              </div>
              <div>
                <div className="girdiEtiket">{t("basvuruTelefon")} *</div>
                <input
                  name="cepTelefonu"
                  type="tel"
                  inputMode="tel"
                  className="girdi w-full"
                  placeholder="+90 548 123 4567"
                  value={cepTelefonu}
                  onChange={(e) => setCepTelefonu(e.target.value)}
                  maxLength={24}
                  required
                  aria-invalid={Boolean(alanHatalari.cepTelefonu)}
                />
                {alanHatalari.cepTelefonu && (
                  <p className="alanHatasi">{alanHatalari.cepTelefonu}</p>
                )}
              </div>
              <div>
                <div className="girdiEtiket">{t("basvuruIzinDurumu")} *</div>
                <select
                  name="ikametIzinDurumu"
                  className="girdi w-full"
                  value={izinTipi}
                  onChange={(e) => setIzinTipi(e.target.value)}
                  required
                >
                  {IZIN_TIPLERI.map((iz) => (
                    <option key={iz.deger} value={iz.deger}>
                      {iz.etiket}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="girdiEtiket">{t("basvuruKapakMektubu")}</div>
                <textarea
                  name="kapakMektubu"
                  className="girdi w-full resize-none"
                  rows={3}
                  value={kapakMetni}
                  onChange={(e) => setKapakMetni(e.target.value)}
                  maxLength={2000}
                  placeholder={t("basvuruKapakMektubuYerTutucu")}
                />
              </div>
              <div>
                <div className="girdiEtiket">{t("basvuruCvYukle")}</div>
                <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-dashed border-ana-outline/50 bg-ana-kapsayici/30 cursor-pointer hover:bg-ana-kapsayici/60 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="msimge text-ana">upload_file</span>
                    <div className="text-sm text-ikincil truncate">
                      {cvDosya?.name ?? t("basvuruCvSecilmedi")}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-ana shrink-0">
                    {cvDosya ? t("basvuruCvDegistir") : t("basvuruCvSec")}
                  </span>
                  <input
                    name="cv"
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const secilen = e.target.files?.[0];
                      e.target.value = "";
                      if (!secilen) {
                        setCvDosya(undefined);
                        return;
                      }
                      if (
                        !CV_IZINLI_TIPLER.includes(secilen.type) ||
                        secilen.size === 0 ||
                        secilen.size > CV_EN_FAZLA_BOYUT
                      ) {
                        setCvDosya(undefined);
                        setKanalHatasi(t("basvuruCvYukleHatasi"));
                        return;
                      }
                      setKanalHatasi(null);
                      setCvDosya(secilen);
                    }}
                  />
                </label>
              </div>
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    name="gizlilikIzni"
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 accent-ana shrink-0"
                    checked={gizlilikOnayi}
                    onChange={(e) => setGizlilikOnayi(e.target.checked)}
                    aria-invalid={Boolean(alanHatalari.gizlilikIzni)}
                  />
                  <span className="text-[11px] text-ikincil/75 leading-snug">
                    {t("basvuruGizlilikOnayi")}
                  </span>
                </label>
                {alanHatalari.gizlilikIzni && (
                  <p className="alanHatasi">{alanHatalari.gizlilikIzni}</p>
                )}
              </div>
              <TurnstileBileseni onDogrulama={setTurnstileToken} />
              <Buton
                tur="buton"
                varyant="ana"
                boyut="blok"
                ikon={yukleniyor ? "progress_activity" : "send"}
                ikonSonunda
                yukleniyor={yukleniyor}
                disabled={!turnstileToken || gonderildi}
              >
                {gonderildi
                  ? t("basvuruAlindi")
                  : yukleniyor
                    ? t("basvuruGonderiliyor")
                    : g("hemenBasvur")}
              </Buton>
              {kanalHatasi && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-hata-kapsayici border border-hata/30 flex items-start gap-2"
                >
                  <span className="msimge text-hata text-xl shrink-0 mt-0.5">
                    error
                  </span>
                  <div className="text-[12px] text-hata leading-snug font-semibold">
                    {kanalHatasi}
                  </div>
                </div>
              )}
              {gonderildi && (
                <div className="p-3 rounded-xl bg-basari-900/12 border border-basari-900/30 flex items-start gap-2">
                  <span className="msimge text-basari-900 text-xl shrink-0 mt-0.5">
                    task_alt
                  </span>
                  <div className="text-[12px] text-basari-900 leading-snug font-semibold">
                    {t("basvuruAlindiAciklama")}
                  </div>
                </div>
              )}
            </form>

            <div className="mineral-kart rounded-2xl p-4 space-y-3 text-xs">
              <div className="font-haber font-bold text-ikincil flex items-center gap-2">
                <span className="msimge text-ana">tips_and_updates</span>
                Başvuru İyileştirme İpuçları
              </div>
              <ul className="space-y-1.5 text-ikincil/75 leading-snug">
                <li className="flex items-start gap-1.5">
                  <span className="msimge text-altin-cila mt-0.5 text-base">star</span>
                  İlan anahtar kelimelerini CV'nizin ilk 100 kelimesine yerleştirin.
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="msimge text-altin-cila mt-0.5 text-base">star</span>
                  Teknik becerilerinizi 8-12 madde ile sınırlandırın.
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="msimge text-altin-cila mt-0.5 text-base">star</span>
                  Yazı tipi olarak Hanken Grotesk benzeri temiz bir font seçin.
                </li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </>
  );
}

/**
 * REQ-JOB-LIVE-001 — Slug yonlendirmesi:
 *  - demo ilan (ORNEK_ILANLAR)   -> mevcut demo detay sayfasi
 *  - veritabani ilani (job_posts) -> canli veri detayi
 */
export default function IlanDetaySayfasi({ params }: Props) {
  if (!ilanGetir(params.slug)) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <VeritabaniIlanDetayi slug={params.slug} />
      </div>
    );
  }
  return <DemoIlanDetay slug={params.slug} yerel={params.yerel} />;
}
