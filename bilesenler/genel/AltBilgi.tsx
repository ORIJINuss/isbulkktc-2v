import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/yonlendirme";
import { siniflariBirlestir as sb } from "@/lib/yardimcilar/sinif-yardimcisi";
import Logo from "@/bilesenler/genel/Logo";
import SosyalMedyaKartlari from "@/bilesenler/genel/SosyalMedyaKartlari";

export default async function AltBilgi() {
  const t = await getTranslations("altbilgi");
  const m = await getTranslations("meta");
  const g = await getTranslations("gezinme");
  const kesfetBaglantilari = [
    { etiket: g("ilanAra"), yol: "/ilan-ara" },
    { etiket: g("freelance"), yol: "/freelance" },
    { etiket: g("sirketler"), yol: "/sirketler" },
    { etiket: g("paketler"), yol: "/ilan-paketleri" },
  ];
  const baglantilar = [
    { etiket: t("link1"), yol: "/is-yasasi-md-59" },
    { etiket: t("link3"), yol: "/gizlilik" },
    { etiket: t("link4"), yol: "/ihtiyat-sandigi-b3" },
    { etiket: t("link5"), yol: "/iletisim" }
  ];
  const kurumsalBaglantilar = [
    { etiket: t("hakkimizda"), yol: "/hakkimizda" },
    { etiket: t("kariyer"), yol: "/kariyer" },
    { etiket: t("medya"), yol: "/medya" },
    { etiket: t("birlikteCalisalim"), yol: "/birlikte-calisalim" }
  ];

  return (
    <footer
      className={sb(
        "mt-auto w-full bg-yüzey-kapsayici-alt border-t border-cizgi-degisken",
        "shadow-[0_-1px_0_rgb(193_200_197)]"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
        <div className="space-y-4 sm:col-span-2 lg:col-span-3">
          <Link href="/" className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ana/50">
            <Logo
              boyut="md"
              tema="acik"
              metinSinif="text-baslik-md font-bold"
              markaMetni={m("markaAdiKisa")}
            />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-yüzey-uzerinde/65">
            {m("slogan")}
          </p>
        </div>

        <nav aria-labelledby="altbilgi-kesfet" className="space-y-3 lg:col-span-3">
          <h2 id="altbilgi-kesfet" className="text-etiket-md text-ana font-bold uppercase tracking-wider">
            {g("ilanAra")}
          </h2>
          <ul className="space-y-2.5 text-govde-sm">
            {kesfetBaglantilari.map((b) => (
              <li key={b.yol}>
                <Link
                  href={b.yol as Parameters<typeof Link>[0]["href"]}
                  className="text-yüzey-uzerinde/75 transition-colors hover:text-ana"
                >
                  {b.etiket}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="altbilgi-kurumsal" className="space-y-3 lg:col-span-2">
          <h2 id="altbilgi-kurumsal" className="text-etiket-md text-ana font-bold uppercase tracking-wider">
            {t("kurumsalBaslik")}
          </h2>
          <ul className="space-y-2.5 text-govde-sm ">
            {kurumsalBaglantilar.map((b) => (
              <li key={b.yol}>
                <Link
                  href={b.yol as Parameters<typeof Link>[0]["href"]}
                  className="hover:text-ana text-yüzey-uzerinde/75 transition-colors"
                >
                  {b.etiket}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <SosyalMedyaKartlari />

        <nav aria-labelledby="altbilgi-yasal" className="space-y-3 lg:col-span-2">
          <h2 id="altbilgi-yasal" className="text-etiket-md text-ana font-bold uppercase tracking-wider">
            {t("yasalBaslik")}
          </h2>
          <ul className="space-y-2.5 text-govde-sm ">
            {baglantilar.map((b) => (
              <li key={b.yol}>
                <Link
                  href={b.yol as Parameters<typeof Link>[0]["href"]}
                  className="hover:text-ana text-yüzey-uzerinde/75 transition-colors"
                >
                  {b.etiket}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-cizgi-degisken/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-xs text-yüzey-uzerinde/60">
          <span>© {new Date().getFullYear()} {m("markaAdi")}</span>
        </div>
      </div>
    </footer>
  );
}
