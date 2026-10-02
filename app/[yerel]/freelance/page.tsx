"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/yonlendirme";

export default function FreelanceSayfasi() {
  const t = useTranslations("freelance");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      <section className="mineral-kart rounded-[28px] p-8 sm:p-14">
        <div className="mx-auto max-w-xl text-center space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-ana-kapsayici">
            <span className="msimge text-ana text-3xl">hourglass_empty</span>
          </div>
          <h1 className="font-haber font-black text-3xl sm:text-4xl text-ikincil">
            {t("bosDurumBaslik")}
          </h1>
          <p className="text-ikincil/75 leading-relaxed">
            {t("bosDurumAciklama")}
          </p>
          <Link href="/ilan-ara" className="buton-ana">
            {t("ilanlariGor")}
          </Link>
        </div>
      </section>
    </div>
  );
}
