"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/yonlendirme";
import { sb } from "@/lib/yardimcilar/sinif-yardimcisi";
import {
  DestekSohbetCevapSema,
  type DestekSohbetCevabi,
  type DestekSohbetMesaji,
} from "@/lib/veri/destek-sohbet-sema";

type Mesaj = {
  rol: DestekSohbetMesaji["rol"];
  metin: string;
  kaynak?: DestekSohbetCevabi["kaynak"];
  rota?: DestekSohbetCevabi["rota"];
};

const BASLANGIC_ANAHTARLARI = [
  "destekBaslangicIlan",
  "destekBaslangicUcret",
  "destekBaslangicPaket",
  "destekBaslangicCV",
] as const;

export default function AIPoposu() {
  const t = useTranslations("altbilgi");
  const yerel = useLocale();
  const whatsappHref = `https://wa.me/905391316421?text=${encodeURIComponent(t("whatsappMesaj"))}`;
  const [acik, setAcik] = useState(false);
  const [metin, setMetin] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState(false);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>(() => [
    { rol: "assistant", metin: t("destekSelamlama") },
  ]);
  const kapatDugmesi = useRef<HTMLButtonElement>(null);
  const tetikleyici = useRef<HTMLButtonElement>(null);
  const mesajSonu = useRef<HTMLDivElement>(null);
  const oncekiAcik = useRef(false);

  useEffect(() => {
    if (acik) {
      kapatDugmesi.current?.focus();
    } else if (oncekiAcik.current) {
      tetikleyici.current?.focus();
    }
    oncekiAcik.current = acik;
  }, [acik]);

  useEffect(() => {
    mesajSonu.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mesajlar, yukleniyor]);

  function panelKlavye(olay: KeyboardEvent<HTMLDivElement>) {
    if (olay.key === "Escape") {
      olay.preventDefault();
      setAcik(false);
    }
  }

  async function mesajGonder(gonderilecekMetin: string) {
    const temizMetin = gonderilecekMetin.trim();
    if (!temizMetin || yukleniyor || temizMetin.length > 600) return;

    const sonrakiMesajlar = [
      ...mesajlar,
      { rol: "user" as const, metin: temizMetin },
    ].slice(-8);
    setMesajlar(sonrakiMesajlar);
    setMetin("");
    setHata(false);
    setYukleniyor(true);

    try {
      const yanit = await fetch("/api/destek/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yerel,
          mesajlar: sonrakiMesajlar.map(({ rol, metin: icerik }) => ({
            rol,
            metin: icerik.slice(0, 600),
          })),
        }),
      });
      if (!yanit.ok) throw new Error("Destek yanıtı alınamadı.");

      const sonuc = DestekSohbetCevapSema.safeParse((await yanit.json()) as unknown);
      if (!sonuc.success) throw new Error("Destek yanıtı geçersiz.");

      const cevapMesaji: Mesaj = {
        rol: "assistant",
        metin: sonuc.data.cevap,
        kaynak: sonuc.data.kaynak,
        rota: sonuc.data.rota,
      };
      setMesajlar((oncekiler) => [...oncekiler, cevapMesaji].slice(-8));
    } catch {
      setHata(true);
    } finally {
      setYukleniyor(false);
    }
  }

  function formGonder(olay: FormEvent<HTMLFormElement>) {
    olay.preventDefault();
    void mesajGonder(metin);
  }

  const kaynakEtiketi = (kaynak: NonNullable<Mesaj["kaynak"]>) => {
    if (kaynak === "hazir") return t("destekKaynakFaq");
    if (kaynak === "ai") return t("destekKaynakAi");
    return t("destekKaynakYedek");
  };

  return (
    <div className="fixed bottom-4 end-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:end-6">
      {acik ? (
        <div
          id="isbukktc-destek"
          role="dialog"
          aria-modal="false"
          aria-labelledby="isbukktc-destek-title"
          onKeyDown={panelKlavye}
          className="mineral-kart flex max-h-[min(78dvh,42rem)] w-[min(92vw,25rem)] flex-col overflow-hidden rounded-3xl border-t-4 border-t-ana p-0 shadow-mineral-yukseltilmis animate-[fadeIn_.18s_ease-out]"
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-cizgi-degisken bg-gradient-to-b from-yüzey-kapsayici-alt to-yüzey-kapsayici p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ana text-ana-uzerinde shadow-editoriyel-kart">
                <span className="msimge msimge-dolu text-xl" aria-hidden="true">support_agent</span>
              </span>
              <div>
                <p id="isbukktc-destek-title" className="text-baslik-sm font-bold leading-tight text-ana">
                  {t("destekBaslik")}
                </p>
                <p className="mt-0.5 text-govde-xs text-hüküm-sonuk">{t("destekKanali")}</p>
              </div>
            </div>
            <button
              ref={kapatDugmesi}
              type="button"
              aria-label={t("destekKapat")}
              onClick={() => setAcik(false)}
              className="rounded-lg p-1.5 text-yüzey-uzerinde/70 transition-colors hover:bg-yüzey-kapsayici-yüksek hover:text-hata focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ana"
            >
              <span className="msimge text-lg" aria-hidden="true">close</span>
            </button>
          </div>

          <div
            className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-yüzey-sonkuk p-4"
            role="log"
            aria-label={t("destekSohbetGecmisi")}
            aria-live="polite"
            aria-relevant="additions text"
            aria-busy={yukleniyor}
          >
            {mesajlar.map((mesaj, sira) => (
              <div
                key={`${sira}-${mesaj.rol}`}
                className={sb("flex flex-col gap-1", mesaj.rol === "user" ? "items-end" : "items-start")}
              >
                {mesaj.kaynak ? (
                  <span className="px-1 text-[11px] font-medium text-hüküm-sonuk">
                    {kaynakEtiketi(mesaj.kaynak)}
                  </span>
                ) : null}
                <p
                  dir="auto"
                  className={sb(
                    "max-w-[90%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    mesaj.rol === "user"
                      ? "rounded-ee-md bg-ana text-ana-uzerinde"
                      : "rounded-es-md bg-yüzey-kapsayici-alt text-yüzey-uzerinde",
                  )}
                >
                  {mesaj.metin}
                </p>
                {mesaj.rota ? (
                  <Link
                    href={mesaj.rota}
                    dir="auto"
                    className="mx-1 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-ana underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ana"
                  >
                    {t("destekCtaEtiketi")}
                    <span className="msimge text-base" aria-hidden="true">arrow_outward</span>
                  </Link>
                ) : null}
              </div>
            ))}
            {mesajlar.length === 1 && !yukleniyor ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {BASLANGIC_ANAHTARLARI.map((anahtar) => (
                  <button
                    key={anahtar}
                    type="button"
                    dir="auto"
                    onClick={() => void mesajGonder(t(anahtar))}
                    className="min-h-10 rounded-full border border-cizgi-degisken bg-yüzey-kapsayici px-3 py-1.5 text-start text-xs font-medium text-yüzey-uzerinde transition hover:border-ana hover:text-ana focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ana"
                  >
                    {t(anahtar)}
                  </button>
                ))}
              </div>
            ) : null}
            {yukleniyor ? (
              <p className="text-sm text-hüküm-sonuk" role="status">
                {t("destekYanitBekleniyor")}
              </p>
            ) : null}
            {hata ? (
              <p className="rounded-xl bg-hata/10 px-3 py-2 text-sm text-hata" role="alert">
                {t("destekHata")}
              </p>
            ) : null}
            <div ref={mesajSonu} />
          </div>

          <form onSubmit={formGonder} className="shrink-0 space-y-2 border-t border-cizgi-degisken bg-yüzey-kapsayici p-3">
            <label htmlFor="isbukktc-destek-input" className="sr-only">
              {t("destekGirdiEtiketi")}
            </label>
            <div className="flex items-end gap-2">
              <textarea
                id="isbukktc-destek-input"
                value={metin}
                dir="auto"
                onChange={(olay) => setMetin(olay.target.value.slice(0, 600))}
                placeholder={t("destekGirdiPlaceholder")}
                maxLength={600}
                rows={2}
                disabled={yukleniyor}
                className="min-h-11 min-w-0 flex-1 resize-none rounded-xl border border-cizgi-degisken bg-yüzey-sonkuk px-3 py-2.5 text-sm text-yüzey-uzerinde placeholder:text-hüküm-sonuk focus:border-ana focus:outline-none focus:ring-2 focus:ring-ana/30 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={yukleniyor || !metin.trim()}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-ana px-3.5 py-2.5 text-sm font-semibold text-ana-uzerinde transition hover:bg-ana-kapsayici focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ana focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="msimge text-lg" aria-hidden="true">send</span>
                <span>{t("destekGonder")}</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <p className="text-xs text-hüküm-sonuk">{t("destekWhatsappAciklama")}</p>
              <a
                href={whatsappHref}
                dir="auto"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-ana underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ana"
              >
                <span className="msimge text-base" aria-hidden="true">support_agent</span>
                {t("destekWhatsapp")}
              </a>
            </div>
          </form>
        </div>
      ) : null}

      <button
        ref={tetikleyici}
        type="button"
        aria-label={acik ? t("destekKapat") : t("destekBaslik")}
        aria-expanded={acik}
        aria-controls="isbukktc-destek"
        onClick={() => setAcik((deger) => !deger)}
        className={sb(
          "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-4 shadow-mineral-yukseltilmis transition-all duration-200",
          "bg-ana text-ana-uzerinde hover:bg-ana-kapsayici active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ana focus-visible:ring-offset-2",
          acik ? "h-14 w-14 px-0" : "h-12",
        )}
      >
        <span
          className={sb(
            "msimge msimge-dolu transition-transform duration-200",
            acik ? "rotate-90 text-xl" : "text-xl",
          )}
          aria-hidden="true"
        >
          {acik ? "close" : "support_agent"}
        </span>
        {!acik && <span className="text-sm font-semibold">{t("destekBaslik")}</span>}
      </button>
    </div>
  );
}
