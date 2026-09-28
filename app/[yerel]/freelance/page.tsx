"use client";

import { useTranslations } from "next-intl";
import { sb } from "@/lib/yardimcilar/sinif-yardimcisi";
import Rozet from "@/bilesenler/genel/Rozet";
import Buton from "@/bilesenler/genel/Buton";
import FiltreYanPanel from "@/bilesenler/ilan/FiltreYanPanel";
import ProjeKarti, { ORNEK_PROJELER } from "@/bilesenler/freelance/ProjeKarti";
import { FREELANCE_KATEGORILERI } from "@/lib/sabitler/alan-degiskenleri";

export default function FreelanceSayfasi() {
  const t = useTranslations("freelance");
  const m = useTranslations("meta");

  const kategoriler = FREELANCE_KATEGORILERI.map((k, i) => ({
    ...k,
    adet: [48, 19, 32, 27, 61, 22][i] ?? 5,
    ikon: [
      "code",
      "palette",
      "calculate",
      "g_translate",
      "campaign",
      "foundation",
    ][i],
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* --- ESCROW HERO --- */}
      <section className="relative overflow-hidden rounded-[28px] mineral-kart border-altin-cila/30">
        <div className="absolute inset-0 bg-gradient-to-br from-altin-sabit/20 via-beyaz to-ana-kapsayici/70 pointer-events-none" />
        <div className="absolute -top-32 end-0 w-[520px] h-[520px] rounded-full bg-ana-kapsayici/30 blur-[140px] pointer-events-none" />
        <div className="relative p-7 sm:p-10 grid lg:grid-cols-[1.25fr_1fr] gap-8 items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2">
              <Rozet tur="altin" ikon="security">
                Escrow Güvencesi
              </Rozet>
              <Rozet tur="basari" ikon="verified">
                B3 + PES Lisanslı
              </Rozet>
            </div>
            <h1 className="font-haber font-black text-4xl sm:text-5xl tracking-tight leading-[1.02] text-ikincil">
              {t("heroBaslik")}
            </h1>
            <p className="text-lg text-ikincil/80 leading-relaxed max-w-xl">
              {t("heroAlt")}
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <Buton tur="buton" varyant="ana" boyut="lg" ikon="add_task">
                Proje Yayınla (Ücretsiz)
              </Buton>
              <Buton tur="buton" varyant="ikincil" boyut="lg" ikon="work">
                Yeteneklerimi Aç
              </Buton>
            </div>
            <div className="grid grid-cols-3 gap-2.5 pt-1 max-w-lg">
              {[
                { deger: "£1.2M+", etiket: "2025 ödenen tutar" },
                { deger: "4.9/5", etiket: "Ortalama memnuniyet" },
                { deger: "36 saat", etiket: "Ortalama işe başlama" },
              ].map((i) => (
                <div
                  key={i.etiket}
                  className="p-3 rounded-2xl bg-beyaz/60 border border-ana-outline/30"
                >
                  <div className="font-haber font-black text-2xl tabular-nums text-ikincil leading-none">
                    {i.deger}
                  </div>
                  <div className="text-[11px] text-ikincil/70 mt-1 font-semibold">
                    {i.etiket}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3 lg:ps-5">
            {[
              {
                ik: "lock_clock",
                baslik: "Ücret Escrow'da tutulur",
                aciklama:
                  "Proje bütçesi İşBulKKTC güvencesinde, teslim onayından sonra serbest çalışana ödenir.",
                renk: "bg-ana text-beyaz",
              },
              {
                ik: "counter_3",
                baslik: "Üçlü tahkim mekanizması",
                aciklama:
                  "Uyuşmazlıklar PES Lisanslı 3 kişilik komite tarafsızca incelenir, 48 saatte sonuç.",
                renk: "bg-altin-cila text-ikincil-sabit-varyant-uzerinde",
              },
              {
                ik: "health_and_safety",
                baslik: "Serbest Meslek Makbuzu",
                aciklama:
                  "89/2007 KVK uyarınca B3 onaylı tüm projeler için otomatik SMM makbuzu.",
                renk: "bg-basari-900 text-beyaz",
              },
            ].map((k) => (
              <div
                key={k.baslik}
                className="p-4 rounded-2xl bg-beyaz/70 border border-ana-outline/30 flex items-start gap-3.5"
              >
                <div
                  className={sb(
                    "w-11 h-11 rounded-xl grid place-items-center shrink-0",
                    k.renk
                  )}
                >
                  <span className="msimge text-xl">{k.ik}</span>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-ikincil leading-tight">
                    {k.baslik}
                  </div>
                  <div className="text-[12px] text-ikincil/70 leading-snug mt-1">
                    {k.aciklama}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- KATEGORILER --- */}
      <section>
        <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-ikincil/50 mb-2">
              02 · 6 Kategori
            </div>
            <h2 className="font-haber font-black text-3xl sm:text-4xl text-ikincil leading-tight">
              Yetenekleri kategoriden keşfedin
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
          {kategoriler.map((k) => (
            <button
              type="button"
              key={k.deger}
              className="mineral-kart p-5 rounded-2xl text-start group"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl grid place-items-center bg-ana-kapsayici group-hover:bg-ana group-hover:text-beyaz transition-colors shrink-0">
                  <span className="msimge text-2xl text-ana group-hover:text-beyaz transition-colors">
                    {k.ikon}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-haber font-bold text-ikincil leading-tight">
                      {k.etiket}
                    </div>
                    <span className="inline-flex items-center justify-center min-w-8 h-7 px-2 rounded-full bg-altin-sabit/20 text-altin-cila text-[11px] font-black tabular-nums">
                      {k.adet}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-ana font-bold opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    Keşfet
                    <span className="msimge text-base">arrow_forward</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* --- ANA LISTE --- */}
      <section className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
        <FiltreYanPanel sadeceFreelance />
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              <button className="px-3.5 py-1.5 rounded-full bg-ana text-beyaz text-xs font-bold shadow-mineral-dosye">
                {t("sekmeProjeler")}
              </button>
              <button className="px-3.5 py-1.5 rounded-full bg-ikincil-kapsayici text-ikincil text-xs font-semibold">
                {t("sekmeOzellik")}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Rozet tur="ozel-mineral" ikon="swap_vert" kucuk>
                Akıllı Eşleşme
              </Rozet>
              <select className="girdi text-xs !py-1.5 !min-w-[170px]">
                <option>En Yeni Projeler</option>
                <option>Bütçe (Yüksek → Düşük)</option>
                <option>Teslimat (Hızlı → Yavaş)</option>
                <option>Teklif Sayısı (Az → Çok)</option>
              </select>
            </div>
          </div>
          <div className="space-y-3.5">
            {ORNEK_PROJELER.map((p) => (
              <ProjeKarti key={p.id} proje={p} />
            ))}
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-3">
            <button className="sayfalama-buton" aria-label="Önceki">
              <span className="msimge">chevron_left</span>
            </button>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                className={sb("sayfalama-buton", s === 1 && "sayfalama-aktif")}
              >
                {s}
              </button>
            ))}
            <button className="sayfalama-buton" aria-label="Sonraki">
              <span className="msimge">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
