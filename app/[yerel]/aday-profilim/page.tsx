import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/yonlendirme";
import ATSCVYonetimKarti from "@/bilesenler/cv/ATSCVYonetimKarti";
import Buton from "@/bilesenler/genel/Buton";
import {
  adayBasvurulariniGetir,
  adayCvBelgeleriniGetir,
  adayProfiliniGetir,
} from "@/lib/depolar/aday-deposu";
import { rolKontrolluKullaniciGetir, YetkiHatasi } from "@/lib/guvenlik/yetki";

type Props = { params: { yerel: string } };

export default async function AdayProfilimSayfasi({ params }: Props) {
  let kullanici: Awaited<ReturnType<typeof rolKontrolluKullaniciGetir>>["kullanici"];
  try {
    ({ kullanici } = await rolKontrolluKullaniciGetir(["candidate"]));
  } catch (error) {
    if (error instanceof YetkiHatasi) {
      redirect({ href: error.durum === 401 ? "/giris" : "/", locale: params.yerel });
    }
    throw error;
  }

  const [profil, basvurular, belgeler] = await Promise.all([
    adayProfiliniGetir(),
    adayBasvurulariniGetir(),
    adayCvBelgeleriniGetir(),
  ]);
  const t = await getTranslations({ locale: params.yerel, namespace: "adayProfilim" });
  const adSoyad =
    typeof kullanici.user_metadata?.full_name === "string"
      ? kullanici.user_metadata.full_name
      : kullanici.email ?? t("candidateNameFallback");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8 py-8 sm:py-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-ana-outline/40 bg-ana-kapsayici/70 px-3 py-1.5">
            <span className="msimge text-ana" aria-hidden="true">manage_accounts</span>
            <span className="text-xs font-bold uppercase tracking-widest text-ana">
              {t("candidateDashboard")}
            </span>
          </span>
          <h1 className="font-haber text-3xl font-black leading-tight tracking-tight text-ikincil sm:text-4xl">
            {t("dashboardTitle")}
          </h1>
          <p className="max-w-2xl leading-relaxed text-ikincil/70">{t("dashboardDescription")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/ilan-ara">
            <Buton tur="buton" varyant="ikincil" boyut="md" ikon="search">
              {t("findJobs")}
            </Buton>
          </Link>
        </div>
      </section>

      <ATSCVYonetimKarti
        profil={profil}
        basvurular={basvurular}
        belgeler={belgeler}
        adSoyad={adSoyad}
      />
    </div>
  );
}
