import Link from "next/link";
import type { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import { siniflariBirlestir as sb } from "@/lib/yardimcilar/sinif-yardimcisi";

type Varyant = "ikincil" | "ana" | "tersiyer" | "kristal" | "metinsel" | "silinmis";
type Boyut = "xs" | "sm" | "md" | "lg" | "blok";

type TemelOzellikler = {
  varyant?: Varyant;
  boyut?: Boyut;
  ikon?: ReactNode;
  ikonSonunda?: ReactNode;
  doluIkon?: boolean;
  yukleniyor?: boolean;
  sinif?: string;
};

type ButonOzellikleri = TemelOzellikler &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    tur: "buton";
  };

type BaglantiOzellikleri = TemelOzellikler &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    tur: "baglanti";
    href: string;
    disKonum?: boolean;
  };

type Ozellikler = ButonOzellikleri | BaglantiOzellikleri;

const varyantSınıfı: Record<Varyant, string> = {
  // Secondary (varsayılan): Mineral tabanlı, düşük görsel ağırlık
  ikincil: "buton-ikincil",
  // Primary (NADİR): Bedford tabanlı; yalnızca kritik CTA'lar
  ana: "buton-ana",
  // Tertiary: Cam/yarı saydam, yüzen kontroller
  tersiyer: "buton-tersiyer",
  // Crystal: Nadir premium eylemler
  kristal: "buton-kristal",
  // Metin: Yalnızca tipografi
  metinsel: "buton-metinsel",
  // Silinmis: Yıkıcı/nötr geri alma eylemleri (filtre sıfırla vb.)
  silinmis: "buton-silinmis"
};

const boyutSınıfı: Record<Boyut, string> = {
  xs: "px-2 py-1 text-xs",
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
  blok: "px-6 py-3 text-base w-full"
};

function govde(oz: TemelOzellikler, icerik: ReactNode): ReactNode {
  const { ikon, ikonSonunda, doluIkon, yukleniyor } = oz;
  return (
    <>
      {yukleniyor ? (
        <span className="msimge animate-spin" aria-hidden="true">
          progress_activity
        </span>
      ) : null}
      {!yukleniyor && ikon ? (
        <span className={doluIkon ? "msimge msimge-dolu" : "msimge"} aria-hidden="true">
          {ikon}
        </span>
      ) : null}
      {icerik}
      {!yukleniyor && ikonSonunda ? (
        <span className={doluIkon ? "msimge msimge-dolu rtl:-scale-x-100" : "msimge rtl:-scale-x-100"} aria-hidden="true">
          {ikonSonunda}
        </span>
      ) : null}
    </>
  );
}

export default function Buton(ozellikler: Ozellikler) {
  if (ozellikler.tur === "baglanti") {
    const {
      tur,
      varyant,
      boyut,
      ikon,
      ikonSonunda,
      doluIkon,
      yukleniyor,
      sinif,
      href,
      disKonum,
      className,
      children,
      ...kalan
    } = ozellikler;

    const birlesikSinif = sb(
      varyantSınıfı[varyant ?? "ikincil"],
      boyut && boyut !== "md" ? boyutSınıfı[boyut] : "",
      yukleniyor && "pointer-events-none opacity-80",
      className,
      sinif
    );

    if (disKonum ?? href.startsWith("http")) {
      return (
        <a
          {...kalan}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className={birlesikSinif}
          aria-busy={yukleniyor || undefined}
        >
          {govde(ozellikler, children)}
        </a>
      );
    }

    return (
      <Link {...kalan} href={href} className={birlesikSinif} aria-busy={yukleniyor || undefined}>
        {govde(ozellikler, children)}
      </Link>
    );
  }

  const {
    tur,
    varyant,
    boyut,
    ikon,
    ikonSonunda,
    doluIkon,
    yukleniyor,
    sinif,
    className,
    children,
    disabled,
    ...kalan
  } = ozellikler;

  const birlesikSinif = sb(
    varyantSınıfı[varyant ?? "ikincil"],
    boyut && boyut !== "md" ? boyutSınıfı[boyut] : "",
    yukleniyor && "pointer-events-none opacity-80",
    className,
    sinif
  );

  return (
    <button
      {...kalan}
      className={birlesikSinif}
      disabled={disabled || yukleniyor}
      aria-busy={yukleniyor || undefined}
    >
      {govde(ozellikler, children)}
    </button>
  );
}
