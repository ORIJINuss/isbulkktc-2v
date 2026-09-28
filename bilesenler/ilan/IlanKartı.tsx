"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/yonlendirme";
import Rozet from "@/bilesenler/genel/Rozet";
import Buton from "@/bilesenler/genel/Buton";
import type { Ilan } from "@/lib/veri/ilan-tipi";
import {
  CALISMA_SEKILLERI,
  IZIN_TIPLERI,
  KKTC_ILLER,
  PARA_BIRIMLERI,
  YAN_HAKLAR,
} from "@/lib/sabitler/alan-degiskenleri";
import {
  paraFormatla,
  gunBazliNeKadarOnce,
} from "@/lib/yardimcilar/bicimlendiriciler";
import { siniflariBirlestir as sb } from "@/lib/yardimcilar/sinif-yardimcisi";

type Props = {
  ilan: Ilan;
  kapsayiciSınıfı?: string;
};

const ilcelerEtiketi = (ilan: Ilan): string => {
  if (ilan.ilceler && ilan.ilceler.length > 0) {
    const etiketler = ilan.ilceler
      .map((kod) => KKTC_ILLER.find((i) => i.deger === kod)?.etiket)
      .filter((e) => e !== undefined) as string[];
    if (etiketler.length > 0) return etiketler.join(", ");
  }
  return ilan.ilce ?? "KKTC Geneli";
};

const calismaSekliEtiketi = (ilan: Ilan): string => {
  const ana = CALISMA_SEKILLERI.find(
    (s) => s.deger === ilan.calismaSekli
  )?.etiket;
  const modelAciklama =
    ilan.calismaModeli === "HIBRIT"
      ? "Hibrit"
      : ilan.calismaModeli === "UZAKTAN"
        ? "Uzaktan"
        : "Ofiste";
  const ek = ana ? ` · ${modelAciklama}` : modelAciklama;
  return (ana ?? "Tam Zamanlı") + ek;
};

const izinEtiketi = (ilan: Ilan): { kisaltma: string; renk: string } => {
  const ilk = (ilan.izinTipleri ?? [])[0];
  const kayit = IZIN_TIPLERI.find((z) => z.deger === ilk);
  if (kayit) return { kisaltma: kayit.kisaltma, renk: kayit.renkSinifi };
  if (ilan.izinKisaltma)
    return { kisaltma: ilan.izinKisaltma, renk: "rozet-ana" };
  return { kisaltma: "İzin Durumu", renk: "rozet-ikincil" };
};

const izinOnaysizMi = (ilan: Ilan): boolean => {
  const tipler = ilan.izinTipleri ?? [];
  const eski = ilan.calismaIzniTipiKodu;
  return (
    tipler.includes("VATANDAS") ||
    tipler.includes("YOK") ||
    eski === "VATANDAS" ||
    eski === "YOK"
  );
};

const yanHakEtiketleri = (ilan: Ilan, sinir: number): string[] => {
  const hammadde = ilan.yanHaklar ?? [];
  return (
    hammadde
      .map((kod) => YAN_HAKLAR.find((y) => y.deger === kod)?.etiket)
      .filter((e) => e !== undefined) as string[]
  ).slice(0, sinir);
};

const paraSembol = (kod: Ilan["maasAraligi"]["para"]): string =>
  PARA_BIRIMLERI.find((p) => p.deger === kod)?.sembol ?? "£";

