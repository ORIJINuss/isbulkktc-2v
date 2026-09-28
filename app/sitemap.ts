import type { MetadataRoute } from "next";
import { ORNEK_ILANLAR } from "@/lib/depolar/ilan-deposu";
import { anaDomain } from "@/lib/ortam/ortam";

const LOCALES = ["tr", "en", "ru", "he"] as const;
export const revalidate = 3600;
const ROUTES = [
  "",
  "ilan-ara",
  "ilan-paketleri",
  "sirketler",
  "kariyer",
  "freelance",
  "hakkimizda",
  "iletisim",
  "gizlilik",
  "kvk",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const kokUrl = anaDomain();
  const staticUrls = LOCALES.flatMap((locale) =>
    ROUTES.map((route) => ({
      url: `${kokUrl}/${locale}${route ? `/${route}` : ""}`,
      lastModified: new Date(),
      changeFrequency: route === "ilan-ara" ? "daily" as const : "weekly" as const,
      priority: route === "" ? 1 : route === "ilan-ara" ? 0.9 : 0.6,
    })),
  );

  const jobUrls = LOCALES.flatMap((locale) =>
    ORNEK_ILANLAR.map((ilan) => ({
      url: `${kokUrl}/${locale}/ilan/${ilan.slug}`,
      lastModified: new Date(ilan.yayinTarihi),
      changeFrequency: "daily" as const,
      priority: ilan.acilMi || ilan.acilIlan ? 0.85 : 0.75,
    })),
  );

  return [...staticUrls, ...jobUrls];
}
