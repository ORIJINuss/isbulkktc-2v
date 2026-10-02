import { getPathname } from "@/i18n/yonlendirme";

export const SITEMAP_LOCALES = ["tr", "en", "ru", "he"] as const;

export const SITEMAP_ROUTES = [
  "/",
  "/ilan-ara",
  "/ilan-paketleri",
  "/sirketler",
  "/kariyer",
  "/freelance",
  "/hakkimizda",
  "/iletisim",
  "/gizlilik",
  "/kvk",
] as const;

export type SiteHaritasiRota = (typeof SITEMAP_ROUTES)[number];

export function yerellestirilmisYol(
  yerel: (typeof SITEMAP_LOCALES)[number],
  rota: SiteHaritasiRota,
): string {
  return getPathname({ locale: yerel, href: rota });
}

export function yerellestirilmisSiteHaritasi(
  yerel: (typeof SITEMAP_LOCALES)[number],
): string[] {
  return SITEMAP_ROUTES.map((rota) => yerellestirilmisYol(yerel, rota));
}
