import type { ReactNode, HTMLAttributes } from "react";
import { siniflariBirlestir as sb } from "@/lib/yardimcilar/sinif-yardimcisi";

type Seviye = "mineral" | "cam" | "kristal";

type KartOzellikleri = HTMLAttributes<HTMLDivElement> & {
  seviye?: Seviye;
  baslikKismi?: ReactNode;
  altKismi?: ReactNode;
};

const seviyeSınıfı: Record<Seviye, string> = {
  // Level 1: Mineral - Dense product UI, nearly opaque, hairline border, soft shadow
  mineral: "mineral-kart",
  // Level 2: Glass/Cam - Job cards, floating controls, translucent, layered gradient
  cam: "camsi-kart",
  // Level 3: Crystal/Kristal - Featured/premium, rare, conic-gradient with Bedford
  kristal: "kristal-kart"
};

export default function Kart({
  seviye = "mineral",
  baslikKismi,
  altKismi,
  className,
  children,
  ...kalan
}: KartOzellikleri) {
  const birlesikSinif = sb(seviyeSınıfı[seviye], "rounded-xl p-6", className);

  return (
    <div className={birlesikSinif} {...kalan}>
      {baslikKismi && <div className="mb-4">{baslikKismi}</div>}
      <div>{children}</div>
      {altKismi && <div className="mt-4 border-t border-mineral-200 pt-4">{altKismi}</div>}
    </div>
  );
}
