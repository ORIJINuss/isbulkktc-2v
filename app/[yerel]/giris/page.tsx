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
