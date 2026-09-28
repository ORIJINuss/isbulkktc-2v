"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/yonlendirme";
import { siniflariBirlestir as sb } from "@/lib/yardimcilar/sinif-yardimcisi";

const SECENEKLER: Array<{ kod: "tr" | "en" | "ru" | "he"; gorunen: string; bayrak: string }> = [
  { kod: "tr", gorunen: "Türkçe", bayrak: "🇹🇷" },
  { kod: "en", gorunen: "English", bayrak: "🇬🇧" },
  { kod: "ru", gorunen: "Русский", bayrak: "🇷🇺" },
  { kod: "he", gorunen: "עברית", bayrak: "🇮🇱" }
];

export default function DilSecici() {
  const aktif = useLocale() as "tr" | "en" | "ru" | "he";
  const yonlendir = useRouter();
  const yol = usePathname();
  const cevir = useTranslations("gezinme");
  const [acik, setAcik] = useState(false);
  const [odaklananSecenek, setOdaklananSecenek] = useState(() =>
    Math.max(0, SECENEKLER.findIndex((s) => s.kod === aktif))
  );
  const kapsayici = useRef<HTMLDivElement>(null);
  const tetikleyici = useRef<HTMLButtonElement>(null);
  const secenekler = useRef<Array<HTMLButtonElement | null>>([]);

  const aktifSecenekIndeksi = Math.max(
    0,
    SECENEKLER.findIndex((s) => s.kod === aktif)
  );

  useEffect(() => {
    if (!acik) return;
    secenekler.current[odaklananSecenek]?.focus();
  }, [acik, odaklananSecenek]);

  useEffect(() => {
    function disariTiklandi(olay: MouseEvent) {
      if (kapsayici.current && !kapsayici.current.contains(olay.target as Node)) {
        setAcik(false);
      }
    }
    document.addEventListener("mousedown", disariTiklandi);
    return () => document.removeEventListener("mousedown", disariTiklandi);
  }, []);

  function secildi(yerel: "tr" | "en" | "ru" | "he") {
    setAcik(false);
    yonlendir.replace(yol as Parameters<typeof yonlendir.replace>[0], { locale: yerel });
  }

  function acilirken() {
    setOdaklananSecenek(aktifSecenekIndeksi);
    setAcik(true);
  }

  function tetikleyiciKlavye(olay: KeyboardEvent<HTMLButtonElement>) {
    if (olay.key === "Enter" || olay.key === " ") {
      olay.preventDefault();
      setOdaklananSecenek(aktifSecenekIndeksi);
      setAcik((d) => !d);
    }
  }

  function secenekKlavye(
    olay: KeyboardEvent<HTMLButtonElement>,
    indeks: number
  ) {
    if (olay.key === "Escape") {
      olay.preventDefault();
      setAcik(false);
      tetikleyici.current?.focus();
      return;
    }

    if (olay.key === "Enter" || olay.key === " ") {
      olay.preventDefault();
      secildi(SECENEKLER[indeks].kod);
      tetikleyici.current?.focus();
      return;
    }

    let sonrakiIndeks: number | undefined;
    if (olay.key === "ArrowDown") {
      sonrakiIndeks = (indeks + 1) % SECENEKLER.length;
    } else if (olay.key === "ArrowUp") {
      sonrakiIndeks = (indeks - 1 + SECENEKLER.length) % SECENEKLER.length;
    } else if (olay.key === "Home") {
      sonrakiIndeks = 0;
    } else if (olay.key === "End") {
      sonrakiIndeks = SECENEKLER.length - 1;
    }

    if (sonrakiIndeks !== undefined) {
      olay.preventDefault();
      setOdaklananSecenek(sonrakiIndeks);
    }
  }

  const secili = SECENEKLER.find((s) => s.kod === aktif) ?? SECENEKLER[0];

  return (
    <div ref={kapsayici} className="relative">
      <button
        ref={tetikleyici}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={acik}
        aria-controls="dil-secici-listesi"
        aria-label={cevir("dilSecimi")}
        onClick={() => (acik ? setAcik(false) : acilirken())}
        onKeyDown={tetikleyiciKlavye}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-yüzey-kapsayici transition-colors text-yüzey-uzerinde/80 hover:text-yüzey-uzerinde"
      >
        <span className="msimge text-lg">language</span>
        <span className="text-etiket-sm font-bold">{secili.bayrak} {secili.kod.toUpperCase()}</span>
        <span className={sb("msimge text-[14px] transition-transform", acik ? "rotate-180" : "")}>
          expand_more
        </span>
      </button>

      {acik ? (
        <ul
          id="dil-secici-listesi"
          role="listbox"
          className={sb(
            "absolute end-0 mt-2 z-50 w-44 rounded-2xl border border-cizgi-degisken bg-yüzey-sonkuk py-2 shadow-mineral-yukseltilmis",
            aktif === "he" ? "text-right" : ""
          )}
        >
          {SECENEKLER.map((secenek, indeks) => {
            const durum = secenek.kod === aktif;
            return (
              <li key={secenek.kod}>
                <button
                  ref={(element) => {
                    secenekler.current[indeks] = element;
                  }}
                  type="button"
                  id={`dil-secici-${secenek.kod}`}
                  role="option"
                  aria-selected={durum}
                  tabIndex={odaklananSecenek === indeks ? 0 : -1}
                  onClick={() => secildi(secenek.kod)}
                  onKeyDown={(olay) => secenekKlavye(olay, indeks)}
                  className={sb(
                    "w-full flex items-center justify-between gap-3 px-4 py-2 text-govde-md font-medium",
                    durum
                      ? "bg-ana-sabit/40 text-ana-sabit-uzerinde"
                      : "text-yüzey-uzerinde hover:bg-yüzey-kapsayici"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span>{secenek.bayrak}</span>
                    <span>{secenek.gorunen}</span>
                  </span>
                  {durum ? <span className="msimge msimge-dolu text-ana">check</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
