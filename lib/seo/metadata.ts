import type { Metadata } from "next";
import { getPathname, yonlendirme, type Yerel } from "@/i18n/yonlendirme";
import { anaDomain } from "@/lib/ortam/ortam";
import type { SiteHaritasiRota } from "@/lib/sabitler/site-haritasi";

export function yerelSayfaMetadataOlustur(
  yerel: Yerel,
  rota: SiteHaritasiRota,
  baslik: string,
  aciklama: string,
): Metadata {
  const domain = anaDomain();
  const yerelUrl = (dil: Yerel) =>
    new URL(getPathname({ locale: dil, href: rota }), domain).toString();
  const alternatifler: Record<string, string> = {};

  for (const dil of yonlendirme.locales) {
    alternatifler[dil] = yerelUrl(dil);
  }
  alternatifler["x-default"] = yerelUrl("tr");

  return {
    title: baslik,
    description: aciklama,
    alternates: {
      canonical: yerelUrl(yerel),
      languages: alternatifler,
    },
    openGraph: {
      type: "website",
      url: yerelUrl(yerel),
      title: baslik,
      description: aciklama,
      siteName: "İşBulKKTC",
      locale: yerel,
      images: [
        {
          url: "/marka-isbulkktc.webp",
          width: 1200,
          height: 630,
          alt: `${baslik} — İşBulKKTC`,
        },
      ],
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
