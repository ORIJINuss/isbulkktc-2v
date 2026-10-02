"use client";


import { useTranslations } from "next-intl";
import { Link } from "@/i18n/yonlendirme";
import IlanVerFormu4Adim from "@/bilesenler/formlar/IlanVerFormu4Adim";
import Rozet from "@/bilesenler/genel/Rozet";
import Buton from "@/bilesenler/genel/Buton";

export default function YeniIlanSayfasi() {
  const t = useTranslations("isverenFormu");
  const g = useTranslations("anaSayfa");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10 space-y-7">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex flex-wrap items-center gap-2">
            <Rozet tur="altin" ikon="edit_note">
              {t("dortAdim")}
            </Rozet>
          </div>
          <h1 className="font-haber font-black text-3xl sm:text-4xl lg:text-5xl text-ikincil tracking-tight leading-[1.02]">
            {t("sayfaBaslik")}{" "}
            <span className="text-ana">{t("sayfaBaslikVurgu")}</span>
          </h1>
          <p className="text-ikincil/80 leading-relaxed">
            {t("yayinaBagliDegil")}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Link href="/ilan-paketleri">
            <Buton tur="buton" varyant="ikincil" boyut="md" ikon="add_card">
              {g("viewPackages")}
            </Buton>
          </Link>
        </div>
      </section>

      <IlanVerFormu4Adim />
    </div>
  );
}
