import type { ReactNode } from "react";
import Ikon3D, { ikon3DTuruBul } from "@/bilesenler/genel/Ikon3D";
import { siniflariBirlestir as sb } from "@/lib/yardimcilar/sinif-yardimcisi";

type Tur = "ana" | "ikincil" | "tersiyer" | "basari" | "hata" | "bilgi" | "altin" | "ozel-mineral";

const turSiniflari: Record<Tur, string> = {
  ana: "rozet-ana",
  ikincil: "rozet-ikincil",
  tersiyer: "rozet-tersiyer",
  basari: "rozet-basari",
  hata: "rozet-hata",
  bilgi: "rozet-bilgi",
  altin: "rozet-altin",
  "ozel-mineral": "rozet-ozel-mineral"
};

export default function Rozet({
  tur = "ikincil",
  ikon,
  children,
  className,
  sinif,
  kucuk = false,
  doluNokta = false
}: {
  tur?: Tur;
  ikon?: ReactNode;
  children: ReactNode;
  className?: string;
  sinif?: string;
  kucuk?: boolean;
  doluNokta?: boolean;
}) {
  const ikon3DTuru = typeof ikon === "string" ? ikon3DTuruBul(ikon) : undefined;

  return (
    <span className={sb(turSiniflari[tur], kucuk ? "px-2 py-0.5 text-xs" : "", className, sinif)}>
      {doluNokta ? <span className="me-1 inline-block h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {ikon3DTuru ? (
        <Ikon3D tur={ikon3DTuru} boyut={16} className="ikon-3d--rozet" />
      ) : ikon ? (
        <span className="msimge text-sm" aria-hidden="true">{ikon}</span>
      ) : null}
      {children}
    </span>
  );
}
