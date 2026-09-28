import { sb } from "@/lib/yardimcilar/sinif-yardimcisi";
import { tarihFormatla, paraFormatla } from "@/lib/yardimcilar/bicimlendiriciler";
import Buton from "@/bilesenler/genel/Buton";
import Rozet from "@/bilesenler/genel/Rozet";
import { PARA_BIRIMLERI, type ParaBirimi } from "@/lib/sabitler/alan-degiskenleri";

export type Proje = {
  id: string;
  baslik: string;
  aciklama: string;
  kategori: string;
  butceTipi: "sabit" | "saatlik";
  butce: { min: number; mak: number; para: ParaBirimi };
  teslimSuresiGun: number;
  teklifSayisi: number;
  yayinTarihi: string;
  b3Onayli: boolean;
  escrowMu: boolean;
  etiketler: string[];
  sirketAdi: string;
  sirketLogo?: string;
};

type ProjeKartiProps = {
  proje: Proje;
  className?: string;
};

export default function ProjeKarti({ proje, className }: ProjeKartiProps) {
  const para = PARA_BIRIMLERI.find((p) => p.deger === proje.butce.para);
  return (
    <article
      className={sb(
        "mineral-kart p-5 rounded-2xl flex flex-col sm:flex-row sm:items-stretch gap-4 transition-transform hover:-translate-y-0.5",
        className
      )}
    >
      <div className="w-14 h-14 shrink-0 rounded-2xl bg-ana-kapsayici grid place-items-center border-2 border-beyaz shadow-mineral-dosye sm:self-start">
        <span className="msimge text-ana text-3xl">hub</span>
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Rozet tur="ikincil" kucuk>
            {proje.kategori}
          </Rozet>
          {proje.escrowMu && (
            <Rozet tur="altin" ikon="security" kucuk>
              Escrow
            </Rozet>
          )}
          {proje.b3Onayli && (
            <Rozet tur="basari" ikon="verified" kucuk>
              B3 Doğrulanmış
            </Rozet>
          )}
          <span className="text-[10px] text-ikincil/60 font-semibold ms-auto sm:ms-0">
            {tarihFormatla(proje.yayinTarihi)}
          </span>
        </div>
        <div>
          <h4 className="font-haber font-bold text-ana text-lg leading-snug line-clamp-1">
            {proje.baslik}
          </h4>
          <p className="text-xs text-ikincil/75 leading-relaxed mt-1 line-clamp-2">
            {proje.aciklama}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {proje.etiketler.slice(0, 5).map((e) => (
            <span
              key={e}
              className="px-2 py-1 rounded-full bg-ikincil-kapsayici/70 border border-ana-outline/20 text-[11px] text-ikincil font-semibold"
            >
              {e}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-ana-outline/25">
          <div>
            <div className="text-[9px] uppercase font-black text-ikincil/50 tracking-wider">
              Bütçe
            </div>
            <div className="font-haber font-bold text-sm text-ana tabular-nums leading-tight">
              {paraFormatla(proje.butce.min, proje.butce.para)} –{" "}
              {paraFormatla(proje.butce.mak, proje.butce.para)}
            </div>
            <div className="text-[10px] text-ikincil/60 font-medium">
              {proje.butceTipi === "sabit" ? "Sabit" : "Saatlik"}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase font-black text-ikincil/50 tracking-wider">
              Teslim
            </div>
            <div className="font-haber font-bold text-sm text-ikincil tabular-nums leading-tight">
              {proje.teslimSuresiGun} gün
            </div>
            <div className="text-[10px] text-ikincil/60 font-medium">
              {proje.sirketAdi}
            </div>
          </div>
          <div className="flex items-end">
            <Buton
              tur="buton"
              varyant="ana"
              boyut="sm"
              ikon="send"
              ikonSonunda
              className="w-full"
            >
              Teklif Ver
            </Buton>
          </div>
        </div>
      </div>
    </article>
  );
}

export const ORNEK_PROJELER: Proje[] = [
  {
    id: "fr-1",
    baslik: "Next.js 14 booking portalı için UI revizyonu",
    aciklama:
      "KKTC otel zinciri için mevcut Next.js 13 App Router projesinin UI'ını Pearl Field Mineral Editorial tasarım sistemine uyarlayacak, 12 ana sayfa ve admin paneli revize edeceksiniz.",
    kategori: "Yazılım & Web",
    butceTipi: "sabit",
    butce: { min: 2800, mak: 4200, para: "GBP" },
    teslimSuresiGun: 21,
    teklifSayisi: 14,
    yayinTarihi: "2026-03-16T09:10:00.000Z",
    b3Onayli: true,
    escrowMu: true,
    etiketler: ["Next.js 14", "Tailwind", "next-intl", "Supabase", "Shadcn"],
    sirketAdi: "Bellapais Boutique Resorts",
  },
  {
    id: "fr-2",
    baslik: "Kıbrıs tarihi 3 boyutlu WebGL sahne tasarımı",
    aciklama:
      "Girne Kalesi, Bellapais Manastırı ve Salamis için ayrı ayrı 4K çözünürlüklere kadar ölçeklenebilir 3 adet interaktif WebGL (Three.js / R3F) sahne tasarımı.",
    kategori: "UI/UX & WebGL 3D",
    butceTipi: "sabit",
    butce: { min: 5500, mak: 7800, para: "GBP" },
    teslimSuresiGun: 35,
    teklifSayisi: 9,
    yayinTarihi: "2026-03-14T14:25:00.000Z",
    b3Onayli: true,
    escrowMu: true,
    etiketler: ["Three.js", "React Three Fiber", "Blender", "OKLCH"],
    sirketAdi: "Arkin Tech Holding",
  },
  {
    id: "fr-3",
    baslik: "Aylık KKTC muhasebe + bordro danışmanlığı",
    aciklama:
      "5 çalışanlı B3 kayıtlı turizm şirketi için devamlı KVKK / e-Arşiv / B3 beyannamesi dahil aylık muhasebe ve 3 kişilik bordro takibi.",
    kategori: "Finans & Muhasebe",
    butceTipi: "saatlik",
    butce: { min: 55, mak: 85, para: "GBP" },
    teslimSuresiGun: 180,
    teklifSayisi: 6,
    yayinTarihi: "2026-03-10T08:00:00.000Z",
    b3Onayli: true,
    escrowMu: false,
    etiketler: ["89/2007 KVK", "B3", "e-Arşiv", "SMMM"],
    sirketAdi: "Alpet Gayrimenkul",
  },
  {
    id: "fr-4",
    baslik: "Yeminli EN/TR/HE çeviri · 42 sözleşme sayfası",
    aciklama:
      "42 sayfalık kira + hizmet sözleşmesi paketinin İngilizce'den Türkçe'ye ve İbranice'ye (RTL) yeminli tercümesi, 1 Ocak 2026 Kurban Bayramı öncesi teslim.",
    kategori: "Çeviri & Yeminli",
    butceTipi: "sabit",
    butce: { min: 1400, mak: 1900, para: "TRY" },
    teslimSuresiGun: 10,
    teklifSayisi: 18,
    yayinTarihi: "2026-03-18T16:45:00.000Z",
    b3Onayli: false,
    escrowMu: true,
    etiketler: ["Yeminli", "İbranice RTL", "Sözleşme", "Noter onaylı"],
    sirketAdi: "Kıbrıs Akdeniz Hukuk Bürosu",
  },
];
