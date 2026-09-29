import Image from "next/image";
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
   * Tema seçenekleri geriye dönük uyumluluk için korunur; yüklenen asset saydam
   * marka kullanımında aynı görsel dili taşır.
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
   * Wordmark metni
   */
  markaMetni?: string;
}

const BOYUTLAR: Record<string, { kutu: string; piksel: number }> = {
  sm: { kutu: "w-6 h-6", piksel: 24 },
  md: { kutu: "w-8 h-8", piksel: 32 },
  lg: { kutu: "w-10 h-10", piksel: 40 },
  xl: { kutu: "w-12 h-12", piksel: 48 },
};

/**
 * İşBulKKTC marka bileşeni.
 * Minimalist vektör logosu ve düzenlenmiş wordmark'ı render eder.
 */
export default function Logo({
  boyut = "md",
  yalnizcaSembol = false,
  sembolGosterilsin = true,
  tema = "saydam",
  sinif,
  metinSinif,
  markaMetni = "İşBul",
}: LogoProps) {
  const boyutAyar = typeof boyut === "string" ? BOYUTLAR[boyut] ?? BOYUTLAR.md : null;
  const ozelPiksel = typeof boyut === "number" ? boyut : boyutAyar?.piksel;

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
          style={
            ozelPiksel
              ? { width: ozelPiksel, height: ozelPiksel }
              : undefined
          }
          className={sb(
            "inline-flex items-center justify-center shrink-0 overflow-hidden transition-transform duration-200",
            boyutAyar?.kutu
          )}
          aria-hidden="true"
        >
          <Image
            src="/marka-isbulkktc.webp"
            alt=""
            width={ozelPiksel || 32}
            height={ozelPiksel || 32}
            className="h-full w-full border-0 bg-transparent object-contain shadow-none"
            priority
          />
        </span>
      )}
      {!yalnizcaSembol && (
        <span
          className={sb(
            "inline-flex min-w-0 flex-col items-start whitespace-nowrap font-bold tracking-[-0.035em] leading-[0.92] font-[Inter] text-[clamp(0.95rem,4.8vw,1.625rem)] italic text-[var(--bedford-mineral)]",
            metinSinif
          )}
        >
          <span className="text-ana">{markaMetni}</span>
          <span className="text-govde-xs text-ana/70">KKTC</span>
        </span>
      )}
    </span>
  );
}
