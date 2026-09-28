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
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
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
  const anahtar =
    siteAnahtari ?? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

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
      try {
        await betikYukle();
        if (!aktif || !konteynerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(konteynerRef.current, {
          sitekey: anahtar,
          theme: "light",
          callback: (token) => {
            setHata(false);
            onDogrulama?.(token);
          },
          "error-callback": () => setHata(true),
        });
      } catch {
        setHata(true);
      } finally {
        if (aktif) setYukleniyor(false);
      }
    })();
    return () => {
      aktif = false;
    };
  }, [anahtar, onDogrulama]);

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
        <div className="text-xs text-hata-900 bg-hata-900/10 rounded-lg px-3 py-2">
          Turnstile doğrulaması şu anda kullanılamıyor. Lütfen sayfayı
          yenileyin.
        </div>
      )}
    </div>
  );
}
