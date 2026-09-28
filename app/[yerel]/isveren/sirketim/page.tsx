import { Link, redirect } from "@/i18n/yonlendirme";
import { sirketIlanlariniGetir, sirketlerimiGetir } from "@/lib/depolar/isveren-deposu";
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

export default async function IsverenSirketim({ params }: Props) {
  await isverenYetkisiniDogrula(params.yerel);
  const uyelikler = await sirketlerimiGetir();
  const sirketler = (uyelikler ?? []).flatMap((uyelik) => {
    const relation = uyelik.companies;
    return Array.isArray(relation) ? relation : relation ? [relation] : [];
  });
  const ilanlar = await Promise.all(
    sirketler.map(async (sirket) => ({
      sirket,
      ilanlar: await sirketIlanlariniGetir(sirket.id),
    })),
  );
  const t = await getTranslations({ locale: params.yerel, namespace: "workspace" });

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-haber text-3xl font-black tracking-tight text-ikincil sm:text-4xl">{t("manageCompany")}</h1>
          <p className="mt-2 text-ikincil/70">{t("companyManagementDescription")}</p>
        </div>
        <Link href="/isveren/panel" className="buton-ikincil">{t("employerDashboard")}</Link>
      </header>
      {ilanlar.length === 0 ? (
        <section className="mineral-kart rounded-2xl p-8 text-center">
          <h2 className="font-haber text-xl font-bold text-ikincil">{t("noCompanies")}</h2>
          <p className="mt-2 text-sm text-ikincil/70">{t("noCompaniesDescription")}</p>
          <Link href="/isveren/sirket-kaydi" className="buton-ana mt-5">{t("registerCompany")}</Link>
        </section>
      ) : (
        <div className="space-y-5">
          {ilanlar.map(({ sirket, ilanlar: sirketIlanlari }) => (
            <section key={sirket.id} className="mineral-kart rounded-2xl p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-haber text-xl font-bold text-ikincil">{sirket.company_name}</h2>
                  <p className="mt-1 text-sm text-ikincil/65">{sirket.location || t("locationMissing")}</p>
                </div>
                <Link href="/isveren/yeni-ilan" className="buton-ana">{t("createJob")}</Link>
              </div>
              <h3 className="mb-3 mt-6 font-semibold text-ikincil">{t("companyJobs")}</h3>
              {sirketIlanlari.length === 0 ? (
                <p className="rounded-xl border border-dashed border-cizgi-degisken p-4 text-sm text-ikincil/70">{t("noCompanyJobs")}</p>
              ) : (
                <ul className="divide-y divide-cizgi-degisken/70 rounded-xl border border-cizgi-degisken/70 px-4">
                  {sirketIlanlari.map((ilan) => (
                    <li key={ilan.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <span className="font-medium text-ikincil">{ilan.title}</span>
                      <span className="rounded-full bg-ana-kapsayici px-3 py-1 text-xs font-semibold text-ana">
                        {t(`jobStatus.${ilan.status}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
