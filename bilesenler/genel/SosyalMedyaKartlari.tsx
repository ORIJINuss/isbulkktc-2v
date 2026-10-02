import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { siniflariBirlestir as sb } from "@/lib/yardimcilar/sinif-yardimcisi";

const INSTAGRAM_ADRES = "https://www.instagram.com/isbulkktc?stkn=aTQxdHFlc3czOHdw";
const WHATSAPP_NUMARA = "905391316421";

type SosyalDugme = {
  anahtar: string;
  cta: string;
  gorsel: { yol: string; islenmemis: boolean };
  adres: string;
  gradyan: string;
};

export default async function SosyalMedyaKartlari() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("altbilgi"),
  ]);
  const isHebrew = locale === "he";

  const whatsappBaglanti = `https://wa.me/${WHATSAPP_NUMARA}?text=${encodeURIComponent(
    t("whatsappMesaj")
  )}`;

  const dugmeler: SosyalDugme[] = [
    {
      anahtar: "instagram",
      cta: t("sosyalInstagramCta"),
      gorsel: { yol: "/images/social/instagram-glyph-white.svg", islenmemis: true },
      adres: INSTAGRAM_ADRES,
      gradyan:
        "bg-gradient-to-br from-[#833ab4] via-[#d62976] to-[#fd5949]",
    },
    {
      anahtar: "whatsapp",
      cta: t("sosyalWhatsappCta"),
      gorsel: { yol: "/images/social/whatsapp-glyph-white.svg", islenmemis: true },
      adres: whatsappBaglanti,
      gradyan: "bg-gradient-to-b from-[#22c96f] via-[#0b7d57] to-[#075e54]",
    },
  ];

  return (
    <>
      <div aria-hidden="true" className="lg:col-span-2" />

      <nav
        aria-label={t("sosyalBaslik")}
        dir={isHebrew ? "rtl" : "ltr"}
        className={sb(
          "pointer-events-none fixed top-1/2 z-50 w-[14.5rem]",
          isHebrew ? "left-0" : "right-0",
          "-translate-y-1/2 flex flex-col items-end gap-2"
        )}
      >
        <ul className="flex flex-col items-end gap-2">
          {dugmeler.map((dugme) => (
            <li key={dugme.anahtar} className="pointer-events-auto">
              <a
                href={dugme.adres}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${dugme.cta} — ${t("sosyalAc")}`}
                className={sb(
                  "group relative flex h-11 w-14 shrink-0 items-center justify-end",
                  "overflow-hidden shadow-lg shadow-black/20",
                  isHebrew ? "rounded-r-full" : "rounded-l-full",
                  "hover:w-[14.5rem] focus-visible:w-[14.5rem]",
                  "transition-[width] duration-300 ease-out",
                  "motion-reduce:transition-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                  dugme.gradyan
                )}
              >
                <span
                  dir="auto"
                  className={sb(
                    "min-w-0 flex-1 truncate pl-4 pr-3 text-sm font-semibold",
                    "text-white opacity-0 group-hover:opacity-100",
                    "group-focus-visible:opacity-100 transition-opacity duration-200",
                    "motion-reduce:transition-none"
                  )}
                >
                  {dugme.cta}
                </span>
                <span
                  aria-hidden="true"
                  className="flex w-14 shrink-0 items-center justify-center"
                >
                  <Image
                    src={dugme.gorsel.yol}
                    alt=""
                    width={24}
                    height={24}
                    unoptimized={dugme.gorsel.islenmemis}
                    className="h-6 w-6 object-contain"
                  />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
