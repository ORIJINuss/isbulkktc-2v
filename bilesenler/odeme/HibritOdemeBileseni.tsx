"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/yonlendirme";
import { ISVEREN_PAKETLERI } from "@/lib/sabitler/isveren-paketleri";
import { paraFormatla } from "@/lib/yardimcilar/bicimlendiriciler";
import { sb } from "@/lib/yardimcilar/sinif-yardimcisi";
import Rozet from "@/bilesenler/genel/Rozet";

type PaketEtiketi =
  | "tekIlan"
  | "baslangicPaket"
  | "profesyonelPaket"
  | "kurumsalPaket";
type PaketAciklamasi =
  | "tekIlanAciklama"
  | "baslangicPaketAciklama"
  | "profesyonelPaketAciklama"
  | "kurumsalPaketAciklama";

export type Paket = {
  id: string;
  etiketAnahtari: PaketEtiketi;
  aciklamaAnahtari: PaketAciklamasi;
  fiyatTRY: number;
  ilanKredisi: number | null;
  sureGun: number;
  onerilen?: boolean;
};

type SirketSecenegi = { id: string; ad: string };

const VARSAYILAN_PAKETLER: Paket[] = [
  {
    id: ISVEREN_PAKETLERI.tekIlan.code,
    etiketAnahtari: "tekIlan",
    aciklamaAnahtari: "tekIlanAciklama",
    fiyatTRY: ISVEREN_PAKETLERI.tekIlan.fiyatTRY,
    ilanKredisi: ISVEREN_PAKETLERI.tekIlan.ilanKredisi,
    sureGun: ISVEREN_PAKETLERI.tekIlan.sureGun,
  },
  {
    id: ISVEREN_PAKETLERI.baslangic.code,
    etiketAnahtari: "baslangicPaket",
    aciklamaAnahtari: "baslangicPaketAciklama",
    fiyatTRY: ISVEREN_PAKETLERI.baslangic.fiyatTRY,
    ilanKredisi: ISVEREN_PAKETLERI.baslangic.ilanKredisi,
    sureGun: ISVEREN_PAKETLERI.baslangic.sureGun,
  },
  {
    id: ISVEREN_PAKETLERI.profesyonel.code,
    etiketAnahtari: "profesyonelPaket",
    aciklamaAnahtari: "profesyonelPaketAciklama",
    fiyatTRY: ISVEREN_PAKETLERI.profesyonel.fiyatTRY,
    ilanKredisi: ISVEREN_PAKETLERI.profesyonel.ilanKredisi,
    sureGun: ISVEREN_PAKETLERI.profesyonel.sureGun,
    onerilen: true,
  },
  {
    id: ISVEREN_PAKETLERI.kurumsal.code,
    etiketAnahtari: "kurumsalPaket",
    aciklamaAnahtari: "kurumsalPaketAciklama",
    fiyatTRY: ISVEREN_PAKETLERI.kurumsal.fiyatTRY,
    ilanKredisi: ISVEREN_PAKETLERI.kurumsal.ilanKredisi,
    sureGun: ISVEREN_PAKETLERI.kurumsal.sureGun,
  },
];

function hataMesajiniOku(veri: unknown): string | null {
  if (
    typeof veri === "object" &&
    veri !== null &&
    "hata" in veri &&
    typeof veri.hata === "string"
  ) {
    return veri.hata;
  }
  return null;
}

function sirketleriOku(veri: unknown): SirketSecenegi[] {
  if (
    typeof veri !== "object" ||
    veri === null ||
    !("sirketler" in veri) ||
    !Array.isArray(veri.sirketler)
  ) {
    throw new Error("Şirket listesi yanıtı geçersiz.");
  }

  return veri.sirketler.map((sirket: unknown) => {
    if (
      typeof sirket !== "object" ||
      sirket === null ||
      !("id" in sirket) ||
      typeof sirket.id !== "string" ||
      !("ad" in sirket) ||
      typeof sirket.ad !== "string"
    ) {
      throw new Error("Şirket listesi yanıtı geçersiz.");
    }
    return { id: sirket.id, ad: sirket.ad };
  });
}

