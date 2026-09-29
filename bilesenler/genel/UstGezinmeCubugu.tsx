"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/yonlendirme";
import DilSecici from "@/bilesenler/genel/DilSecici";
import Logo from "@/bilesenler/genel/Logo";
import Buton from "@/bilesenler/genel/Buton";
import Rozet from "@/bilesenler/genel/Rozet";
import type { Yerel } from "@/i18n/yonlendirme";
import { siniflariBirlestir as sb } from "@/lib/yardimcilar/sinif-yardimcisi";
import { tarayiciIcinSupabaseOlustur } from "@/lib/supabase/tarayici-istemci";

export default function UstGezinmeCubugu({ yerel }: { yerel: Yerel }) {
  const t = useTranslations("gezinme");
  const m = useTranslations("meta");
  const router = useRouter();
  const [mobilMenuAcik, setMobilMenuAcik] = useState(false);
  const [oturumAcik, setOturumAcik] = useState(false);
  const [kimlikHatasi, setKimlikHatasi] = useState<
    "yapilandirilamadi" | "cikisBasarisiz" | "oturumDogrulanamadi" | null
  >(null);

  useEffect(() => {
    let etkin = true;
    let temizle: (() => void) | null = null;

    const dogrulamaHatasiniTemizle = () =>
      setKimlikHatasi((mevcut) => (mevcut === "oturumDogrulanamadi" ? null : mevcut));

    try {
      const supabase = tarayiciIcinSupabaseOlustur();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!etkin) return;
        const oturumVar = Boolean(session?.user);
        setOturumAcik(oturumVar);
        if (oturumVar) dogrulamaHatasiniTemizle();
      });
      temizle = () => void subscription.unsubscribe();

      void supabase.auth
        .getUser()
        .then(({ data, error }) => {
          if (!etkin) return;
          if (error) {
            setOturumAcik(false);
            // Oturumu olmayan ziyaretçi için Supabase AuthSessionMissingError döner; bu bir hata değildir.
            const oturumYok = error.name === "AuthSessionMissingError" || error.status === 400;
            setKimlikHatasi(oturumYok ? null : "oturumDogrulanamadi");
            return;
          }
          setOturumAcik(Boolean(data.user));
          setKimlikHatasi(null);
        })
        .catch(() => {
          if (!etkin) return;
          setOturumAcik(false);
          setKimlikHatasi("oturumDogrulanamadi");
        });
    } catch {
      setOturumAcik(false);
      setKimlikHatasi("yapilandirilamadi");
    }

    return () => {
      etkin = false;
      temizle?.();
    };
  }, []);

  const oturumuKapat = async () => {
    try {
      const supabase = tarayiciIcinSupabaseOlustur();
      const { error } = await supabase.auth.signOut();
      if (error) {
        setKimlikHatasi("cikisBasarisiz");
        return;
      }
      setOturumAcik(false);
      setKimlikHatasi(null);
      router.push("/giris");
    } catch {
      setKimlikHatasi("cikisBasarisiz");
    }
  };

  const baglantilar = [
    { etiket: t("ilanAra"), yol: "/ilan-ara", ikon: "travel_explore" },
    { etiket: t("freelance"), yol: "/freelance", ikon: "handshake" },
    { etiket: t("sirketler"), yol: "/sirketler", ikon: "apartment" },
    { etiket: t("paketler"), yol: "/ilan-paketleri", ikon: "sell" }
  ] as const;

  const ibrisi = yerel === "he";

  const kimlikHatasiMesaji: Record<NonNullable<typeof kimlikHatasi>, string> = {
    yapilandirilamadi: t("kimlikHatasi"),
    cikisBasarisiz: t("cikisHatasi"),
    oturumDogrulanamadi: t("oturumDogrulanamadiHatasi")
  };

  return (
    <header
      className={sb(
        "sticky top-0 z-40 backdrop-blur-md bg-yüzey/92 border-b border-cizgi-degisken/70 transition-all",
        "shadow-[0_1px_0_rgb(193_200_197)]"
      )}
    >
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
        <Link href="/" aria-label={m("markaAdiKisa")} className="shrink-0 rounded-2xl transition-transform hover:scale-[1.015]">
          <Logo
            boyut="md"
            tema="saydam"
            metinSinif="inline-flex text-baslik-md font-bold"
            markaMetni={m("markaAdiKisa")}
          />
        </Link>
        <nav
          aria-label={t("anaSayfa")}
          className="hidden xl:flex items-center gap-4 2xl:gap-5 text-govde-md font-medium text-yüzey-uzerinde/70 shrink-0"
        >
          {baglantilar.slice(1).map((b) => (
            <Link
              key={b.yol}
              href={b.yol}
              className="py-2 rounded-lg hover:text-ana transition-colors flex items-center gap-1.5"
            >
              <span className="msimge text-[18px]" aria-hidden="true">{b.ikon}</span>
              <span>{b.etiket}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <DilSecici />

          {oturumAcik && (
            <Link
              href="/aday/masam"
              aria-label={t("bildirimler")}
              className="relative p-1.5 rounded-xl hover:bg-yüzey-kapsayici text-yüzey-uzerinde/70 hover:text-ana transition-colors"
            >
              <span className="msimge text-xl" aria-hidden="true">notifications</span>
            </Link>
          )}

          <div className="hidden xl:flex items-center gap-2">
            <Link
              href="/aday-profilim"
              className="text-etiket-md font-semibold px-3 py-1.5 rounded-xl text-yüzey-uzerinde/70 hover:text-yüzey-uzerinde hover:bg-yüzey-kapsayici transition-colors"
            >
              {t("adayim")}
            </Link>
            <Buton tur="baglanti" href="/isveren/yeni-ilan" varyant="ana" boyut="sm" ikon="business_center">
              {t("isverenim")}
            </Buton>
            {oturumAcik && (
              <button
                type="button"
                onClick={() => void oturumuKapat()}
                className="text-etiket-md font-semibold px-3 py-1.5 rounded-xl text-yüzey-uzerinde/70 hover:text-hata hover:bg-yüzey-kapsayici transition-colors"
              >
                {t("cikis")}
              </button>
            )}
          </div>

          <div className="xl:hidden flex items-center gap-1">
            <Link
              href="/ilan-ara"
              aria-label={t("ilanAra")}
              className="p-2 rounded-xl text-ana hover:bg-yüzey-kapsayici md:hidden"
            >
              <span className="msimge text-xl" aria-hidden="true">search</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobilMenuAcik((acik) => !acik)}
              className="p-2 rounded-xl hover:bg-yüzey-kapsayici text-yüzey-uzerinde"
              aria-label={t("menuyuAc")}
              aria-expanded={mobilMenuAcik}
              aria-controls="mobil-menu"
            >
              <span className="msimge text-xl" aria-hidden="true">{mobilMenuAcik ? "close" : "menu"}</span>
            </button>
          </div>
        </div>
      </div>
      {kimlikHatasi ? (
        <p
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-1.5 border-t border-hata/30 bg-hata-kapsayici px-4 py-1.5 text-center text-etiket-md font-semibold text-hata-900 sm:px-6"
        >
          <span className="msimge text-base" aria-hidden="true">
            error
          </span>
          {kimlikHatasiMesaji[kimlikHatasi]}
        </p>
      ) : null}
      {mobilMenuAcik && (
        <nav
          id="mobil-menu"
          aria-label={t("anaSayfa")}
          className="xl:hidden border-t border-cizgi-degisken/70 bg-yüzey px-4 sm:px-6 py-3"
        >
          <div className="flex flex-col gap-1 text-sm font-semibold text-yüzey-uzerinde/80">
            {baglantilar.map((baglanti) => (
              <Link
                key={baglanti.yol}
                href={baglanti.yol}
                onClick={() => setMobilMenuAcik(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 hover:bg-yüzey-kapsayici hover:text-ana"
              >
                <span className="msimge text-[20px]" aria-hidden="true">{baglanti.ikon}</span>
                {baglanti.etiket}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-cizgi-degisken/70 pt-3">
              <Link
                href="/aday-profilim"
                onClick={() => setMobilMenuAcik(false)}
                className="rounded-xl border border-cizgi-degisken px-3 py-2.5 text-center hover:bg-yüzey-kapsayici hover:text-ana"
              >
                {t("adayim")}
              </Link>
              <Link
                href="/isveren/yeni-ilan"
                onClick={() => setMobilMenuAcik(false)}
                className="rounded-xl bg-ana px-3 py-2.5 text-center text-ana-uzerinde hover:opacity-90"
              >
                {t("isverenim")}
              </Link>
              {oturumAcik && (
                <button
                  type="button"
                  onClick={() => {
                    setMobilMenuAcik(false);
                    void oturumuKapat();
                  }}
                  className="col-span-2 rounded-xl px-3 py-2.5 text-center hover:bg-yüzey-kapsayici hover:text-hata"
                >
                  {t("cikis")}
                </button>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