export default function IlanKartı({ ilan, kapsayiciSınıfı }: Props) {
  const t = useTranslations("genel");
  const [kaydedildi, setKaydedildi] = useState(false);
  const [paylasildi, setPaylasildi] = useState(false);

  const { ilcelerMetin, sekilEtiket, izinBilgi } = useMemo(() => {
    return {
      ilcelerMetin: ilcelerEtiketi(ilan),
      sekilEtiket: calismaSekliEtiketi(ilan),
      izinBilgi: izinEtiketi(ilan),
    };
  }, [ilan]);

  const { maasMin, maasMak, maasPara, maasGizli } = useMemo(() => {
    if (ilan.maasAraligi) {
      return {
        maasMin: ilan.maasAraligi.min,
        maasMak: ilan.maasAraligi.mak,
        maasPara: ilan.maasAraligi.para,
        maasGizli: ilan.maasAraligi.gizli,
      };
    }
    const eskiMin = ilan.minNetAylik ?? 0;
    const eskiMak = ilan.makNetAylik ?? 0;
    const eskiPara: Ilan["maasAraligi"]["para"] = ilan.paraBirimi ?? "GBP";
    return {
      maasMin: eskiMin,
      maasMak: eskiMak,
      maasPara: eskiPara,
      maasGizli: eskiMin <= 0 && eskiMak <= 0,
    };
  }, [ilan]);

  function toggleKaydet() {
    setKaydedildi((k) => !k);
  }

  async function paylas() {
    const url = typeof window !== "undefined" ? window.location.href : "/";
    const text = `${ilan.pozisyonBasligi} — ${ilan.sirketAdi}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: text, text, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setPaylasildi(true);
        setTimeout(() => setPaylasildi(false), 1500);
      }
    } catch {
      /* kullanıcı iptal etti, hata gösterme */
    }
  }

  const maasAltMetin = maasGizli
    ? "Net Maaş · Görüşülebilir"
    : `Net Aylık · ${
        PARA_BIRIMLERI.find((p) => p.deger === maasPara)?.etiket ?? maasPara
      }`;

  return (
    <article
      className={sb(
        "mineral-kart rounded-3xl p-5 md:p-6 group relative overflow-hidden",
        kapsayiciSınıfı
      )}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-etiket-sm  font-bold tracking-wide text-ana bg-ana-sabit/40 px-2.5 py-0.5 rounded-lg">
              {ilan.sirketKodu} · {ilan.sirketAdi}
            </span>
            <span className="text-govde-xs text-hüküm-sonuk inline-flex items-center gap-1">
              <span className="msimge text-[14px]">location_on</span>
              {ilcelerMetin}
            </span>
            {izinOnaysizMi(ilan) ? (
              <Rozet tur="basari" kucuk ikon="check_circle">
                {izinBilgi.kisaltma}
              </Rozet>
            ) : (
              <Rozet
                tur={
                  izinBilgi.renk === "rozet-basari"
                    ? "basari"
                    : izinBilgi.renk === "rozet-hata"
                      ? "hata"
                      : izinBilgi.renk === "rozet-altin"
                        ? "altin"
                        : izinBilgi.renk === "rozet-tersiyer"
                          ? "tersiyer"
                          : izinBilgi.renk === "rozet-ikincil"
                            ? "ikincil"
                            : "ana"
                }
                kucuk
                ikon="badge"
              >
                {izinBilgi.kisaltma}
              </Rozet>
            )}
          </div>

          <Link
            href={{ pathname: "/ilan/[slug]", params: { slug: ilan.slug } }}
            className="block group/link"
          >
            <h3 className="text-baslik-lg  font-bold text-ana group-hover/link:text-yüzey-usta transition-colors leading-snug">
              {ilan.pozisyonBasligi}
            </h3>
          </Link>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Rozet tur="ozel-mineral" kucuk>
              {sekilEtiket}
            </Rozet>
            {yanHakEtiketleri(ilan, 3).map((hak) => (
              <span
                key={hak}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-yüzey-kapsayici text-govde-xs text-yüzey-uzerinde border border-cizgi-degisken/70 font-medium"
              >
                {hak}
              </span>
            ))}
            <span className="text-govde-xs text-hüküm-sonuk ms-1">
              {gunBazliNeKadarOnce(new Date(ilan.yayinTarihi))}
            </span>
          </div>
        </div>

        <div className="flex md:flex-col items-end justify-between md:items-end md:text-end gap-4 md:gap-3 shrink-0 md:border-t-0 border-t border-cizgi-degisken/40 pt-3 md:pt-0 md:ps-4 md:border-s md:border-s-cizgi-degisken/40">
          <div>
            <p className="text-baslik-md  font-bold text-ana leading-tight">
              {maasGizli ? (
                "Görüşülebilir"
              ) : (
                <>
                  {paraFormatla(maasMin, maasPara)} -{" "}
                  {paraFormatla(maasMak, maasPara)}
                </>
              )}
            </p>
            <p className="text-govde-xs text-hüküm-sonuk mt-0.5">
              {maasAltMetin}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={kaydedildi ? t("kaydedildi") : t("ilanKaydet")}
              onClick={toggleKaydet}
              className="p-2 rounded-xl border border-cizgi-degisken hover:bg-yüzey-kapsayici text-yüzey-uzerinde/70 hover:text-ana transition-colors"
              title={t("ilanKaydet")}
            >
              <span
                className={sb(
                  "msimge text-[20px]",
                  kaydedildi ? "msimge-dolu text-ana" : ""
                )}
              >
                {kaydedildi ? "bookmark_added" : "bookmark"}
              </span>
            </button>
            <button
              type="button"
              aria-label={t("paylas")}
              onClick={paylas}
              className={sb(
                "p-2 rounded-xl border border-cizgi-degisken hover:bg-yüzey-kapsayici transition-colors",
                paylasildi
                  ? "text-ana bg-ana-sabit/30 border-ana/30"
                  : "text-yüzey-uzerinde/70 hover:text-ana"
              )}
              title={t("paylas")}
            >
              <span className="msimge text-[20px]">
                {paylasildi ? "check" : "share"}
              </span>
            </button>
            <Buton
              tur="baglanti"
              varyant="ana"
              href={`/ilan/${ilan.slug}`}
              ikonSonunda="arrow_forward"
            >
              {t("hemenBasvur")}
            </Buton>
          </div>
        </div>
      </div>
    </article>
  );
}
