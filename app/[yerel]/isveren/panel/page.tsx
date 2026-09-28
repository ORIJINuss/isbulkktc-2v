import { Link, redirect } from "@/i18n/yonlendirme";
import {
  sirketDashboardOzetiniGetir,
  sirketIlanlariniGetir,
  sirketlerimiGetir,
} from "@/lib/depolar/isveren-deposu";
import { YetkiHatasi, rolKontrolluKullaniciGetir } from "@/lib/guvenlik/yetki";
import { getTranslations } from "next-intl/server";

type Props = { params: { yerel: string } };

async function isverenYetkisiniDogrula(locale: string) {
  try {
    await rolKontrolluKullaniciGetir(["employer"]);
  } catch (error) {
    if (error instanceof YetkiHatasi) {
      redirect({ href: error.durum === 401 ? "/giris" : "/", locale });
    }
    throw error;
  }
}

export default async function IsverenPaneli({ params }: Props) {
  await isverenYetkisiniDogrula(params.yerel);
  const uyelikler = await sirketlerimiGetir();
  const sirketler = (uyelikler ?? []).flatMap((uyelik) => {
    const iliski = uyelik.companies;
    return Array.isArray(iliski) ? iliski : iliski ? [iliski] : [];
  });
  const t = await getTranslations({ locale: params.yerel, namespace: "workspace" });

  const sirketVerileri = await Promise.all(
    sirketler.map(async (sirket) => {
      const [ozet, ilanlar] = await Promise.all([
        sirketDashboardOzetiniGetir(sirket.id),
        sirketIlanlariniGetir(sirket.id),
      ]);
      return { sirket, ozet, ilanlar };
    }),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-ana-outline/40 bg-ana-kapsayici/70 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ana">
            <span className="msimge" aria-hidden="true">business_center</span>
            {t("employerDashboard")}
          </span>
          <h1 className="font-haber text-3xl font-black tracking-tight text-ikincil sm:text-4xl">
            {t("employerWelcome")}
          </h1>
          <p className="max-w-2xl leading-relaxed text-ikincil/75">{t("employerDashboardDescription")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/isveren/yeni-ilan" className="buton-ana">
            <span className="msimge me-1" aria-hidden="true">add</span>
            {t("createJob")}
          </Link>
          <Link href="/isveren/sirketim" className="buton-ikincil">
            {t("manageCompany")}
          </Link>
        </div>
      </header>

      {sirketVerileri.length === 0 ? (
        <section className="mineral-kart rounded-2xl border-dashed p-8 text-center sm:p-12">
          <span className="msimge text-4xl text-ana" aria-hidden="true">apartment</span>
          <h2 className="mt-3 font-haber text-2xl font-bold text-ikincil">{t("noCompanies")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-ikincil/70">{t("noCompaniesDescription")}</p>
          <Link href="/isveren/sirket-kaydi" className="buton-ana mt-5">
            {t("registerCompany")}
          </Link>
        </section>
      ) : (
        <div className="space-y-6">
          {sirketVerileri.map(({ sirket, ozet, ilanlar }) => (
            <section key={sirket.id} className="mineral-kart overflow-hidden rounded-2xl">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-cizgi-degisken/70 p-5 sm:p-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ana-kapsayici text-lg font-bold text-ana">
                    {sirket.company_name?.slice(0, 1)?.toLocaleUpperCase(params.yerel) ?? "—"}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-haber text-xl font-bold text-ikincil">{sirket.company_name}</h2>
                    <p className="mt-1 text-sm text-ikincil/65">{sirket.location || t("locationMissing")}</p>
                  </div>
                </div>
                <span className="rounded-full bg-ana-kapsayici px-3 py-1 text-xs font-semibold text-ana">
                  {sirket.is_verified ? t("verifiedCompany") : t("verificationPending")}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3 sm:p-6">
                {[
                  { label: t("totalJobs"), value: ozet.ilanSayisi, icon: "work" },
                  { label: t("activeJobs"), value: ozet.aktifIlanSayisi, icon: "check_circle" },
                  { label: t("applications"), value: ozet.basvuruSayisi, icon: "groups" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-yüzey-kapsayici-alt p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-ikincil/70">
                      <span className="msimge text-ana" aria-hidden="true">{item.icon}</span>
                      {item.label}
                    </div>
                    <p className="mt-3 font-haber text-3xl font-black tabular-nums text-ana">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-haber text-lg font-bold text-ikincil">{t("recentJobs")}</h3>
                  <Link href="/isveren/yeni-ilan" className="text-sm font-semibold text-ana hover:underline">{t("createJob")}</Link>
                </div>
                {ilanlar.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-cizgi-degisken p-5 text-sm text-ikincil/70">{t("noCompanyJobs")}</p>
                ) : (
                  <ul className="divide-y divide-cizgi-degisken/70 rounded-xl border border-cizgi-degisken/70 px-4">
                    {ilanlar.slice(0, 5).map((ilan) => (
                      <li key={ilan.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <span className="font-semibold text-ikincil">{ilan.title}</span>
                        <span className="rounded-full bg-yüzey-kapsayici px-3 py-1 text-xs font-semibold text-ikincil/75">
                          {t(`jobStatus.${ilan.status}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
