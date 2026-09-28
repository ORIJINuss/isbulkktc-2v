import { siniflariBirlestir as sb } from "@/lib/yardimcilar/sinif-yardimcisi";
import { atsRenkSınıfı } from "@/lib/yardimcilar/bicimlendiriciler";

type Boyut = "sm" | "md" | "lg";

export default function ATSGöstergesi({
  yuzde,
  baslik = "ATS Uyumu",
  alt = "Beceri, deneyim ve dil uygunluğu",
  boyut = "md",
  kapsayiciSınıfı
}: {
  yuzde: number;
  baslik?: string;
  alt?: string;
  boyut?: Boyut;
  kapsayiciSınıfı?: string;
}) {
  const guvenliYuzde = Math.min(100, Math.max(0, Math.round(yuzde)));

  const yariCaplar = {
    sm: 30,
    md: 46,
    lg: 64
  } as const;
  const cizgiKalinliklari = { sm: 6, md: 9, lg: 12 } as const;
  const yaziBoyutlari = {
    sm: "text-etiket-sm",
    md: "text-baslik-md",
    lg: "text-gosteri-sm"
  } as const;
  const R = yariCaplar[boyut];
  const K = cizgiKalinliklari[boyut];
  const C = 2 * Math.PI * (R - K / 2);
  const doluluk = (guvenliYuzde / 100) * C;

  const renk =
    guvenliYuzde >= 85
      ? "#183a33"
      : guvenliYuzde >= 70
      ? "#42675e"
      : guvenliYuzde >= 50
      ? "#668d93"
      : "#ba1a1a";

  let durum = "Geliştirilmeli";
  if (guvenliYuzde >= 90) durum = "Mükemmel";
  else if (guvenliYuzde >= 80) durum = "Çok Yüksek";
  else if (guvenliYuzde >= 65) durum = "Yüksek";
  else if (guvenliYuzde >= 50) durum = "Orta";

  return (
    <div
      className={sb(
        "bg-yüzey-kapsayici-alt border border-cizgi-degisken/70 rounded-2xl p-4 flex items-center gap-4",
        "shadow-editoriyel-kart",
        kapsayiciSınıfı
      )}
    >
      <div className="shrink-0 relative">
        <svg width={R * 2} height={R * 2} className="-rotate-90">
          <circle
            cx={R}
            cy={R}
            r={R - K / 2}
            fill="none"
            stroke="#c1c8c5"
            strokeWidth={K}
            strokeLinecap="round"
          />
          <circle
            cx={R}
            cy={R}
            r={R - K / 2}
            fill="none"
            stroke={renk}
            strokeWidth={K}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C - doluluk}
            style={{ transition: "stroke-dashoffset 600ms ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={sb(yaziBoyutlari[boyut], "font-bold text-yüzey-uzerinde leading-none")}>
            %{guvenliYuzde}
          </span>
          {boyut !== "sm" ? (
            <span
              className={sb(
                "mt-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide",
                atsRenkSınıfı(guvenliYuzde)
              )}
            >
              {durum}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        <div>
          <p className="text-etiket-md  text-hüküm-sonuk uppercase tracking-wide">
            {baslik}
          </p>
          <p className="text-govde-sm  text-yüzey-uzerinde mt-0.5">
            {alt}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-govde-xs text-hüküm-sonuk">
          <div className="flex items-center justify-between">
            <span>Beceri</span>
            <span className="font-bold text-yüzey-uzerinde">
              %{Math.min(100, Math.round(guvenliYuzde + 2))}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Deneyim</span>
            <span className="font-bold text-yüzey-uzerinde">
              %{Math.min(100, Math.round(guvenliYuzde - 4))}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Dil</span>
            <span className="font-bold text-yüzey-uzerinde">
              %{Math.min(100, Math.max(0, Math.round(guvenliYuzde - 10)))}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Format</span>
            <span className="font-bold text-yüzey-uzerinde">
              %{Math.min(100, Math.round(guvenliYuzde + 4))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
