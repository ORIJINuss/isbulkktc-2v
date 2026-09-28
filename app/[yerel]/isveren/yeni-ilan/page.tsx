"use client";


import { useTranslations } from "next-intl";
import { Link } from "@/i18n/yonlendirme";
import IlanVerFormu4Adim from "@/bilesenler/formlar/IlanVerFormu4Adim";
import Rozet from "@/bilesenler/genel/Rozet";
import Buton from "@/bilesenler/genel/Buton";

export default function YeniIlanSayfasi() {
  const t = useTranslations("isverenFormu");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10 space-y-7">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex flex-wrap items-center gap-2">
            <Rozet tur="altin" ikon="edit_note">
              4 Adımlı Yayın Akışı
            </Rozet>
            <Rozet tur="basari" ikon="verified">
              B3 + PES Kontrolü Otomatik
            </Rozet>
            <Rozet tur="ana" ikon="receipt">
              e-Arşiv Fatura (1 Ocak 2026)
            </Rozet>
          </div>
          <h1 className="font-haber font-black text-3xl sm:text-4xl lg:text-5xl text-ikincil tracking-tight leading-[1.02]">
            Doğru pozisyonu,{" "}
            <span className="text-ana">doğru adayla buluşturun.</span>
          </h1>
          <p className="text-ikincil/80 leading-relaxed">
            Formu doldurduktan sonra ATS eşik ayarlarınız ile 120+ aday profili
            otomatik taranır. En yüksek uyumluya sahip 20 aday size sıralı olarak
            sunulur. İzin tipleri PES Lisansı ile eşleştirilir.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Link href="/ilan-paketleri">
            <Buton tur="buton" varyant="ikincil" boyut="md" ikon="add_card">
              Kredi Yükle / Paket Değiştir
            </Buton>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ikincil-kapsayici/60 text-xs font-bold text-ikincil/80">
            <span className="w-1.5 h-1.5 rounded-full bg-basari-900 animate-pulse" />
            Kalan ilan kredisi: <span className="text-ana font-black">17</span>
          </div>
        </div>
      </section>

      <IlanVerFormu4Adim />
    </div>
  );
}
