"use client";


import { useTranslations } from "next-intl";
import GirisKayitSekmeleri from "@/bilesenler/formlar/GirisKayitSekmeleri";

export default function IsverenSirketKaydi() {
  const t = useTranslations("workspace");
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <section className="space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-ana-outline/40 bg-ana-kapsayici/70 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ana">
          <span className="msimge" aria-hidden="true">apartment</span>
          {t("companyRegistration")}
        </span>
        <h1 className="font-haber text-3xl font-black leading-tight tracking-tight text-ikincil sm:text-4xl">
          {t("companyRegistrationTitle")}
        </h1>
        <p className="max-w-xl leading-relaxed text-ikincil/75">{t("companyRegistrationDescription")}</p>
        <div className="rounded-2xl border border-ana-outline/30 bg-ana-kapsayici/50 p-4 text-sm leading-relaxed text-ikincil/80">
          <span className="msimge me-2 text-ana" aria-hidden="true">info</span>
          {t("companyProvisioningNotice")}
        </div>
      </section>
      <GirisKayitSekmeleri initialUserType="isveren" initialMode="kayit" />
    </div>
  );
}
