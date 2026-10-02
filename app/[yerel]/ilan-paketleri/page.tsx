"use client";


import { useTranslations } from "next-intl";
import HibritOdemeBileseni from "@/bilesenler/odeme/HibritOdemeBileseni";

export default function IlanPaketleriSayfasi() {
  const t = useTranslations("ilanPaketleri");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ana-kapsayici/70 border border-ana-outline/40 mx-auto">
          <span className="msimge text-ana">paid</span>
          <span className="text-[12px] font-bold uppercase tracking-widest text-ana">
            {t("etiket")}
          </span>
        </div>
        <h1 className="font-haber font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.02] text-ikincil tracking-tight">
          {t("baslik")}
        </h1>
        <p className="text-lg text-ikincil/75 leading-relaxed">
          {t("altBaslik")}
        </p>
      </section>

      <HibritOdemeBileseni />
    </div>
  );
}
