import { siniflariBirlestir as sb } from "@/lib/yardimcilar/sinif-yardimcisi";

interface LogoProps {
  /**
   * Genişlik/Yükseklik ölçüsü veya Tailwind sınıfı
   * Örn: 'sm' (24px), 'md' (32px), 'lg' (40px), 'xl' (48px)
   */
  boyut?: "sm" | "md" | "lg" | "xl" | number;
  /**
   * Sadece sembol (monogram) mü yoksa marka adıyla birlikte mi?
   */
  yalnizcaSembol?: boolean;
  sembolGosterilsin?: boolean;
  /**
   * Sembol stili:
   * - "varsayilan": Koyu yeşil zemin, krem geometrik sembol
   * - "acik": Krem zemin, koyu yeşil geometrik sembol
   * - "saydam": Arka plansız doğrudan geometrik vektör
   */
  tema?: "varsayilan" | "acik" | "saydam";
  /**
   * Ekstra kapsayıcı CSS sınıfı
   */
  sinif?: string;
  /**
   * Metin için ekstra CSS sınıfı
   */
  metinSinif?: string;
  /**
   * Wordmark metni. Yerelleştirme yapan çağıranlar `meta.markaAdiKisa`
   * çeviri anahtarını buraya geçirir; varsayılan kaynak dildir.
   */
  markaMetni?: string;
}

const BOYUTLAR: Record<string, { kutu: string; piksel: number }> = {
  sm: { kutu: "w-6 h-6 rounded-lg", piksel: 24 },
  md: { kutu: "w-8 h-8 rounded-xl", piksel: 32 },
  lg: { kutu: "w-10 h-10 rounded-2xl", piksel: 40 },
  xl: { kutu: "w-12 h-12 rounded-2xl", piksel: 48 },
};

/**
 * İşBulKKTC marka bileşeni.
 * İş ve bağlantı fikrini taşıyan, iki parçalı özgün monogramı ve wordmark'ı render eder.
 */
export default function Logo({
  boyut = "md",
  yalnizcaSembol = false,
  sembolGosterilsin = true,
  tema = "varsayilan",
  sinif,
  metinSinif,
  markaMetni = "İş Bul",
}: LogoProps) {
  const boyutAyar = typeof boyut === "string" ? BOYUTLAR[boyut] ?? BOYUTLAR.md : null;
  const ozelPiksel = typeof boyut === "number" ? boyut : undefined;

  const bgRenk =
    tema === "varsayilan"
      ? "bg-[#2c4134] text-[#f7f5ed]"
      : tema === "acik"
        ? "bg-[#f7f5ed] text-[#2c4134] border border-[#2c4134]/15"
        : "text-[#2c4134]";

  const sembolDolgu =
    tema === "varsayilan"
      ? "#f7f5ed"
      : "#2c4134";

  return (
    <span
      className={sb(
        "inline-flex items-center gap-2 shrink-0 select-none",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-ana/40 focus-within:ring-offset-2 focus-within:ring-offset-yüzey",
        sinif
      )}
      aria-label={markaMetni}
    >
      {sembolGosterilsin && (
        <span
          style={ozelPiksel ? { width: ozelPiksel, height: ozelPiksel } : undefined}
          className={sb(
            "inline-flex items-center justify-center shrink-0 overflow-hidden shadow-editoriyel-kart transition-transform duration-200",
            boyutAyar?.kutu,
            bgRenk
          )}
          aria-hidden="true"
        >
          <svg
            viewBox="450 480 1150 1100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full p-[14%]"
          >
            <path
              fill={sembolDolgu}
              d="M522 544h210c92 0 158 49 158 126 0 47-24 84-64 105 55 17 92 58 92 116 0 85-72 139-181 139H522V544Zm124 104v141h77c47 0 72-25 72-71 0-45-27-70-76-70h-73Zm0 245v137h91c53 0 83-25 83-69 0-45-30-68-85-68h-89Z"
            />
            <path
              fill={sembolDolgu}
              d="M1162 544h124v486h-124V544Z"
            />
            <path
              fill={sembolDolgu}
              d="M1247 544h112l167 486h-130l-31-101h-157l-30 101h-128l197-486Zm-7 282h93l-46-154-47 154Z"
            />
          </svg>
        </span>
      )}
      {!yalnizcaSembol && (
        <span
          className={sb(
            "inline-flex min-w-0 flex-col items-start whitespace-nowrap font-extrabold tracking-tight text-ana leading-[0.95]",
            metinSinif ?? "text-baslik-md "
          )}
        >
          <span>{markaMetni}</span>
          <span className="text-[#3b6b55]">KKTC</span>
        </span>
      )}
    </span>
  );
}
