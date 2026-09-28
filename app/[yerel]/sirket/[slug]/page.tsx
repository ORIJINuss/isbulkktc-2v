import { notFound } from "next/navigation";
import { Link } from "@/i18n/yonlendirme";
import { kamuyaAcikSirketiGetir } from "@/lib/depolar/isveren-deposu";
import { getTranslations } from "next-intl/server";

type Props = { params: { slug: string; yerel: string } };

export default async function KamuyaAcikSirketProfili({ params }: Props) {
  const sirket = await kamuyaAcikSirketiGetir(params.slug);
  if (!sirket) notFound();
  const t = await getTranslations({ locale: params.yerel, namespace: "workspace" });

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/sirketler" className="inline-flex items-center gap-2 text-sm font-semibold text-ana hover:underline">
        <span className="msimge" aria-hidden="true">arrow_back</span>
        {t("companyDirectory")}
      </Link>
      <section className="mineral-kart overflow-hidden rounded-3xl">
        <div className="bg-ana-kapsayici/50 p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-beyaz px-3 py-1 text-xs font-semibold text-ana">
                <span className="msimge text-sm" aria-hidden="true">verified</span>
                {t("verifiedCompany")}
              </div>
              <h1 className="font-haber text-3xl font-black tracking-tight text-ikincil sm:text-4xl">{sirket.company_name}</h1>
              {sirket.location && <p className="mt-2 flex items-center gap-1.5 text-sm text-ikincil/70"><span className="msimge" aria-hidden="true">location_on</span>{sirket.location}</p>}
            </div>
          </div>
        </div>
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h2 className="font-haber text-xl font-bold text-ikincil">{t("aboutCompany")}</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ikincil/75">
              {sirket.description || t("companyDescriptionUnavailable")}
            </p>
          </div>
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-haber text-xl font-bold text-ikincil">{t("openJobs")}</h2>
              <span className="rounded-full bg-ana-kapsayici px-3 py-1 text-xs font-semibold tabular-nums text-ana">{sirket.ilanlar.length}</span>
            </div>
            {sirket.ilanlar.length === 0 ? (
              <p className="rounded-xl border border-dashed border-cizgi-degisken p-5 text-sm leading-relaxed text-ikincil/70">{t("noOpenJobs")}</p>
            ) : (
              <ul className="space-y-3">
                {sirket.ilanlar.map((ilan) => (
                  <li key={ilan.id} className="mineral-kart rounded-xl p-4">
                    <Link href={{ pathname: "/ilan/[slug]", params: { slug: ilan.slug } }} className="font-semibold text-ana hover:underline">{ilan.title}</Link>
                    <p className="mt-1 text-sm text-ikincil/70">{ilan.location}</p>
                    {ilan.summary && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ikincil/70">{ilan.summary}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
