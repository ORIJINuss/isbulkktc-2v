"use client";


import { useTranslations } from "next-intl";
import HibritOdemeBileseni from "@/bilesenler/odeme/HibritOdemeBileseni";
import Rozet from "@/bilesenler/genel/Rozet";

export default function IlanPaketleriSayfasi() {
  const t = useTranslations("ilanPaketleri");

  const addonGrid = [
    { ik: "campaign", baslik: t("addonOneCikan"), fiyat: "£35 / ilan", ac: "48 saat ana sayfa vitrini, 3× daha fazla görüntülenme." },
    { ik: "notifications_active", baslik: t("addonAcil"), fiyat: "£49 / ilan", ac: "Kırmızı acil rozeti, tüm aramalarda öncelikli gösterim." },
    { ik: "update", baslik: t("addonUzatma"), fiyat: "£29", ac: "İlanınızın yayın süresine 30 gün daha ekleyin." },
    { ik: "groups", baslik: t("addonCVHavuzu"), fiyat: "£249 / ay", ac: "90.000+ adaylık CV havuzuna sınırsız erişim." },
    { ik: "psychology_alt", baslik: t("addonATS"), fiyat: "£199 / ay", ac: "Zorunlu beceri + dil + deneyim eşiği ile otomatik ön filtre." },
    { ik: "spatial_audio", baslik: t("addonSektor"), fiyat: "£599", ac: "Kendi sektörünüzde 30 gün sponsorlu vitrin gösterimi." },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ana-kapsayici/70 border border-ana-outline/40 mx-auto">
          <span className="msimge text-ana">paid</span>
          <span className="text-[12px] font-bold uppercase tracking-widest text-ana">
            Kurumsal İşveren Paketleri
          </span>
        </div>
        <h1 className="font-haber font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.02] text-ikincil tracking-tight">
          {t("baslik").split(",")[0]},
          <br className="sm:hidden" />{" "}
          <span className="text-ana">adil ücretlendirme</span> ile.
        </h1>
        <p className="text-lg text-ikincil/75 leading-relaxed">
          {t("altBaslik")}
        </p>
      </section>

      <HibritOdemeBileseni />

      <section>
        <div className="text-center mb-6">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-ikincil/50 mb-2">
            04 · Ekstra Hizmetler
          </div>
          <h2 className="font-haber font-black text-3xl sm:text-4xl text-ikincil leading-tight">
            Kampanyanızı bir sonraki seviyeye taşıyın
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {addonGrid.map((a, i) => (
            <div
              key={a.baslik}
              className="mineral-kart p-5 rounded-2xl flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl grid place-items-center bg-ana-kapsayici">
                  <span className="msimge text-ana text-xl">{a.ik}</span>
                </div>
                <Rozet
                  tur={i === 3 ? "altin" : "ikincil"}
                  kucuk
                  ikon={i === 5 ? "verified" : "sell"}
                >
                  {a.fiyat}
                </Rozet>
              </div>
              <h3 className="font-haber font-bold text-ana leading-tight text-lg">
                {a.baslik}
              </h3>
              <p className="text-[12px] text-ikincil/75 leading-snug flex-1">
                {a.ac}
              </p>
              <button
                type="button"
                className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-ana hover:underline"
              >
                Hemen ekle
                <span className="msimge text-base">add_circle</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl mineral-kart border-altin-cila/30">
        <div className="absolute inset-0 bg-gradient-to-br from-basari-900/10 via-transparent to-ana-kapsayici/70 pointer-events-none" />
        <div className="relative p-7 sm:p-10 grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
          <div className="space-y-4">
            <Rozet tur="basari" ikon="undo">
              14 Gün Cayma Hakkı
            </Rozet>
            <h3 className="font-haber font-black text-3xl sm:text-4xl leading-tight text-ikincil">
              Kullanmadığınız ilan kredileri için <span className="text-ana">%100 geri ödeme</span> garantisi.
            </h3>
            <p className="text-ikincil/80 leading-relaxed max-w-2xl">
              PES Lisansı 2024/9182 uyarınca, paketinizi satın aldıktan sonra 14
              gün içinde kullanmadığınız tüm ilan ve vitrin kredileri için koşulsuz
              iade hakkına sahipsiniz. Tüm ödeme kanallarında geçerlidir.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {[
                "FAST / EFT",
                "USDC on Base",
                "Mobipaid SMS",
                "e-Arşiv fatura",
                "3-D Secure",
                "2 saatte onay",
              ].map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-beyaz border border-cizgi-degisken text-xs font-bold text-ikincil shadow-mineral-dosye"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-basari-900" />
                  {b}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {[
              { ikon: "task_alt", bas: "Kullanılmamış krediler", ac: "Fatura tutarı üzerinden %100 geri ödeme." },
              { ikon: "shield_lock", bas: "Kısmi kullanım", ac: "Kullanılan kredi düşülür, kalan iade edilir." },
              { ikon: "timer_10", bas: "14 gün yasal hak", ac: "Pandektar Kanunu Md. 10 hükümleri uygulanır." },
            ].map((b) => (
              <div
                key={b.bas}
                className="p-4 rounded-2xl bg-beyaz/60 border border-ana-outline/30 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl grid place-items-center bg-basari-900/15 shrink-0">
                  <span className="msimge text-basari-900 text-xl">{b.ikon}</span>
                </div>
                <div>
                  <div className="font-bold text-sm text-ikincil leading-tight">{b.bas}</div>
                  <div className="text-[12px] text-ikincil/70 leading-snug mt-0.5">{b.ac}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
