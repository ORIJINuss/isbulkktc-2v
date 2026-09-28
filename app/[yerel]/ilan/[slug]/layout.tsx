import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ilanGetir } from "@/lib/depolar/ilan-deposu";
import { canliIlanGetir } from "@/lib/depolar/ilan-arama-deposu";
import type { IlanAramaSatiri } from "@/lib/depolar/ilan-arama-deposu";
import type { Ilan } from "@/lib/veri/ilan-tipi";
import { log } from "@/lib/sunucu/loglama";

type Props = {
  params: { slug: string; yerel: string };
  children: React.ReactNode;
};

type SlugKaynagi =
  | { tur: "demo"; demoIlan: Ilan; canliIlan: null }
  | { tur: "canli"; demoIlan: null; canliIlan: IlanAramaSatiri }
  | { tur: "yok" | "hata"; demoIlan: null; canliIlan: null };

/**
 * REQ-JOB-LIVE-001 — Slug kaynagini tek noktada cozer:
 * demo ilan mi, canli job_posts ilani mi, yoksa hicbiri mi?
 * Demo slug'lari asla veritabanina sorgulanmaz.
 */
async function kaynagiCoz(slug: string): Promise<SlugKaynagi> {
  const demoIlan = ilanGetir(slug);
  if (demoIlan) return { tur: "demo", demoIlan, canliIlan: null };

  try {
    const canliIlan = await canliIlanGetir(slug);
    if (canliIlan) return { tur: "canli", demoIlan: null, canliIlan };
    return { tur: "yok", demoIlan: null, canliIlan: null };
  } catch (hata) {
    // Veritabani hatasi 404 sebebi degildir; hata detay sayfasinda gosterilir.
    log.hata("ilan/[slug] layout: canli ilan cozumlenemedi", hata, { slug });
    return { tur: "hata", demoIlan: null, canliIlan: null };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const kaynak = await kaynagiCoz(params.slug);
  const d = await getTranslations({
    locale: params.yerel,
    namespace: "ilanDetay",
  });

  if (kaynak.tur === "demo" && kaynak.demoIlan) {
    const ilan = kaynak.demoIlan;
    const description =
      ilan.isTanimi?.slice(0, 155) ?? `${ilan.pozisyonBasligi} iş ilanı`;
    return {
      title: `${ilan.pozisyonBasligi} - ${ilan.sirketAdi}`,
      description,
      alternates: {
        canonical: `/${params.yerel}/ilan/${ilan.slug}`,
        languages: {
          tr: `/tr/ilan/${ilan.slug}`,
          en: `/en/ilan/${ilan.slug}`,
          ru: `/ru/ilan/${ilan.slug}`,
          he: `/he/ilan/${ilan.slug}`,
        },
      },
      openGraph: {
        type: "website",
        title: `${ilan.pozisyonBasligi} - ${ilan.sirketAdi}`,
        description,
      },
    };
  }

  if (kaynak.tur === "canli" && kaynak.canliIlan) {
    const ilan = kaynak.canliIlan;
    const sirketAdi = ilan.companies?.company_name?.trim() ?? "";
    const baslik = sirketAdi ? `${ilan.title} - ${sirketAdi}` : ilan.title;
    const aciklama =
      ilan.summary?.slice(0, 155) ||
      ilan.description?.slice(0, 155) ||
      d("veriBulunamadi");
    return {
      title: baslik,
      description: aciklama,
      alternates: {
        canonical: `/${params.yerel}/ilan/${ilan.slug}`,
        languages: {
          tr: `/tr/ilan/${ilan.slug}`,
          en: `/en/ilan/${ilan.slug}`,
          ru: `/ru/ilan/${ilan.slug}`,
          he: `/he/ilan/${ilan.slug}`,
        },
      },
      openGraph: {
        type: "website",
        title: baslik,
        description: aciklama,
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
