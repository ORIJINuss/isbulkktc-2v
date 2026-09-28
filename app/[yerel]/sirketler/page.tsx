import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/yonlendirme";
import { kamuyaAcikSirketleriGetir } from "@/lib/depolar/isveren-deposu";

export const dynamic = "force-dynamic";

export default async function SirketlerSayfasi({ params }: { params: { yerel: string } }) {
  const sirketler = await kamuyaAcikSirketleriGetir();
  const t = await getTranslations({ locale: params.yerel, namespace: "workspace" });

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <header className="max-w-3xl space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-ana-outline/40 bg-ana-kapsayici/70 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ana">
          <span className="msimge" aria-hidden="true">verified</span>
          {t("verifiedCompany")}
        </span>
        <h1 className="font-haber text-3xl font-black tracking-tight text-ikincil sm:text-4xl">{t("companyDirectory")}</h1>
        <p className="leading-relaxed text-ikincil/75">{t("companyDirectoryDescription")}</p>
      </header>
      {sirketler.length === 0 ? (
        <div className="mineral-kart rounded-2xl border-dashed p-8 text-center text-sm leading-relaxed text-ikincil/70">
          {t("noVerifiedCompanies")}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sirketler.map((sirket) => (
            <li key={sirket.id}>
              <Link href={{ pathname: "/sirket/[slug]", params: { slug: sirket.slug } }} className="mineral-kart flex h-full items-center rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-ana/40">
                <span className="min-w-0">
                  <span className="block truncate font-haber text-lg font-bold text-ikincil">{sirket.company_name}</span>
                  <span className="mt-1 block truncate text-sm text-ikincil/65">{sirket.location || t("locationMissing")}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ana">
                    <span className="msimge text-sm" aria-hidden="true">verified</span>
                    {t("verifiedCompany")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
