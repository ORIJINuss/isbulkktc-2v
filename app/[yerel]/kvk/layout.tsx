import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Yerel } from "@/i18n/yonlendirme";
import { yerelSayfaMetadataOlustur } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: { yerel: Yerel };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.yerel, namespace: "meta" });
  return yerelSayfaMetadataOlustur(
    params.yerel,
    "/kvk",
    t("kvkTitle"),
    t("kvkDescription"),
  );
}

export default function KvkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
