import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPathname, yonlendirme, type Yerel } from "@/i18n/yonlendirme";
import { canliIlanGetir } from "@/lib/depolar/ilan-arama-deposu";
import type { IlanAramaSatiri } from "@/lib/depolar/ilan-arama-deposu";
import { log } from "@/lib/sunucu/loglama";

type Props = {
  params: { slug: string; yerel: Yerel };
  children: React.ReactNode;
};

type SlugKaynagi =
  | { tur: "canli"; canliIlan: IlanAramaSatiri }
  | { tur: "yok" | "hata"; canliIlan: null };

/**
 * REQ-JOB-LIVE-001 — Slug kaynagini tek noktada cozer:
 * canli job_posts ilani mi, yoksa hicbir mi? Demo veriye dusturulmez.
 */
async function kaynagiCoz(slug: string): Promise<SlugKaynagi> {
  try {
    const canliIlan = await canliIlanGetir(slug);
    if (canliIlan) return { tur: "canli", canliIlan };
    return { tur: "yok", canliIlan: null };
  } catch (hata) {
    // Veritabani hatasi 404 sebebi degildir; hata detay sayfasinda gosterilir.
    log.hata("ilan/[slug] layout: canli ilan cozumlenemedi", hata, { slug });
    return { tur: "hata", canliIlan: null };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const kaynak = await kaynagiCoz(params.slug);
  const d = await getTranslations({
    locale: params.yerel,
    namespace: "ilanDetay",
  });

  if (kaynak.tur === "canli" && kaynak.canliIlan) {
    const ilan = kaynak.canliIlan;
    const sirketAdi = ilan.companies?.company_name?.trim() ?? "";
    const baslik = sirketAdi ? `${ilan.title} - ${sirketAdi}` : ilan.title;
    const aciklama =
      ilan.summary?.slice(0, 155) ||
      ilan.description?.slice(0, 155) ||
      d("veriBulunamadi");
    const href = {
      pathname: "/ilan/[slug]" as const,
      params: { slug: ilan.slug },
    };
    const pathFor = (locale: Yerel) =>
      getPathname({ locale, href });
    const languages: Record<string, string> = {};
    for (const locale of yonlendirme.locales) {
      languages[locale] = pathFor(locale);
    }
    languages["x-default"] = languages.tr;
    const canonical = pathFor(params.yerel);

    return {
      title: baslik,
      description: aciklama,
      alternates: {
        canonical,
        languages,
      },
      openGraph: {
        type: "website",
        url: canonical,
        title: baslik,
        description: aciklama,
        siteName: "İşBulKKTC",
        images: ["/marka-isbulkktc.webp"],
      },
      twitter: {
        card: "summary_large_image",
        title: baslik,
        description: aciklama,
        creator: "@isbukkibris",
        images: ["/marka-isbulkktc.webp"],
      },
    };
  }

  return {
    title: d("veriBulunamadi"),
    robots: { index: false, follow: false },
  };
}

function canliIlanIcinJsonLd(ilan: IlanAramaSatiri, yerel: string) {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: ilan.title,
    description: ilan.summary ?? ilan.description ?? ilan.title,
    datePosted: ilan.published_at ?? undefined,
    validThrough: ilan.expires_at ?? undefined,
    employmentType: ilan.employment_type ?? undefined,
    hiringOrganization: ilan.companies?.company_name?.trim()
      ? { "@type": "Organization", name: ilan.companies.company_name.trim() }
      : undefined,
    jobLocation: ilan.location
      ? {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: ilan.location,
          },
        }
      : undefined,
    baseSalary:
      ilan.salary_min !== null || ilan.salary_max !== null
        ? {
            "@type": "MonetaryAmount",
            currency: ilan.currency ?? undefined,
            value: {
              "@type": "QuantitativeValue",
              minValue: ilan.salary_min ?? undefined,
              maxValue: ilan.salary_max ?? undefined,
            },
          }
        : undefined,
    identifier: { "@type": "PropertyValue", name: "id", value: ilan.id },
    inLanguage: [yerel, "en"],
    totalJobOpenings: 1,
  };
}

export default async function IlanDetayLayout({ params, children }: Props) {
  const kaynak = await kaynagiCoz(params.slug);

  if (kaynak.tur === "yok") notFound();

  return (
    <>
      {kaynak.tur === "canli" && kaynak.canliIlan ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              canliIlanIcinJsonLd(kaynak.canliIlan, params.yerel)
            ),
          }}
        />
      ) : null}
      {children}
    </>
  );
}
