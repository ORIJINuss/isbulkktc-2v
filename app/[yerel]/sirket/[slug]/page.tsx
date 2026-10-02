import Image from "next/image";
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPathname, Link, yonlendirme, type Yerel } from "@/i18n/yonlendirme";
import Ikon3D from "@/bilesenler/genel/Ikon3D";
import { kamuyaAcikSirketiGetir } from "@/lib/depolar/isveren-deposu";
import { getTranslations } from "next-intl/server";

type Props = { params: { slug: string; yerel: Yerel } };
const sirketiGetir = cache(kamuyaAcikSirketiGetir);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [sirket, t] = await Promise.all([
    sirketiGetir(params.slug),
    getTranslations({ locale: params.yerel, namespace: "workspace" }),
  ]);
  if (!sirket) {
    return {
      title: t("companyDirectory"),
      robots: { index: false, follow: false },
    };
  }

  const href = {
    pathname: "/sirket/[slug]" as const,
    params: { slug: sirket.slug },
  };
  const pathFor = (locale: Yerel) => getPathname({ locale, href });
  const languages: Record<string, string> = {};
  for (const locale of yonlendirme.locales) {
    languages[locale] = pathFor(locale);
  }
  languages["x-default"] = languages.tr;
  const canonical = pathFor(params.yerel);
  const description = (
    sirket.description || t("companyDirectoryDescription")
  ).slice(0, 155);

  return {
    title: sirket.company_name,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: "website",
      url: canonical,
      title: sirket.company_name,
      description,
      siteName: "İşBulKKTC",
      images: ["/marka-isbulkktc.webp"],
    },
    twitter: {
      card: "summary_large_image",
      title: sirket.company_name,
      description,
      creator: "@isbukkibris",
      images: ["/marka-isbulkktc.webp"],
    },
  };
}

export default async function KamuyaAcikSirketProfili({ params }: Props) {
  const sirket = await sirketiGetir(params.slug);
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
            {sirket.logo_url ? (
              <Image src={sirket.logo_url} alt="" width={64} height={64} className="h-16 w-16 rounded-2xl border border-cizgi-degisken bg-yüzey object-contain p-2" />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-ana text-2xl font-bold text-beyaz">
                {sirket.company_name.slice(0, 1).toLocaleUpperCase(params.yerel)}
              </div>
            )}
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-beyaz px-3 py-1 text-xs font-semibold text-ana">
                <span className="msimge text-sm" aria-hidden="true">verified</span>
                {t("verifiedCompany")}
              </div>
              <p className="mb-2 max-w-xl text-xs leading-relaxed text-ikincil/65">
                {t("verifiedCompanyDescription")}
              </p>
              <h1 className="font-haber text-3xl font-black tracking-tight text-ikincil sm:text-4xl">{sirket.company_name}</h1>
              {sirket.location && <p className="mt-2 flex items-center gap-1.5 text-sm text-ikincil/70"><Ikon3D tur="bolge" boyut={18} className="ikon-3d--bolge" />{sirket.location}</p>}
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
