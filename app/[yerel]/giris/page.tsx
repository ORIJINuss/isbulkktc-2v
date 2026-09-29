"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import GirisKayitSekmeleri from "@/bilesenler/formlar/GirisKayitSekmeleri";

export default function GirisSayfasi() {
  const searchParams = useSearchParams();
  const baslangicTuru = searchParams.get("tur") === "isveren" ? "isveren" : "aday";
  const baslangicModu = searchParams.get("mod") === "kayit" ? "kayit" : "giris";
  const t = useTranslations("giris");
  const m = useTranslations("meta");

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
          <GirisKayitSekmeleri
            initialUserType={baslangicTuru}
            initialMode={baslangicModu}
            kilitliKullaniciTuru
          />
        </div>
      </section>
    </div>
  );
}
