import Image from "next/image";

export type Ikon3DTuru =
  | "arama"
  | "bolge"
  | "evrak"
  | "finans"
  | "konaklama"
  | "teknoloji"
  | "insaat"
  | "egitim"
  | "perakende"
  | "takvim"
  | "bildirim"
  | "dogrulandi";

const VARLIKLAR: Record<Ikon3DTuru, string> = {
  arama: "/3d-icons/search-glass.png",
  bolge: "/3d-icons/earth-globe.png",
  evrak: "/3d-icons/briefcase.png",
  finans: "/3d-icons/credit-card.png",
  konaklama: "/3d-icons/hotel-bell.png",
  teknoloji: "/3d-icons/computer-terminal.png",
  insaat: "/3d-icons/construction-helmet.png",
  egitim: "/3d-icons/graduation-cap.png",
  perakende: "/3d-icons/shopping-cart.png",
  takvim: "/3d-icons/calendar.png",
  bildirim: "/3d-icons/notification-bell.png",
  dogrulandi: "/3d-icons/verified-check.png",
};

const SEMBOL_ESLESMESI: Partial<Record<string, Ikon3DTuru>> = {
  search: "arama",
  search_off: "arama",
  travel_explore: "bolge",
  language: "bolge",
  place: "bolge",
  location_on: "bolge",
  person_pin: "bolge",
  work_outline: "evrak",
  business_center: "evrak",
  credit_card: "finans",
  paid: "finans",
  savings: "finans",
  calendar_month: "takvim",
  notifications: "bildirim",
  notifications_active: "bildirim",
  notifications_off: "bildirim",
  hotel: "konaklama",
  terminal: "teknoloji",
  construction: "insaat",
  school: "egitim",
  shopping_cart: "perakende",
};

export function ikon3DTuruBul(sembol: string): Ikon3DTuru | undefined {
  return SEMBOL_ESLESMESI[sembol];
}

export default function Ikon3D({
  tur,
  boyut = 24,
  className = "",
  priority = false,
}: {
  tur: Ikon3DTuru;
  boyut?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={VARLIKLAR[tur]}
      alt=""
      aria-hidden="true"
      width={boyut}
      height={boyut}
      priority={priority}
      sizes={`${boyut}px`}
      style={{ width: boyut, height: boyut, minWidth: boyut }}
      className={`ikon-3d shrink-0 ${className}`}
    />
  );
}
