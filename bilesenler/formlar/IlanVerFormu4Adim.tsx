"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { sb } from "@/lib/yardimcilar/sinif-yardimcisi";
import Buton from "@/bilesenler/genel/Buton";
import Rozet from "@/bilesenler/genel/Rozet";
import ATSGöstergesi from "@/bilesenler/ilan/ATSGöstergesi";
import {
  ISVEREN_ILAN_FORMU_SEMA,
  IsverenIlanFormuTipi,
} from "@/lib/veri/isveren-ilan-formu-sema";
import {
  ILCELER,
  IZIN_TIPLERI,
  CALISMA_SEKILLERI,
  PARA_BIRIMLERI,
  YAN_HAKLAR,
  DENEYIM_SEVIYELERI,
  CEFR_DIL_SEVIYELERI,
} from "@/lib/sabitler/alan-degiskenleri";
import type { IlceKodu } from "@/lib/veri/ilan-tipi";

const ADIMLAR = ["temel", "yasal", "maas", "eslestirme"] as const;
type Adim = (typeof ADIMLAR)[number];

export default function IlanVerFormu4Adim({ sinif }: { sinif?: string }) {
  const t = useTranslations("isverenFormu");
  const g = useTranslations("genel");
  const [adim, setAdim] = useState<Adim>("temel");
  const [veri, setVeri] = useState<Partial<IsverenIlanFormuTipi>>({
    temel: {
      ilanBasligi: "Kıdemli Frontend Yazılım Geliştirici",
      naceKodu: "J6201",
      iscoGrubu: "2514",
      sektorKodu: "BILISIM",
      ilceKodlari: ["LEF"],
      calismaSekliKodu: "TAM_ZAMANLI",
      calismaModeli: "HIBRIT",
      isTanimi:
        "KKTC genelinde hızlı büyüyen turtech girişimimizde modern Next.js 14 App Router ekibiyle ürün geliştirecek, Pearl Field mineral tasarım sistemine uygun UI bileşenleri üreteceksiniz.",
    },
    yasal: {
      izinTipiKodlari: ["VATANDAS"],
      isverenOnIzınTeminat: true,
      b3PrimUyumlulugu: true,
    },
    maas: {
      paraBirimi: "GBP",
      minNetAylik: 54000,
      makNetAylik: 72000,
      maasGizle: false,
      yanHakKodlari: ["LOJMAN", "YEMEK", "UCAK", "EKIPMAN"],
    },
    eslestirme: {
      zorunluBeceriler: ["Next.js", "TypeScript", "Tailwind", "next-intl"],
      deneyimSeviyesi: "MID",
      yabanciDilSeviyesi: "C1",
      atsEsikYuzdesi: 72,
    },
  });

  const [yanHakSecimleri, setYanHakSecimleri] = useState<string[]>(
    veri.maas?.yanHakKodlari ?? []
  );
  const [beceriMetni, setBeceriMetni] = useState<string>(
    (veri.eslestirme?.zorunluBeceriler ?? []).join(", ")
  );
  const [durumMesaji, setDurumMesaji] = useState<string | null>(null);

  const gecerliMi = useMemo(() => {
    try {
      ISVEREN_ILAN_FORMU_SEMA.parse(veri);
      return true;
    } catch {
      return false;
    }
  }, [veri]);

  const adimIndeksi = ADIMLAR.indexOf(adim);
  const sonraki = () =>
    setAdim(ADIMLAR[Math.min(adimIndeksi + 1, ADIMLAR.length - 1)]);
  const onceki = () =>
    setAdim(ADIMLAR[Math.max(adimIndeksi - 1, 0)]);
  const taslakKaydet = () => {
    window.localStorage.setItem("isbukkktc-ilan-taslaki", JSON.stringify(veri));
    setDurumMesaji("Taslak bu tarayıcıda kaydedildi.");
  };
  const yayinaAl = () => {
    if (!gecerliMi) return;
    window.localStorage.setItem("isbukkktc-ilan-yayina-hazir", JSON.stringify(veri));
    setDurumMesaji("İlanınız doğrulama kuyruğuna alındı.");
  };
  const guncelle = <A extends keyof IsverenIlanFormuTipi>(
    alt: A,
    alan: keyof IsverenIlanFormuTipi[A],
    deger: unknown
  ) =>
    setVeri((v) => ({
      ...v,
      [alt]: { ...(v[alt] ?? {}), [alan]: deger } as IsverenIlanFormuTipi[A],
    }));

  const canliAts = Math.max(
    35,
    Math.min(
      96,
      (veri.eslestirme?.deneyimSeviyesi === "JUN"
        ? 2
        : veri.eslestirme?.deneyimSeviyesi === "MID"
          ? 4
          : 7) *
        8 +
        (veri.eslestirme?.zorunluBeceriler?.length ?? 0) * 6 +
        (veri.eslestirme?.atsEsikYuzdesi ?? 0) * 0.3
    )
  );

  return (
    <div className={sb("grid lg:grid-cols-[1.35fr_1fr] gap-6", sinif)}>
      <div className="mineral-kart p-6 sm:p-8 space-y-7">
        <ol className="flex items-center gap-1 text-xs font-semibold">
          {ADIMLAR.map((a, i) => {
            const adimI = ADIMLAR.indexOf(a);
            const aktif = adim === a;
            const tamamlandi = adimI < adimIndeksi;
            return (
              <li key={a} className="flex items-center gap-1 flex-1">
                <button
                  type="button"
                  onClick={() => setAdim(a)}
                  className={sb(
                    "flex items-center gap-2 p-2 rounded-xl transition-all w-full text-start",
                    aktif
                      ? "bg-ana text-beyaz shadow-mineral-dosye"
                      : tamamlandi
                      ? "bg-basari-900/15 text-basari-900"
                      : "bg-ikincil-kapsayici text-ikincil/70"
                  )}
                >
                  <span
                    className={sb(
                      "w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-black shrink-0",
                      aktif ? "bg-beyaz text-ana" : ""
                    )}
                  >
                    {tamamlandi ? "✓" : i + 1}
                  </span>
                  <span className="hidden sm:inline truncate">
                    {[
                      t("adim1Baslik"),
                      t("adim2Baslik"),
                      t("adim3Baslik"),
                      t("adim4Baslik"),
                    ][i]}
                  </span>
                </button>
                {i < ADIMLAR.length - 1 && (
                  <div className="h-px flex-1 bg-ana-outline/30" />
                )}
              </li>
            );
          })}
        </ol>

        {adim === "temel" && (
          <div className="space-y-5">
            <div>
              <label className="girdiEtiket">{t("ilanBasligi")} *</label>
              <input
                value={veri.temel?.ilanBasligi ?? ""}
                onChange={(e) =>
                  guncelle("temel", "ilanBasligi", e.target.value)
                }
                className="girdi w-full font-haber text-lg"
                maxLength={140}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="girdiEtiket">{t("naceKodu")}</label>
                <input
                  value={veri.temel?.naceKodu ?? ""}
                  onChange={(e) => guncelle("temel", "naceKodu", e.target.value)}
                  className="girdi w-full"
                  placeholder="J6201"
                />
              </div>
              <div>
                <label className="girdiEtiket">{t("iscoGrubu")}</label>
                <input
                  value={veri.temel?.iscoGrubu ?? ""}
                  onChange={(e) => guncelle("temel", "iscoGrubu", e.target.value)}
                  className="girdi w-full"
                  placeholder="2514"
                />
              </div>
            </div>
            <div>
              <label className="girdiEtiket">{t("ilce")} *</label>
              <div className="flex flex-wrap gap-2">
                {ILCELER.filter((i) => i.deger !== "KKTC").map((i) => {
                  const secili =
                    (veri.temel?.ilceKodlari ?? []).includes(
                      i.deger as IlceKodu
                    ) ?? false;
                  return (
                    <button
                      key={i.deger}
                      type="button"
                      onClick={() => {
                        const dizi = veri.temel?.ilceKodlari ?? [];
                        guncelle(
                          "temel",
                          "ilceKodlari",
                          secili
                            ? dizi.filter((x: string) => x !== i.deger)
                            : [...dizi, i.deger]
                        );
                      }}
                      className={sb(
                        "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all",
                        secili
                          ? "bg-ana text-beyaz border-ana"
                          : "bg-ikincil-kapsayici/60 text-ikincil border-ana-outline/40 hover:bg-ikincil-kapsayici"
                      )}
                    >
                      {i.etiket}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="girdiEtiket">{t("calismaModeli")}</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { deger: "OFISTE", etiket: t("ofiste"), ikon: "apartment" },
                  { deger: "HIBRIT", etiket: t("hibrit"), ikon: "split" },
                  { deger: "UZAKTAN", etiket: t("uzaktan"), ikon: "home_work" },
                ].map((c) => {
                  const secili = veri.temel?.calismaModeli === c.deger;
                  return (
                    <button
                      key={c.deger}
                      type="button"
                      onClick={() =>
                        guncelle("temel", "calismaModeli", c.deger)
                      }
                      className={sb(
                        "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all",
                        secili
                          ? "bg-ana-kapsayici border-ana"
                          : "bg-ikincil-kapsayici/50 border-ana-outline/30 hover:bg-ikincil-kapsayici"
                      )}
                    >
                      <span className="msimge text-xl text-ana">{c.ikon}</span>
                      <span className="text-xs font-semibold">{c.etiket}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="girdiEtiket">{t("isTanimi")}</label>
              <textarea
                value={veri.temel?.isTanimi ?? ""}
                onChange={(e) => guncelle("temel", "isTanimi", e.target.value)}
                rows={6}
                className="girdi w-full resize-none leading-relaxed"
                placeholder="En az 200 karakterlik editoryal bir iş tanımı..."
              />
            </div>
          </div>
        )}

        {adim === "yasal" && (
          <div className="space-y-5">
            <p className="text-xs text-ikincil/70 bg-ana-kapsayici/50 p-3 rounded-xl border border-ana-outline/30">
              Çalışma ve Sosyal Güvenlik Bakanlığı Md. 59 uyarınca ilanınızda
              sunacağınız izin kapsamını seçin. Her biri ilan standartlarıyla
              eşleştirilir.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {IZIN_TIPLERI.map((i, idx) => {
                const secili =
                  veri.yasal?.izinTipiKodlari?.includes(
                    i.deger as (typeof veri.yasal.izinTipiKodlari)[number]
                  ) ?? false;
                return (
                  <label
                    key={i.deger}
                    className={sb(
                      "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3",
                      secili
                        ? "bg-ana-kapsayici border-ana shadow-mineral-dosye"
                        : "bg-ikincil-kapsayici/40 border-ana-outline/30 hover:bg-ikincil-kapsayici"
                    )}
                  >
                    <input
                      type="radio"
                      name="izin"
                      checked={secili}
                      onChange={() =>
                        guncelle("yasal", "izinTipiKodlari", [i.deger])
                      }
                      className="mt-1 w-4 h-4 text-ana"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ikincil/60 font-mono">
                          TİP {idx + 1}
                        </span>
                        <h5 className="font-haber text-ana font-semibold text-sm leading-tight">
                          {i.etiket}
                        </h5>
                      </div>
                      <p className="text-[11px] text-ikincil/75 leading-snug mt-1.5">
                        {i.aciklama}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="space-y-2 pt-2">
              {[
                {
                  anahtar: "isverenOnIzınTeminat",
                  baslik: t("taahhut1"),
                  ikon: "picture_as_pdf",
                },
                {
                  anahtar: "b3PrimUyumlulugu",
                  baslik: t("taahhut2"),
                  ikon: "health_and_safety",
                },
              ].map((tk) => (
                <label
                  key={tk.anahtar}
                  className="flex items-center justify-between p-3 rounded-xl bg-ikincil-kapsayici/40 hover:bg-ikincil-kapsayici cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="msimge text-ana">{tk.ikon}</span>
                    <span className="text-sm font-medium text-ana">
                      {tk.baslik}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const anahtar =
                        tk.anahtar as keyof IsverenIlanFormuTipi["yasal"];
                      guncelle(
                        "yasal",
                        anahtar,
                        !(veri.yasal?.[anahtar] ?? false)
                      );
                    }}
                    className={sb(
                      "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full",
                      veri.yasal?.[tk.anahtar as keyof typeof veri.yasal]
                        ? "bg-ana"
                        : "bg-ikincil-kapsayici"
                    )}
                  >
                    <span
                      className={sb(
                        "inline-block h-4 w-4 bg-beyaz rounded-full transition-transform",
                        veri.yasal?.[tk.anahtar as keyof typeof veri.yasal]
                          ? "ms-4"
                          : "ms-0.5"
                      )}
                    />
                  </button>
                </label>
              ))}
            </div>
          </div>
        )}

        {adim === "maas" && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="girdiEtiket">{t("paraBirimi")}</label>
                <select
                  value={veri.maas?.paraBirimi ?? "GBP"}
                  onChange={(e) =>
                    guncelle("maas", "paraBirimi", e.target.value)
                  }
                  className="girdi w-full"
                >
                  {PARA_BIRIMLERI.map((p) => (
                    <option key={p.deger} value={p.deger}>
                      {p.sembol} · {p.etiket}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="girdiEtiket">{t("minMaas")}</label>
                <input
                  type="number"
                  value={veri.maas?.minNetAylik ?? 0}
                  onChange={(e) =>
                    guncelle("maas", "minNetAylik", Number(e.target.value))
                  }
                  className="girdi w-full tabular-nums"
                />
              </div>
              <div>
                <label className="girdiEtiket">{t("makMaas")}</label>
                <input
                  type="number"
                  value={veri.maas?.makNetAylik ?? 0}
                  onChange={(e) =>
                    guncelle("maas", "makNetAylik", Number(e.target.value))
                  }
                  className="girdi w-full tabular-nums"
                />
              </div>
            </div>
            <label className="flex items-center justify-between p-3 rounded-xl bg-ana-kapsayici/50 border border-ana-outline/30 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <span className="msimge text-ana">visibility_off</span>
                <span className="text-sm font-medium text-ana">
                  {t("maasGizle")}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  guncelle("maas", "maasGizle", !veri.maas?.maasGizle)
                }
                className={sb(
                  "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full",
                  veri.maas?.maasGizle ? "bg-ana" : "bg-ikincil-kapsayici"
                )}
              >
                <span
                  className={sb(
                    "inline-block h-4 w-4 bg-beyaz rounded-full transition-transform",
                    veri.maas?.maasGizle ? "ms-4" : "ms-0.5"
                  )}
                />
              </button>
            </label>
            <div>
              <label className="girdiEtiket">{t("yanHaklarBaslik")}</label>
              <div className="grid grid-cols-2 gap-2">
                {YAN_HAKLAR.map((yh) => {
                  const secili = yanHakSecimleri.includes(yh.deger);
                  return (
                    <button
                      key={yh.deger}
                      type="button"
                      onClick={() => {
                        const dizi = secili
                          ? yanHakSecimleri.filter((x) => x !== yh.deger)
                          : [...yanHakSecimleri, yh.deger];
                        setYanHakSecimleri(dizi);
                        guncelle("maas", "yanHakKodlari", dizi);
                      }}
                      className={sb(
                        "flex items-center gap-2 p-3 rounded-xl border text-start transition-all",
                        secili
                          ? "bg-ana-kapsayici border-ana"
                          : "bg-ikincil-kapsayici/40 border-ana-outline/30 hover:bg-ikincil-kapsayici"
                      )}
                    >
                      <span className="msimge text-ana text-base">{yh.ikon}</span>
                      <span className="text-xs font-semibold">{yh.etiket}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {adim === "eslestirme" && (
          <div className="space-y-5">
            <div>
              <label className="girdiEtiket">{t("zorunluBeceriler")}</label>
              <textarea
                value={beceriMetni}
                onChange={(e) => {
                  setBeceriMetni(e.target.value);
                  guncelle(
                    "eslestirme",
                    "zorunluBeceriler",
                    e.target.value
                      .split(",")
                      .map((b) => b.trim())
                      .filter(Boolean)
                  );
                }}
                rows={3}
                className="girdi w-full resize-none"
                placeholder="Next.js, TypeScript, Tailwind, Supabase"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(veri.eslestirme?.zorunluBeceriler ?? []).map((b) => (
                  <span
                    key={b}
                    className="px-2.5 py-1 rounded-full bg-ana-kapsayici text-ana text-xs font-medium border border-ana-outline/30"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="girdiEtiket">{t("deneyimYili")}</label>
                <select
                  value={veri.eslestirme?.deneyimSeviyesi ?? "MID"}
                  onChange={(e) =>
                    guncelle(
                      "eslestirme",
                      "deneyimSeviyesi",
                      e.target.value
                    )
                  }
                  className="girdi w-full"
                >
                  {DENEYIM_SEVIYELERI.map((d) => (
                    <option key={d.deger} value={d.deger}>
                      {d.etiket}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="girdiEtiket">{t("yabanciDil")}</label>
                <select
                  value={veri.eslestirme?.yabanciDilSeviyesi ?? "B2"}
                  onChange={(e) =>
                    guncelle("eslestirme", "yabanciDilSeviyesi", e.target.value)
                  }
                  className="girdi w-full"
                >
                  {CEFR_DIL_SEVIYELERI.map((d) => (
                    <option key={d.deger} value={d.deger}>
                      {d.etiket}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="girdiEtiket !mb-0">{t("aiEsik")}</label>
                <span className="font-haber font-bold text-ana tabular-nums">
                  %{veri.eslestirme?.atsEsikYuzdesi ?? 75}
                </span>
              </div>
              <input
                type="range"
                min={30}
                max={95}
                step={1}
                value={veri.eslestirme?.atsEsikYuzdesi ?? 75}
                onChange={(e) =>
                  guncelle(
                    "eslestirme",
                    "atsEsikYuzdesi",
                    Number(e.target.value)
                  )
                }
                className="w-full h-1.5 rounded-full bg-ikincil-kapsayici accent-ana"
              />
              <div className="flex justify-between text-[10px] text-ikincil/60 mt-1.5 font-semibold">
                <span>{t("genisHavuz")} · 30</span>
                <span className="text-ana">{t("onerilenDenge")} · 75</span>
                <span>{t("kritikUyumluluk")} · 95</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-ana-outline/30">
          <Buton
            tur="buton"
            varyant="metinsel"
            boyut="md"
            ikon="arrow_back"
            onClick={onceki}
            disabled={adimIndeksi === 0}
          >
            {g("onceki")}
          </Buton>
          <div className="flex items-center gap-2">
            <Buton
              tur="buton"
              varyant="ikincil"
              boyut="md"
              ikon="save"
              onClick={taslakKaydet}
            >
              {g("taslakKaydet")}
            </Buton>
            {adimIndeksi < ADIMLAR.length - 1 ? (
              <Buton
                tur="buton"
                varyant="ana"
                boyut="md"
                ikon="arrow_forward"
                ikonSonunda
                onClick={sonraki}
              >
                {g("sonraki")}
              </Buton>
            ) : (
              <Buton
                tur="buton"
                varyant="ana"
                boyut="md"
                ikon="rocket_launch"
                ikonSonunda
                disabled={!gecerliMi}
                onClick={yayinaAl}
              >
                {g("yayinaAl")}
              </Buton>
            )}
          </div>
        </div>
        {durumMesaji && (
          <div
            role="status"
            className="rounded-xl border border-basari-900/25 bg-basari-900/10 px-4 py-3 text-sm font-semibold text-basari-900"
          >
            {durumMesaji}
          </div>
        )}
      </div>

      <aside className="sticky top-28 self-start space-y-4">
        <div className="camsi-kart p-5 rounded-2xl border border-altin-cila/30">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-haber font-bold text-ana tracking-tight">
              {g("onizle")}
            </h4>
            <Rozet tur="ozel-mineral" ikon="preview" kucuk>
              Canlı
            </Rozet>
          </div>
          <div className="space-y-3">
            <div>
              <h5 className="font-haber font-bold text-ikincil leading-snug">
                {veri.temel?.ilanBasligi}
              </h5>
              <div className="flex flex-wrap gap-1 mt-2">
                {veri.temel?.ilceKodlari?.slice(0, 2).map((il: string) => (
                  <Rozet key={il} tur="ikincil" kucuk>
                    {ILCELER.find((i) => i.deger === il)?.etiket ?? il}
                  </Rozet>
                ))}
                {CALISMA_SEKILLERI.find(
                  (c) => c.deger === veri.temel?.calismaSekliKodu
                ) && (
                  <Rozet tur="tersiyer" kucuk>
                    {
                      CALISMA_SEKILLERI.find(
                        (c) => c.deger === veri.temel?.calismaSekliKodu
                      )?.etiket
                    }
                  </Rozet>
                )}
                <Rozet tur="basari" ikon="shield_person" kucuk>
                  B3 Onaylı
                </Rozet>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-ikincil-kapsayici/50 rounded-xl">
              <span className="msimge text-ana text-xl">paid</span>
              <div className="flex-1">
                <div className="text-[10px] text-ikincil/60 font-semibold uppercase tracking-wide">
                  Net Aylık
                </div>
                <div className="font-haber font-bold text-ikincil tabular-nums">
                  {veri.maas?.maasGizle ? "Gizli · Pazarlık" : (
                    <>
                      {(veri.maas?.minNetAylik ?? 0).toLocaleString("tr-TR")} –{" "}
                      {(veri.maas?.makNetAylik ?? 0).toLocaleString("tr-TR")}{" "}
                      {PARA_BIRIMLERI.find(
                        (p) => p.deger === veri.maas?.paraBirimi
                      )?.sembol}
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-ana-kapsayici/50 rounded-xl border border-ana-outline/30">
              <ATSGöstergesi yuzde={canliAts} boyut="sm" />
              <div className="flex-1">
                <div className="text-[10px] text-ikincil/70 font-semibold uppercase tracking-wide">
                  Canlı ATS Eşiği
                </div>
                <div className="text-xs text-ana font-medium leading-snug">
                  Beklenen ortalama eşleşme: <b>%{canliAts}</b>. İlanınız{" "}
                  <b>{Math.round(canliAts / 9)}</b>/10 ön filtreden geçiyor.
                </div>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-ikincil/60 font-semibold mb-1.5 uppercase tracking-wide">
                {t("yanHaklarBaslik")}
              </div>
              <div className="flex flex-wrap gap-1">
                {(veri.maas?.yanHakKodlari ?? []).map((yh: string) => {
                  const bulundu = YAN_HAKLAR.find((y) => y.deger === yh);
                  return bulundu ? (
                    <span
                      key={yh}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-ana-kapsayici/60 text-[11px] text-ana font-semibold border border-ana-outline/20"
                    >
                      <span className="msimge text-sm">{bulundu.ikon}</span>
                      {bulundu.etiket}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="mineral-kart p-4 rounded-2xl space-y-2 text-[11px] text-ikincil/80">
          <div className="flex items-center justify-between">
            <span>Form geçerliliği</span>
            <span
              className={sb(
                "font-bold",
                gecerliMi ? "text-basari-900" : "text-hata-900"
              )}
            >
              {gecerliMi ? "✓ Kurallara Uygun" : "! Eksik Alanlar"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Tahmini yayın ücreti</span>
            <span className="font-bold text-ana tabular-nums">
              £245,00 + KDV
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>e-Arşiv fatura</span>
            <span className="text-basari-900 font-bold">Otomatik</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
