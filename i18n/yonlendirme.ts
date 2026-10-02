import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const yonlendirme = defineRouting({
  locales: ["tr", "en", "ru", "he"],
  defaultLocale: "tr",
  localePrefix: "as-needed",
  localeDetection: false,
  pathnames: {
    "/": "/",
    "/giris": {
      tr: "/giris",
      en: "/login",
      ru: "/vhod",
      he: "/knisa"
    },
    "/ilan-ara": {
      tr: "/ilan-ara",
      en: "/search-jobs",
      ru: "/poisk-vakansiy",
      he: "/hivus-imnuyot"
    },
    "/ilan/[slug]": {
      tr: "/ilan/[slug]",
      en: "/job/[slug]",
      ru: "/vakansiya/[slug]",
      he: "/tafkida/[slug]"
    },
    "/freelance": {
      tr: "/freelance",
      en: "/freelance",
      ru: "/frilans",
      he: "/frilans"
    },
    "/ilan-paketleri": {
      tr: "/ilan-paketleri",
      en: "/pricing",
      ru: "/tarify",
      he: "/mehirkot"
    },
    "/aday-profilim": {
      tr: "/aday-profilim",
      en: "/my-profile",
      ru: "/moy-profil",
      he: "/profil-sheli"
    },
    "/aday/masam": {
      tr: "/aday/masam",
      en: "/candidate/workspace",
      ru: "/kandidat/kabinet",
      he: "/candidate/workspace"
    },
    "/isveren/yeni-ilan": {
      tr: "/isveren/yeni-ilan",
      en: "/employer/new-job",
      ru: "/rabotodatel/novaya-vakansiya",
      he: "/maasik/avoda-hadasha"
    },
    "/isveren/panel": {
      tr: "/isveren/panel",
      en: "/employer/dashboard",
      ru: "/rabotodatel/panel",
      he: "/maasik/panel"
    },
    "/isveren/sirket-kaydi": {
      tr: "/isveren/sirket-kaydi",
      en: "/employer/company-registration",
      ru: "/rabotodatel/registraciya-kompanii",
      he: "/maasik/registratsiya"
    },
    "/isveren/sirketim": {
      tr: "/isveren/sirketim",
      en: "/employer/my-company",
      ru: "/rabotodatel/moya-kompaniya",
      he: "/maasik/hakhevra-sheli"
    },
    "/sirket/[slug]": {
      tr: "/sirket/[slug]",
      en: "/company/[slug]",
      ru: "/kompaniya/[slug]",
      he: "/hevra/[slug]"
    },
    "/hakkimizda": {
      tr: "/hakkimizda",
      en: "/about-us",
      ru: "/o-nas",
      he: "/al-shevlenu"
    },
    "/kariyer": {
      tr: "/kariyer",
      en: "/careers",
      ru: "/karyera",
      he: "/karyera"
    },
    "/medya": {
      tr: "/medya",
      en: "/media",
      ru: "/media",
      he: "/media"
    },
    "/birlikte-calisalim": {
      tr: "/birlikte-calisalim",
      en: "/partner-with-us",
      ru: "/sotrudnichestvo",
      he: "/ishstav-shlavi"
    },
    "/iletisim": {
      tr: "/iletisim",
      en: "/contact",
      ru: "/kontakty",
      he: "/kashir"
    },
    "/gizlilik": {
      tr: "/gizlilik",
      en: "/privacy",
      ru: "/konfidencialnost",
      he: "/privacy"
    },
    "/kvk": {
      tr: "/kvk",
      en: "/gdpr",
      ru: "/fz-152",
      he: "/gdpr"
    },
    "/sirketler": {
      tr: "/sirketler",
      en: "/companies",
      ru: "/kompanii",
      he: "/havarot"
    },
    "/is-yasasi-md-59": {
      tr: "/is-yasasi-md-59",
      en: "/labor-law-59",
      ru: "/zakon-o-trude-59",
      he: "/huk-avoda-59"
    },
    "/ihtiyat-sandigi-b3": {
      tr: "/ihtiyat-sandigi-b3",
      en: "/provident-fund-b3",
      ru: "/pensijnyj-fond-b3",
      he: "/kupa-pensiot-b3"
    }
  }
});

export type Yerel = (typeof yonlendirme.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(yonlendirme);
