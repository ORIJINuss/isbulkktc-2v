import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/yonlendirme";
import { hizmetRoluIcinSupabaseOlustur } from "@/lib/supabase/sunucu-istemci";
import { anaDomain } from "@/lib/ortam/ortam";
import {
  SITEMAP_LOCALES,
  SITEMAP_ROUTES,
  yerellestirilmisYol,
} from "@/lib/sabitler/site-haritasi";
import { log } from "@/lib/sunucu/loglama";

export const revalidate = 3600;

type DynamicSitePage = {
  slug: string;
  lastModified: string | null;
  route: "/ilan/[slug]" | "/sirket/[slug]";
};

function sitemapEntry(
  locale: (typeof SITEMAP_LOCALES)[number],
  route: (typeof SITEMAP_ROUTES)[number],
  lastModified: Date,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const language of SITEMAP_LOCALES) {
    languages[language] = new URL(
      yerellestirilmisYol(language, route),
      anaDomain(),
    ).toString();
  }
  languages["x-default"] = languages.tr;

  return {
    url: new URL(yerellestirilmisYol(locale, route), anaDomain()).toString(),
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  };
}

function dynamicSitemapEntry(
  locale: (typeof SITEMAP_LOCALES)[number],
  page: DynamicSitePage,
): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  const pathFor = (language: (typeof SITEMAP_LOCALES)[number]) =>
    getPathname({
      locale: language,
      href: {
        pathname: page.route,
        params: { slug: page.slug },
      },
    });

  for (const language of SITEMAP_LOCALES) {
    languages[language] = new URL(pathFor(language), anaDomain()).toString();
  }
  languages["x-default"] = languages.tr;

  return {
    url: new URL(pathFor(locale), anaDomain()).toString(),
    lastModified: page.lastModified ? new Date(page.lastModified) : new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
    alternates: { languages },
  };
}

async function activeDynamicPages(): Promise<DynamicSitePage[]> {
  const supabase = await hizmetRoluIcinSupabaseOlustur();
  const now = new Date().toISOString();
  const pages: DynamicSitePage[] = [];

  for (const route of ["/ilan/[slug]", "/sirket/[slug]"] as const) {
    let offset = 0;
    while (true) {
      const query =
        route === "/ilan/[slug]"
          ? supabase
              .from("job_posts")
              .select("slug, published_at")
              .eq("status", "active")
              .not("published_at", "is", null)
              .or(`expires_at.is.null,expires_at.gt.${now}`)
              .order("published_at", { ascending: false })
              .range(offset, offset + 999)
          : supabase
              .from("companies")
              .select("slug, updated_at")
              .eq("status", "active")
              .eq("is_verified", true)
              .order("updated_at", { ascending: false })
              .range(offset, offset + 999);
      const { data, error } = await query;

      if (error) throw error;
      for (const row of data ?? []) {
        pages.push({
          slug: row.slug,
          lastModified:
            "published_at" in row ? row.published_at : row.updated_at,
          route,
        });
      }
      if (!data || data.length < 1000) break;
      offset += 1000;
    }
  }

  return pages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages = SITEMAP_LOCALES.flatMap((locale) =>
    SITEMAP_ROUTES.map((route) =>
      sitemapEntry(
        locale,
        route,
        now,
        route === "/ilan-ara" ? "daily" : "weekly",
        route === "/" ? 1 : route === "/ilan-ara" ? 0.9 : 0.6,
      ),
    ),
  );

  try {
    const dynamicPages = await activeDynamicPages();
    return [
      ...staticPages,
      ...dynamicPages.flatMap((page) =>
        SITEMAP_LOCALES.map((locale) => dynamicSitemapEntry(locale, page)),
      ),
    ];
  } catch (error) {
    log.uyari("Sitemap: dinamik ilan ve şirket URL'leri alınamadı.", {
      hata: error instanceof Error ? error.message : String(error),
    });
    return staticPages;
  }
}
