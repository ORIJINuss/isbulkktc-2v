"use client";

import { useState, useRef, useEffect, useMemo, type KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import Rozet from "@/bilesenler/genel/Rozet";
import Buton from "@/bilesenler/genel/Buton";
import { siniflariBirlestir as sb } from "@/lib/yardimcilar/sinif-yardimcisi";

type Mesaj = {
  kim: "kullanici" | "asistan";
  icerik: string;
  zaman: Date;
};

const ONERI_IKONLARI = ["location_city", "school", "workspace_premium", "translate"] as const;
const ONERI_ANAHTARLARI = [
  "aiPoposuOneri1",
  "aiPoposuOneri2",
  "aiPoposuOneri3",
  "aiPoposuOneri4"
] as const;

export default function AIPoposu() {
  const t = useTranslations("anaSayfa");
  const yerel = useLocale();
  const [acik, setAcik] = useState(false);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [girdi, setGirdi] = useState("");
  const [bekliyor, setBekliyor] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const tetikleyici = useRef<HTMLButtonElement>(null);
  const girdiAlani = useRef<HTMLInputElement>(null);
  const scrollAlani = useRef<HTMLDivElement>(null);
  const oncekiAcik = useRef(false);

  const karsilama: Mesaj = useMemo(
    () => ({ kim: "asistan", icerik: t("aiPoposuKarsilama"), zaman: new Date() }),
    [t]
  );

  useEffect(() => {
    setMesajlar((eski) => (eski.length === 0 ? [karsilama] : eski));
  }, [karsilama]);

  useEffect(() => {
    if (acik) {
      girdiAlani.current?.focus();
    } else if (oncekiAcik.current) {
      tetikleyici.current?.focus();
    }
    oncekiAcik.current = acik;
  }, [acik]);

  useEffect(() => {
    if (scrollAlani.current) {
      scrollAlani.current.scrollTop = scrollAlani.current.scrollHeight;
    }
  }, [mesajlar, bekliyor]);

  function oneriyiSec(metin: string) {
    soruyuGonder(metin);
  }

  function soruyuGonder(metin: string) {
    if (!metin.trim()) return;
    const gonderilen: Mesaj = { kim: "kullanici", icerik: metin, zaman: new Date() };
    setMesajlar((eski) => [...eski, gonderilen]);
    setGirdi("");
    setBekliyor(true);
    setTimeout(() => {
      const yanit: Mesaj = {
        kim: "asistan",
        zaman: new Date(),
        icerik: t("aiPoposuYanit", {
          sorgu: metin,
          adet: Math.floor(12 + Math.random() * 38),
          ats: 84 + Math.floor(Math.random() * 14)
        })
      };
      setMesajlar((eski) => [...eski, yanit]);
      setBekliyor(false);
    }, 900);
  }

  function panelKlavye(olay: KeyboardEvent<HTMLDivElement>) {
    if (olay.key === "Escape") {
      olay.preventDefault();
      setAcik(false);
      tetikleyici.current?.focus();
      return;
    }

    if (olay.key !== "Tab" || !panel.current) return;

    const odaklanabilirler = panel.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!odaklanabilirler.length) {
      olay.preventDefault();
      return;
    }

    const ilk = odaklanabilirler[0];
    const son = odaklanabilirler[odaklanabilirler.length - 1];
    if (olay.shiftKey && document.activeElement === ilk) {
      olay.preventDefault();
      son.focus();
    } else if (!olay.shiftKey && document.activeElement === son) {
      olay.preventDefault();
      ilk.focus();
    }
  }

  return (
    <div className="fixed bottom-6 end-6 z-40 flex flex-col items-end gap-3">
      {acik ? (
        <div
          ref={panel}
          id="isbukktc-ai-chat"
          role="dialog"
          aria-modal="true"
          aria-labelledby="isbukktc-ai-chat-title"
          onKeyDown={panelKlavye}
          className="w-[min(92vw,24rem)] mineral-kart rounded-3xl p-0 overflow-hidden shadow-mineral-yukseltilmis border-t-4 border-t-ana animate-[fadeIn_.18s_ease-out]"
        >
          <div className="p-4 bg-gradient-to-b from-yüzey-kapsayici-alt to-yüzey-kapsayici border-b border-cizgi-degisken flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="w-11 h-11 rounded-2xl bg-ana text-ana-uzerinde flex items-center justify-center shadow-editoriyel-kart shrink-0">
                <span className="msimge msimge-dolu text-xl">auto_awesome</span>
              </span>
              <div>
                <p
                  id="isbukktc-ai-chat-title"
                  className="text-baslik-sm  text-ana font-bold leading-tight"
                >
                  {t("aiPoposuBaslik")}
                </p>
                <p className="text-govde-xs text-hüküm-sonuk mt-0.5">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-ikincil animate-pulse" />
                    {t("aiPoposuAktif")} —{" "}
                    {new Date().toLocaleTimeString(yerel, {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label={t("aiPoposuSohbetiKapat")}
              onClick={() => setAcik(false)}
              className="p-1.5 rounded-lg hover:bg-yüzey-kapsayici-yüksek text-yüzey-uzerinde/70 hover:text-hata transition-colors"
            >
              <span className="msimge text-lg">close</span>
            </button>
          </div>

          <div ref={scrollAlani} className="h-80 overflow-y-auto ozel-kaydirma p-4 space-y-3 bg-yüzey-sonkuk">
            {mesajlar.map((m, idx) => (
              <div
                key={idx}
                className={sb(
                  "flex",
                  m.kim === "kullanici" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={sb(
                    "max-w-[82%] rounded-2xl px-4 py-2.5 text-govde-sm leading-relaxed shadow-editoriyel-kart",
                    m.kim === "kullanici"
                      ? "bg-ana text-ana-uzerinde rounded-br-md"
                      : "bg-yüzey-kapsayici-alt border border-cizgi-degisken/60 rounded-bl-md text-yüzey-uzerinde"
                  )}
                >
                  {m.icerik}
                </div>
              </div>
            ))}
            {bekliyor ? (
              <div className="flex justify-start">
                <div className="max-w-[82%] rounded-2xl rounded-bl-md bg-yüzey-kapsayici-alt border border-cizgi-degisken/60 px-4 py-3 text-ana">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-ana/70 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-ana/70 animate-bounce [animation-delay:120ms]" />
                    <span className="w-2 h-2 rounded-full bg-ana/70 animate-bounce [animation-delay:240ms]" />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {mesajlar.length <= 1 ? (
            <div className="px-4 pt-3 pb-2 border-t border-cizgi-degisken/60 bg-yüzey-kapsayici-alt/40">
              <p className="text-etiket-xs font-semibold text-ana mb-2 uppercase tracking-wide">
                {t("aiPoposuBaslayalim")}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {ONERI_ANAHTARLARI.map((anahtar, sira) => {
                  const metin = t(anahtar);
                  return (
                    <button
                      key={anahtar}
                      type="button"
                      onClick={() => oneriyiSec(metin)}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-yüzey-sonkuk border border-cizgi-degisken/70 hover:border-ana/40 hover:bg-yüzey-kapsayici-alt transition-colors text-start"
                    >
                      <span className="flex items-center gap-2 text-govde-sm text-yüzey-uzerinde">
                        <span className="msimge text-ana text-[18px]">{ONERI_IKONLARI[sira]}</span>
                        {metin}
                      </span>
                      <span className="msimge text-hüküm-sonuk text-[16px]">arrow_forward</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              soruyuGonder(girdi);
            }}
            className="p-3 bg-yüzey-kapsayici border-t border-cizgi-degisken/60 flex items-center gap-2"
          >
            <input
              ref={girdiAlani}
              value={girdi}
              onChange={(e) => setGirdi(e.target.value)}
              placeholder={t("aiPoposuPlaceholder")}
              className="girdi !py-2 !text-govde-sm"
              aria-label={t("aiPoposuSoruYaz")}
            />
            <Buton
              tur="buton"
              varyant="ana"
              boyut="sm"
              ikon="send"
              type="submit"
              aria-label={t("aiPoposuGonder")}
              className="!aspect-square !px-2 !py-2"
            />
          </form>
        </div>
      ) : null}

      <button
        ref={tetikleyici}
        type="button"
        aria-label={acik ? t("aiPoposuKapatLabel") : t("aiPoposuAcLabel")}
        aria-expanded={acik}
        aria-controls="isbukktc-ai-chat"
        onClick={() => setAcik((d) => !d)}
        className={sb(
          "group relative rounded-full shadow-mineral-yukseltilmis transition-all duration-200",
          "bg-ana text-ana-uzerinde hover:bg-ana-kapsayici active:scale-95",
          acik ? "w-14 h-14" : "w-16 h-16"
        )}
      >
        <span
          className={sb(
            "msimge msimge-dolu transition-transform duration-200",
            acik ? "text-xl rotate-90" : "text-2xl"
          )}
        >
          {acik ? "close" : "smart_toy"}
        </span>
        {!acik ? (
          <Rozet
            tur="basari"
            kucuk
            sinif="absolute -top-1 -end-1 shadow-editoriyel-kart"
          >
            {t("aiPoposuYeni")}
          </Rozet>
        ) : null}
      </button>
    </div>
  );
}
