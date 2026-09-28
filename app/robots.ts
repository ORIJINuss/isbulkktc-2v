import type { MetadataRoute } from "next";
import { anaDomain } from "@/lib/ortam/ortam";

export default function robots(): MetadataRoute.Robots {
  const kokUrl = anaDomain();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/tr/", "/en/", "/ru/", "/he/"],
        disallow: ["/api/", "/_next/", "/*?*redirect=", "/*?*token="],
      },
    ],
    sitemap: `${kokUrl}/sitemap.xml`,
    host: kokUrl,
  };
}
