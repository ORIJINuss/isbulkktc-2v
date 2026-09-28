"use client";

import { useTranslations } from "next-intl";
import Rozet from "@/bilesenler/genel/Rozet";
import GirisKayitSekmeleri from "@/bilesenler/formlar/GirisKayitSekmeleri";

export default function GirisSayfasi() {
  const t = useTranslations("giris");
  const m = useTranslations("meta");

  const adayYararlar = [
    { ikon: "cloud_done", baslik: t("yarar1") },
    { ikon: "radar", baslik: t("yarar2") },
    { ikon: "no_photography", baslik: t("yarar3") },
  ];

  const isverenStandartlar = [
    { ikon: "fact_check", baslik: t("isverenStandart1") },
    { ikon: "badge", baslik: t("isverenStandart2") },
    { ikon: "receipt_long", baslik: t("isverenStandart3") },
  ];

  const kurumsal = [
    { ikon: "gavel", bas: t("kurumsal1Baslik"), ac: t("kurumsal1Aciklama") },
    { ikon: "verified_user", bas: t("kurumsal2Baslik"), ac: t("kurumsal2Aciklama") },
    { ikon: "support_agent", bas: t("kurumsal3Baslik"), ac: t("kurumsal3Aciklama") },
    { ikon: "privacy_tip", bas: t("kurumsal4Baslik"), ac: t("kurumsal4Aciklama") },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
      <section className="grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-14 items-start">
        <div className="space-y-6 order-2 lg:order-1">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-altin-sabit/20 border border-altin-cila/40">
              <span className="msimge text-altin-cila text-[18px]" aria-hidden="true">
                workspace_premium
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-ikincil">
                {m("markaAdi")} · {t("guvenliGiris")}
              </span>
            </div>
            <h1 className="font-haber font-black text-4xl sm:text-5xl leading-[1.05] text-ikincil tracking-tight text-balance">
              {t("sayfaBaslik1")} <span className="text-ana">{t("sayfaBaslik2")}</span>
            </h1>
            <p className="text-lg text-ikincil/80 leading-relaxed text-pretty max-w-xl">
              {t("sayfaAciklama")}
            </p>
          </div>

          <ul className="grid sm:grid-cols-3 gap-3">
            {adayYararlar.map((y) => (
              <li key={y.baslik} className="mineral-kart p-4 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-ana-kapsayici grid place-items-center mb-3">
                  <span className="msimge text-ana text-xl" aria-hidden="true">
                    {y.ikon}
                  </span>
                </div>
                <p className="text-sm font-semibold text-ana leading-snug">{y.baslik}</p>
              </li>
            ))}
          </ul>

          <section
            aria-labelledby="isveren-standartlari"
            className="camsi-kart rounded-2xl p-5 border-altin-cila/40 space-y-3"
          >
            <h2 id="isveren-standartlari">
              <Rozet tur="altin" ikon="apartment">
                {t("isverenStandartBaslik")}
              </Rozet>
            </h2>
            <ul className="grid gap-2">
              {isverenStandartlar.map((s) => (
                <li
                  key={s.baslik}
                  className="flex items-start gap-3 p-2.5 rounded-xl bg-ikincil-kapsayici/60"
                >
                  <span className="msimge text-ana shrink-0 mt-0.5 text-[20px]" aria-hidden="true">
                    {s.ikon}
                  </span>
                  <span className="text-sm font-semibold text-ikincil leading-snug">{s.baslik}</span>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="alo-1002"
            className="mineral-kart rounded-2xl p-5 flex items-start gap-4 border-hata-900/20"
          >
            <div className="w-12 h-12 shrink-0 rounded-2xl grid place-items-center bg-hata-900/10 border border-hata-900/25">
              <span className="msimge text-hata-900 text-2xl" aria-hidden="true">
                campaign
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 id="alo-1002" className="font-haber font-black text-ikincil text-xl leading-tight mb-1.5">
                {t("alo")}
              </h2>
              <p className="text-sm text-ikincil/80 leading-relaxed text-pretty">{t("aloAciklama")}</p>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <a
                  href="tel:1002"
                  className="font-bold text-2xl text-hata-900 tabular-nums tracking-wide hover:underline underline-offset-4"
                >
                  1002
                </a>
                <span className="text-xs text-ikincil/70">{t("aloNumaraEtiketi")}</span>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:sticky lg:top-24 space-y-4 order-1 lg:order-2">
          <GirisKayitSekmeleri />
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {kurumsal.map((k) => (
              <li
                key={k.bas}
                className="p-3.5 rounded-2xl flex items-start gap-3 border border-cizgi-degisken bg-pearl-ana"
              >
                <span className="msimge mt-0.5 shrink-0 text-ana text-[20px]" aria-hidden="true">
                  {k.ikon}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-ikincil leading-tight">{k.bas}</p>
                  <p className="text-xs text-ikincil/75 leading-snug mt-0.5">{k.ac}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
