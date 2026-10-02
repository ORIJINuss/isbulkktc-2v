import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  setRequestLocale,
  getTranslations,
} from "next-intl/server";
import { getPathname, yonlendirme, Yerel } from "@/i18n/yonlendirme";
import { anaDomain } from "@/lib/ortam/ortam";
import { clsx, siniflariBirlestir } from "@/lib/yardimcilar/sinif-yardimcisi";
import UstGezinmeCubugu from "@/bilesenler/genel/UstGezinmeCubugu";
import AltBilgi from "@/bilesenler/genel/AltBilgi";
import AIPoposuErtelenmis from "@/bilesenler/genel/AIPoposuErtelenmis";
import { Manrope } from "next/font/google";
import "@/app/globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-manrope",
});

// display=block: ikon fontu gelene kadar ligatür metni ("search", "work") görünmesin.
const MATERIAL_SYMBOLS_URL =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400..500,0..1,0&display=block";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f3" },
    { media: "(prefers-color-scheme: dark)", color: "#183a33" },
  ],
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

export function generateStaticParams() {
  return yonlendirme.locales.map((yerel) => ({ yerel }) as { yerel: Yerel });
}

export async function generateMetadata({
  params,
}: {
  params: { yerel: Yerel };
}): Promise<Metadata> {
  const { yerel } = params;
  const ceviriler = await getTranslations({ locale: yerel, namespace: "meta" });

  const aciklama = ceviriler("anaSayfaDescription");
  const marka = ceviriler("markaAdi");
  const slogan = ceviriler("anaSayfaTitle");
  const domain = anaDomain();
  const localizedHomePath = getPathname({ locale: yerel, href: "/" });
  const url = new URL(localizedHomePath, domain).toString();

  const alternatifler: Record<string, string> = {};
  for (const l of yonlendirme.locales) {
    alternatifler[l] = new URL(
      getPathname({ locale: l, href: "/" }),
      domain,
    ).toString();
  }
  alternatifler["x-default"] = alternatifler.tr;

  return {
    metadataBase: new URL(domain),
    title: {
      default: `${marka} — ${slogan}`,
      template: `%s · ${marka}`,
    },
    description: aciklama,
    applicationName: marka,
    keywords: [
      "KKTC iş ilanları",
      "Kıbrıs kariyer",
      "Kuzey Kıbrıs iş",
      "Kuzey Kıbrıs iş ilanları",
      "İşBulKKTC",
      "Lefkoşa iş",
      "Girne iş",
      "Gazimağusa iş",
    ],
    authors: [{ name: "İşBulKKTC Teknik Ekibi" }],
    creator: "İşBulKKTC",
    publisher: "İşBulKKTC İstihdam Portalı",
    alternates: {
      canonical: url,
      languages: alternatifler,
    },
    openGraph: {
      type: "website",
      url,
      title: `${marka} — ${slogan}`,
      description: aciklama,
      siteName: marka,
      locale: yerel,
      images: [
        {
          url: "/marka-isbulkktc.webp",
          width: 1200,
          height: 630,
          alt: `${marka} — KKTC İstihdam Portalı`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${marka} — ${slogan}`,
      description: aciklama,
      creator: "@isbukkibris",
      images: ["/marka-isbulkktc.webp"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function KökYerelDüzen({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { yerel: Yerel };
}) {
  const { yerel } = params;

  if (!yonlendirme.locales.includes(yerel)) {
    notFound();
  }

  setRequestLocale(yerel);
  const mesajlar = await getMessages();
  const g = await getTranslations("genel");

  const ibrisi = yerel === "he";

  return (
    <html
      lang={yerel}
      dir={ibrisi ? "rtl" : "ltr"}
      className={manrope.variable}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={MATERIAL_SYMBOLS_URL} />
      </head>
      <body
        className={siniflariBirlestir(
          "min-h-screen flex flex-col",
          ibrisi ? "font-sans-govde" : "",
        )}
      >
        <NextIntlClientProvider locale={yerel} messages={mesajlar}>
          <a
            href="#ana-icerik"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[100] focus:bg-ana focus:text-ana-uzerinde focus:px-4 focus:py-2 focus:rounded-xl focus:font-semibold"
          >
            {g("anaIcerigeAtla")}
          </a>

          <UstGezinmeCubugu yerel={yerel} />

          <main id="ana-icerik" className="flex-1 w-full">
            {children}
          </main>

          <AltBilgi />

          <AIPoposuErtelenmis />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
