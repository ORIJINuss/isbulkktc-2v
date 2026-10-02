"use client";

import { useEffect, useRef, useState } from "react";

type TurnstileBileseniProps = {
  siteAnahtari?: string;
  onDogrulama?: (token: string) => void;
  sinif?: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        konteyner: HTMLElement | string,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          appearance?: "always" | "execute" | "interaction-only";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export default function TurnstileBileseni({
  siteAnahtari,
  onDogrulama,
  sinif,
}: TurnstileBileseniProps) {
  const konteynerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(false);
  const [yenilemeSayisi, setYenilemeSayisi] = useState(0);
  const anahtar =
    siteAnahtari ||
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    (process.env.NODE_ENV === "production" ? undefined : "1x00000000000000000000AA");

  const betikYukle = () =>
    new Promise<void>((tamamla, hata) => {
      if (typeof window !== "undefined" && window.turnstile) {
        tamamla();
        return;
      }
      const mevcut = document.querySelector(
        'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]'
      );
      if (mevcut) {
        mevcut.addEventListener("load", () => tamamla());
        return;
      }
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      s.onload = () => tamamla();
      s.onerror = () => hata(new Error("Turnstile betiği yüklenemedi"));
      document.head.appendChild(s);
    });

  useEffect(() => {
    let aktif = true;
    (async () => {
      if (!anahtar) {
        setHata(true);
        setYukleniyor(false);
        onDogrulama?.("");
        return;
      }

      try {
        await betikYukle();
        if (!aktif || !konteynerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(konteynerRef.current, {
          sitekey: anahtar,
          theme: "auto",
          appearance: "always",
          callback: (token) => {
            setHata(false);
            onDogrulama?.(token);
          },
          "error-callback": () => {
            setHata(true);
            onDogrulama?.("");
          },
          "expired-callback": () => onDogrulama?.(""),
        });
      } catch {
        setHata(true);
      } finally {
        if (aktif) setYukleniyor(false);
      }
    })();
    return () => {
      aktif = false;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = undefined;
    };
  }, [anahtar, onDogrulama, yenilemeSayisi]);

  return (
    <div className={sinif}>
      <div
        ref={konteynerRef}
        className={hata ? "opacity-50" : ""}
        aria-live="polite"
      />
      {yukleniyor && !hata && (
        <div className="flex items-center gap-2 text-xs text-ikincil/60 py-1">
          <span className="msimge text-base animate-spin">progress_activity</span>
          Güvenlik doğrulaması hazırlanıyor...
        </div>
      )}
      {hata && (
        <div className="turnstile-hata" role="alert">
          <span className="msimge turnstile-hata__ikon" aria-hidden="true">shield_locked</span>
          <span className="turnstile-hata__metin">Güvenlik doğrulaması tamamlanamadı. Bağlantınızı kontrol edip yeniden deneyin.</span>
          <button
            type="button"
            className="turnstile-hata__tekrar"
            onClick={() => {
              setHata(false);
              setYukleniyor(true);
              setYenilemeSayisi((sayi) => sayi + 1);
            }}
          >
            Yenile
          </button>
        </div>
      )}
    </div>
  );
}
