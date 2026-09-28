import type { ReactNode } from "react";
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
  return (
    <span className={sb(turSiniflari[tur], kucuk ? "px-2 py-0.5 text-xs" : "", className, sinif)}>
      {doluNokta ? <span className="me-1 inline-block h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {ikon ? <span className="msimge text-sm">{ikon}</span> : null}
      {children}
    </span>
  );
}
