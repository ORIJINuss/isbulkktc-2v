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
 * İşBulKKTC Resmi Logo Bileşeni
 * Yeni geometrik marka sembolünü (İ-B harflerini stilize eden ikili rounded üçgen kanat)
 * ve marka tipografisini responsive ve erişilebilir olarak render eder.
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
        "inline-flex items-center gap-2.5 shrink-0 select-none",
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
            viewBox="0 0 2048 2048"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full p-[14%]"
          >
            {/* Sol Geometrik Kanat */}
            <path
              fill={sembolDolgu}
              d="M698.199 684.378c39.134-2.542 59.457 19.751 86.681 43.419l62.698 54.483L956.8 876.62c14.919 12.898 29.908 25.765 44.78 38.716 3.64 3.177 15.34 12.29 15.41 16.192-4.53 6.588-17.615 9.246-24.595 13.314-62.696 36.542-59.16 133.988 8.095 163.078 5.53 2.39 14.45 4.48 17 9.95-.17.73-.35 1.46-.52 2.19-30.591 27.65-109.896 96.29-137.218 120.14l-83.627 72.69c-11.458 9.96-36.167 32.47-48.291 39.73a84.4 84.4 0 0 1-32.77 11.17 81.4 81.4 0 0 1-61.008-16.83c-19.698-15.28-34.82-40.27-36.606-64.89-2.09-28.83-1.199-60.87-1.165-90.03l.037-171.81.042-172.095c-.003-9.435-.09-19.087-.05-28.353.161-37-4.681-70.218 20.573-101.145 16.67-20.415 34.943-31.083 61.312-34.259"
            />
            {/* Sağ Geometrik Kanat */}
            <path
              fill={sembolDolgu}
              d="M1339.33 684.306a85.18 85.18 0 0 1 56.83 18.815c22.97 18.269 36.64 47.985 35.95 76.972-.16 6.369.02 12.874.02 19.258l-.05 55.384-.05 183.055.03 165.05c-.01 16.35 1.03 65.21-.84 79.72a98.83 98.83 0 0 1-21.38 49.82c-15.09 18.28-36.47 29.99-60.1 32.13-42.2 3.81-72.08-29.9-101.06-55.41a4485 4485 0 0 0-72.87-62.79c-47.61-42.72-96.98-83.65-144.22-126.76-.11-.61-.21-1.22-.32-1.83 4.11-6.53 19.4-9.66 26.23-13.82 4.5-2.74 8.35-5.58 12.3-9.07a92.01 92.01 0 0 0 31.36-64.03c1.95-34.103-13.17-65.157-42.69-84.715-6.54-4.333-22.88-8.507-28.2-14.487 2.97-5.739 29.55-27.396 35.83-32.841l83.2-71.916 99.84-86.422c29.53-25.539 49.85-50.89 90.19-56.113"
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