function checkoutUrliniOku(veri: unknown): string {
  if (
    typeof veri !== "object" ||
    veri === null ||
    !("checkout" in veri) ||
    typeof veri.checkout !== "object" ||
    veri.checkout === null ||
    !("checkoutUrl" in veri.checkout) ||
    typeof veri.checkout.checkoutUrl !== "string" ||
    !URL.canParse(veri.checkout.checkoutUrl) ||
    new URL(veri.checkout.checkoutUrl).protocol !== "https:"
  ) {
    throw new Error("Ödeme sağlayıcısı yanıtı geçersiz.");
  }
  return veri.checkout.checkoutUrl;
}

export default function HibritOdemeBileseni({
  paketler = VARSAYILAN_PAKETLER,
  sinif,
}: {
  paketler?: Paket[];
  sinif?: string;
}) {
  const yerel = useLocale();
  const t = useTranslations("ilanPaketleri");
  const [seciliPaketId, setSeciliPaketId] = useState<string>(
    ISVEREN_PAKETLERI.baslangic.code
  );
  const [sirketler, setSirketler] = useState<SirketSecenegi[] | null>(null);
  const [sirketId, setSirketId] = useState("");
  const [hesapGerekli, setHesapGerekli] = useState<"giris" | "kayit" | null>(
    null
  );
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, setIslemde] = useState(false);
  const idempotencyKey = useRef<string | null>(null);

  const secili = paketler.find((p) => p.id === seciliPaketId) ?? paketler[0];

  async function odemeyeGec() {
    if (islemde) return;
    setHata(null);
    setHesapGerekli(null);
    setIslemde(true);

    try {
      let kullanilabilirSirketler = sirketler;
      if (kullanilabilirSirketler === null) {
        const yanit = await fetch("/api/odeme/checkout", {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const veri: unknown = await yanit.json();
        if (!yanit.ok) {
          if (yanit.status === 401) {
            setHesapGerekli("giris");
            return;
          }
          if (yanit.status === 403) {
            setHesapGerekli("kayit");
            return;
          }
          throw new Error(hataMesajiniOku(veri) ?? t("odemeHatasi"));
        }
        kullanilabilirSirketler = sirketleriOku(veri);
        setSirketler(kullanilabilirSirketler);
      }

      if (kullanilabilirSirketler.length === 0) {
        setHesapGerekli("kayit");
        setHata(t("sirketBulunamadi"));
        return;
      }

      const seciliSirketId =
        sirketId ||
        (kullanilabilirSirketler.length === 1
          ? kullanilabilirSirketler[0].id
          : "");
      if (!seciliSirketId) return;

      idempotencyKey.current ??= window.crypto.randomUUID();
      const yanit = await fetch("/api/odeme/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: seciliSirketId,
          packageCode: secili.id,
          idempotencyKey: idempotencyKey.current,
          locale: yerel,
        }),
      });
      const veri: unknown = await yanit.json();
      if (!yanit.ok) {
        throw new Error(hataMesajiniOku(veri) ?? t("odemeHatasi"));
      }
      window.location.assign(checkoutUrliniOku(veri));
    } catch (error) {
      setHata(error instanceof Error ? error.message : t("odemeHatasi"));
    } finally {
      setIslemde(false);
    }
  }

  if (!secili) {
    throw new Error("Ödeme paketleri boş olamaz.");
  }

  return (
    <div className={sb("grid gap-6 lg:grid-cols-[1.4fr_1fr]", sinif)}>
      <div className="grid gap-3 sm:grid-cols-2">
        {paketler.map((paket) => {
          const seciliMi = paket.id === secili.id;
          return (
            <button
              key={paket.id}
              type="button"
              aria-pressed={seciliMi}
              onClick={() => {
                setSeciliPaketId(paket.id);
                idempotencyKey.current = null;
              }}
              className={sb(
                "relative overflow-hidden rounded-2xl border-2 p-5 text-start transition-all",
                seciliMi
                  ? "border-ana bg-beyaz shadow-mineral-yukseltilmis"
                  : "mineral-kart border-ana-outline/30 hover:border-ana-outline/70"
              )}
            >
              {paket.onerilen && (
                <div className="absolute end-3 top-3">
                  <Rozet tur="altin" kucuk ikon="workspace_premium">
                    {t("enCokTercih")}
                  </Rozet>
                </div>
              )}
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-ikincil/50">
                {t("etiket")}
              </div>
              <h3 className="mt-1 font-haber text-lg font-bold leading-tight text-ana">
                {t(paket.etiketAnahtari)}
              </h3>
              <p className="mt-1 min-h-8 text-[11px] leading-snug text-ikincil/70">
                {t(paket.aciklamaAnahtari)}
              </p>
              <div className="mt-4 font-haber text-3xl font-black tabular-nums text-ana">
                {paraFormatla(paket.fiyatTRY, "TRY")}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-semibold text-ikincil/70">
                <div className="rounded-lg bg-ikincil-kapsayici/60 p-2 text-center">
                  <div className="font-haber text-lg font-black tabular-nums text-ana">
                    {paket.ilanKredisi === null ? "∞" : paket.ilanKredisi}
                  </div>
                  {t("krediIlan")}
                </div>
                <div className="rounded-lg bg-ikincil-kapsayici/60 p-2 text-center">
                  <div className="font-haber text-lg font-black tabular-nums text-ana">
                    {paket.sureGun}
                    {" "}{t("gun")}
                  </div>
                  {t("paketSuresi")}
                </div>
              </div>
              <p className="mt-3 text-[11px] font-semibold text-ikincil/70">
                {t("ilanYayinSuresi")}
              </p>
            </button>
          );
        })}
      </div>

      <aside className="mineral-kart self-start rounded-2xl p-5 lg:sticky lg:top-28">
        <h3 className="font-haber text-lg font-bold text-ana">
          {t("siparisOzeti")}
        </h3>
        <div className="mt-4 flex items-start justify-between gap-4 border-b border-ana-outline/30 pb-4">
          <div>
            <div className="font-semibold text-ikincil">
              {t(secili.etiketAnahtari)}
            </div>
            <div className="mt-1 text-xs text-ikincil/65">
              {t("tekSeferlikOdeme")}
            </div>
          </div>
          <div className="font-haber text-xl font-black tabular-nums text-ana">
            {paraFormatla(secili.fiyatTRY, "TRY")}
          </div>
        </div>

        {sirketler && sirketler.length > 1 && (
          <label className="mt-4 block">
            <span className="girdiEtiket">{t("sirketSecimi")}</span>
            <select
              className="girdi w-full"
              value={sirketId}
              onChange={(event) => {
                setSirketId(event.target.value);
                idempotencyKey.current = null;
              }}
            >
              <option value="">—</option>
              {sirketler.map((sirket) => (
                <option key={sirket.id} value={sirket.id}>
                  {sirket.ad}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          type="button"
          disabled={islemde || Boolean(sirketler?.length && sirketler.length > 1 && !sirketId)}
          aria-busy={islemde}
          onClick={odemeyeGec}
          className="buton-ana mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
        >
          {islemde ? t("odemeYukleniyor") : t("odemeBaslat")}
        </button>

        {hesapGerekli && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ana-kapsayici/60 p-3 text-xs text-ikincil">
            <span>
              {hesapGerekli === "giris" ? t("girisGerekli") : t("kayitGerekli")}
            </span>
            <Link
              className="font-bold text-ana underline-offset-2 hover:underline"
              href={hesapGerekli === "giris" ? "/giris" : "/isveren/sirket-kaydi"}
            >
              {hesapGerekli === "giris" ? t("girisYap") : t("isverenKaydi")}
            </Link>
          </div>
        )}
        {hata && (
          <p role="alert" className="mt-3 rounded-xl bg-hata-kapsayici/40 p-3 text-xs font-semibold text-hata-900">
            {hata}
          </p>
        )}
      </aside>
    </div>
  );
}
