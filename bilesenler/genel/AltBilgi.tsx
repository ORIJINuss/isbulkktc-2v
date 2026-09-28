import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/yonlendirme";
import { siniflariBirlestir as sb } from "@/lib/yardimcilar/sinif-yardimcisi";
import Logo from "@/bilesenler/genel/Logo";

export default async function AltBilgi() {
  const t = await getTranslations("altbilgi");
  const m = await getTranslations("meta");
  const baglantilar = [
    { etiket: t("link1"), yol: "/is-yasasi-md-59" },
    { etiket: t("link2"), yol: "/pes-lisans" },
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
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-6 space-y-3">
          <div className="flex items-center gap-2">
            <Logo boyut="md" sembolGosterilsin={false} metinSinif="text-baslik-md font-bold" markaMetni={m("markaAdiKisa")} />
          </div>
          <p className="text-govde-sm  text-hüküm-sonuk max-w-xl leading-relaxed">
            {t("hakMetni")}
          </p>
          <div className="flex items-center gap-3 pt-1">
            {["policy", "verified_user", "gavel", "health_and_safety", "local_police"].map(
              (ikon) => (
                <span
                  key={ikon}
                  className="w-9 h-9 rounded-xl bg-yüzey-kapsayici border border-cizgi-degisken/70 flex items-center justify-center text-ana/80 hover:text-ana transition-colors cursor-help"
                >
                  <span className="msimge text-[18px]">{ikon}</span>
                </span>
              )
            )}
          </div>
        </div>

        <div className="md:col-span-3 space-y-3">
          <span className="text-etiket-md  text-ana font-bold uppercase tracking-wider">
            {t("kurumsalBaslik")}
          </span>
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
        </div>

        <div className="md:col-span-3 space-y-3">
          <span className="text-etiket-md  text-ana font-bold uppercase tracking-wider">
            {t("yasalBaslik")}
          </span>
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
        </div>
      </div>
      <div className="border-t border-cizgi-degisken/60">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-govde-xs  text-hüküm-sonuk">
            © {new Date().getFullYear()} {m("markaAdi")} {t("tumHaklariSaklidir")}
          </p>
        </div>
      </div>
    </footer>
  );
}
