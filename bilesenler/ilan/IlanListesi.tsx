"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import IlanServisi from "@/lib/servisler/ilan-servisi";
import { sb } from "@/lib/yardimcilar/sinif-yardimcisi";
import IlanKartı from "./IlanKartı";
import type { Ilan, IlanFiltreleri } from "@/lib/veri/ilan-tipi";

type IlanListesiProps = {
  filtreler?: IlanFiltreleri;
  kaynak?: Ilan[];
  limit?: number;
  gosterBos?: boolean;
  gosterToplam?: boolean;
  sayfala?: boolean;
  className?: string;
};

const sayfaDugmesi = (
  sb(
    "sayfalama-buton",
    "w-auto min-w-9 px-3 text-xs font-bold tabular-nums",
    "disabled:opacity-40 disabled:cursor-not-allowed"
  )
);

export default function IlanListesi({
  filtreler = {},
  kaynak = [],
  limit = 10,
  gosterBos = true,
  gosterToplam = false,
  sayfala = false,
  className,
}: IlanListesiProps) {
  const t = useTranslations("ilanAra");
  const g = useTranslations("genel");
  const [sayfa, setSayfa] = useState(1);

  const varsayilanFiltre: IlanFiltreleri = useMemo(
    () => ({
      ilceKodlari: [],
      sektorKodlari: [],
      calismaSekliKodlari: [],
      izinTipiKodlari: [],
      siralama: "akilli",
      ...filtreler,
    }),
    [filtreler]
  );

  const { ilanlar, toplam } = useMemo(
    () => new IlanServisi(kaynak).listele(varsayilanFiltre),
    [kaynak, varsayilanFiltre]
  );

  const sayfaSayisi = sayfala ? Math.max(1, Math.ceil(toplam / limit)) : 1;
  const aktifSayfa = Math.min(sayfa, sayfaSayisi);
  const gosterilecek = sayfala
    ? ilanlar.slice((aktifSayfa - 1) * limit, aktifSayfa * limit)
    : ilanlar.slice(0, limit);

  useEffect(() => {
    setSayfa(1);
  }, [varsayilanFiltre]);

  if (gosterilecek.length === 0 && gosterBos) {
    return (
      <div className="mineral-kart p-10 text-center">
        <span className="msimge text-6xl text-ikincil/30 mb-4 block">
          search_off
        </span>
        <h4 className="font-haber text-lg font-semibold text-ana mb-2">
          {t("eslesmeYok")}
        </h4>
        <p className="text-sm text-ikincil/70 max-w-md mx-auto">
          {t("eslesmeYokAciklama")}
        </p>
      </div>
    );
  }

  const sayfalar = Array.from({ length: sayfaSayisi }, (_, i) => i + 1);

  return (
    <div className={className}>
      {gosterToplam && (
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-sm text-ikincil/80 font-medium">
            {t("ilanListeleniyor", { adet: toplam })}
          </p>
        </div>
      )}
      <div className="flex flex-col gap-4">
        {gosterilecek.map((ilan) => (
          <IlanKartı key={ilan.slug} ilan={ilan} />
        ))}
      </div>

      {sayfala && sayfaSayisi > 1 && (
        <nav
          className="flex items-center justify-center gap-1.5 pt-2"
          aria-label={t("sayfalamaEtiketi")}
        >
          <button
            type="button"
            className={sayfaDugmesi}
            onClick={() => setSayfa((s) => Math.max(1, s - 1))}
            disabled={aktifSayfa === 1}
            aria-label={g("onceki")}
          >
            <span className="msimge">chevron_left</span>
          </button>
          {sayfalar.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSayfa(s)}
              className={sb(
                sayfaDugmesi,
                s === aktifSayfa && "sayfalama-aktif"
              )}
              aria-current={s === aktifSayfa ? "page" : undefined}
            >
              {s}
            </button>
          ))}
          <button
            type="button"
            className={sayfaDugmesi}
            onClick={() => setSayfa((s) => Math.min(sayfaSayisi, s + 1))}
            disabled={aktifSayfa === sayfaSayisi}
            aria-label={g("sonraki")}
          >
            <span className="msimge">chevron_right</span>
          </button>
        </nav>
      )}
    </div>
  );
}
