"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Buton from "@/bilesenler/genel/Buton";
import Rozet from "@/bilesenler/genel/Rozet";
import IlanKartı from "@/bilesenler/ilan/IlanKartı";
import ATSGöstergesi from "@/bilesenler/ilan/ATSGöstergesi";
import TurnstileBileseni from "@/bilesenler/genel/TurnstileBileseni";
import {
  IZIN_TIPLERI,
  ILCELER,
  YAN_HAKLAR,
  PARA_BIRIMLERI,
  SEKTORLER,
} from "@/lib/sabitler/alan-degiskenleri";
import type { Ilan } from "@/lib/veri/ilan-tipi";
import type { EskiIlanEkMeta } from "@/lib/depolar/ilan-deposu";
import {
  tarihFormatla,
  paraFormatla,
  gunBazliNeKadarOnce,
} from "@/lib/yardimcilar/bicimlendiriciler";

type Props = {
  ilan: Ilan;
  benzer: Ilan[];
  ekMeta: EskiIlanEkMeta;
};

export default function IlanDetayIcerik({ ilan, benzer, ekMeta }: Props) {
  const t = useTranslations("ilanDetay");
  const g = useTranslations("genel");
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [izinTipi, setIzinTipi] = useState<string>("VATANDAS");
  const [kapakMetni, setKapakMetni] = useState<string>("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);

  const paraBirimi =
    !ilan.maasAraligi.gizli && ilan.maasAraligi.para
      ? ilan.maasAraligi.para
      : "GBP";
  const minMaas =
    !ilan.maasAraligi.gizli && ilan.maasAraligi.min != null
      ? ilan.maasAraligi.min
      : ilan.minNetAylik ?? 0;
  const makMaas =
    !ilan.maasAraligi.gizli && ilan.maasAraligi.mak != null
      ? ilan.maasAraligi.mak
      : ilan.makNetAylik ?? minMaas;

  const ilceler = ilan.ilceler
    .map((k) => ILCELER.find((i) => i.deger === k)?.etiket ?? k)
    .join(", ");

  const b3Onayli = ilan.b3OnayliMi ?? ilan.b3Onayli ?? false;
  const acilIlan = ilan.acilMi ?? ilan.acilIlan ?? false;
  const atsEsigi = ilan.atsSkorEsigi ?? ilan.atsYuzdesi ?? 72;
  const basvuruSayisi = ilan.basvuruSayisi ?? 24;
  const pozisyonTanimi = ekMeta?.pozisyonTanimi?.length
    ? ekMeta.pozisyonTanimi
    : [ilan.isTanimi ?? `${ilan.pozisyonBasligi} pozisyonunda yetenekli ekip arkadaşları arıyoruz.`];
  const teknikYetenekler = ekMeta?.teknikYetenekler?.length
    ? ekMeta.teknikYetenekler
    : [
        {
          grup: "Temel Beceriler",
          etiketler: ilan.zorunluBeceriler?.slice(0, 8) ?? ["İletişim", "Takım Çalışması"],
        },
      ];
  const sektorEtiketi = SEKTORLER.find((s) => s.deger === ilan.sektorKodu)?.etiket ?? ilan.sektor ?? "—";
  const aiGerekce = ilan.aiEslestirme?.gerekce ?? ekMeta?.tanitim ?? `${ilan.sirketAdi} KKTC'nin önde gelen kurumlarından biridir.`;

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) return;
    setYukleniyor(true);
    await new Promise((r) => setTimeout(r, 700));
    setYukleniyor(false);
    setGonderildi(true);
  };

  const izinAdimlari = [
    { ikon: "description", baslik: t("adimOnIzin"), aciklama: "İşveren başvuru + B3 kaydı ile ön izin alınır. 5 iş günü." },
    { ikon: "vaccines", baslik: t("adimSaglik"), aciklama: "Sağlık raporu + muhaceret bildirimi (Göçmen Dairesi)." },
    { ikon: "verified_user", baslik: t("adimIzin"), aciklama: "2 yıllık çalışma izni çıkarılır, B3 + PES çakışması kontrol edilir." },
  ];

  return (
    <div className="py-8 sm:py-10 space-y-7">
      <section className="mineral-kart rounded-[24px] p-6 sm:p-7 overflow-hidden relative">
        <div className="absolute -top-40 -end-40 w-[520px] h-[520px] rounded-full bg-ana-kapsayici/50 blur-[120px] pointer-events-none" />
        <div className="relative grid lg:grid-cols-[1fr_auto] gap-5 lg:gap-6 items-start">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <Rozet tur="ozel-mineral" ikon="apartment">
                {ilan.sirketAdi}
              </Rozet>
              {b3Onayli && (
                <Rozet tur="basari" ikon="verified_user">
                  B3 Onaylı
                </Rozet>
              )}
              {acilIlan && (
                <Rozet tur="hata" ikon="notifications_active">
                  Acil
                </Rozet>
              )}
              {ilan.izinTipleri.map((it) => {
                const bulundu = IZIN_TIPLERI.find((z) => z.deger === it);
                return bulundu ? (
                  <Rozet key={it} tur="ana" ikon="workspace_premium" kucuk>
                    {bulundu.etiket}
                  </Rozet>
                ) : null;
              })}
            </div>
            <h1 className="font-haber font-black tracking-tight leading-[1.03] text-3xl sm:text-4xl lg:text-5xl text-ikincil">
              {ilan.pozisyonBasligi}
            </h1>
            <div className="flex flex-wrap gap-3 text-xs text-ikincil/75 font-semibold">
              <span className="inline-flex items-center gap-1">
                <span className="msimge text-[18px] text-ana">place</span>
                {ilceler}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="msimge text-[18px] text-ana">calendar_month</span>
                Yayın: {tarihFormatla(ilan.yayinTarihi)} ({gunBazliNeKadarOnce(ilan.yayinTarihi)})
              </span>
              {ilan.sonBasvuruTarihi && (
                <span className="inline-flex items-center gap-1">
                  <span className="msimge text-[18px] text-ana">schedule</span>
                  Bitiş: {tarihFormatla(ilan.sonBasvuruTarihi)}
                </span>
              )}
              <span className="inline-flex items-center gap-1 tabular-nums">
                <span className="msimge text-[18px] text-ana">visibility</span>
                {ilan.goruntulenmeSayisi.toLocaleString("tr-TR")} {t("goruntulenme")} · {basvuruSayisi} {t("basvuruSayi")}
              </span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <span className="msimge text-[18px] text-altin-cila">confirmation_number</span>
                {ilan.referansNo}
              </span>
            </div>
          </div>
          <div className="lg:min-w-[320px] p-4 rounded-2xl bg-beyaz border border-ana-outline/30 shadow-mineral-dosye space-y-2.5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-ikincil/50 font-black">
              {t("netMaas")}
            </div>
            {ilan.maasAraligi.gizli ? (
              <div className="font-haber font-black text-2xl text-ana leading-tight">
                Pazarlık · Gizli
              </div>
            ) : (
              <>
                <div className="flex items-end gap-1.5 leading-none">
                  <div className="font-haber font-black text-3xl sm:text-4xl text-ikincil tabular-nums">
                    {paraFormatla(minMaas, paraBirimi)}
                  </div>
                  <span className="text-ikincil/50 font-bold pb-1 text-base">–</span>
                  <div className="font-haber font-black text-3xl sm:text-4xl text-ana tabular-nums">
                    {paraFormatla(makMaas, paraBirimi)}
                  </div>
                </div>
                <div className="text-[11px] text-ikincil/70 font-semibold">
                  Net · Aylık · {PARA_BIRIMLERI.find((p) => p.deger === paraBirimi)?.etiket ?? ""}
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <div className="p-2 rounded-xl bg-ana-kapsayici/50 border border-ana-outline/30 flex items-center gap-1.5">
                <span className="msimge text-ana text-base">verified</span>
                <span className="text-[11px] font-bold text-ana leading-snug">
                  {t("garanti1")}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-altin-sabit/15 border border-altin-cila/30 flex items-center gap-1.5">
                <span className="msimge text-altin-cila text-base">gavel</span>
                <span className="text-[11px] font-bold text-ikincil leading-snug">
                  {t("garanti2")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
        <div className="space-y-6">
          <div className="mineral-kart p-6 rounded-2xl space-y-5">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-ikincil/50 mb-1.5">
                01 · {t("hakkimizda")}
              </div>
              <h2 className="font-haber font-black text-2xl text-ikincil leading-tight mb-2.5">
                Pozisyon özeti & ekip kültürü
              </h2>
              <div className="space-y-2.5 text-ikincil/85 leading-relaxed">
                {pozisyonTanimi.map((parca, i) => (
                  <p key={i}>{parca}</p>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-4 gap-2.5 pt-1">
              {[
                { anahtar: t("kategori"), deger: sektorEtiketi },
                { anahtar: t("sehir"), deger: ilceler },
                { anahtar: t("sirket"), deger: ilan.sirketAdi },
                { anahtar: t("referansNo"), deger: ilan.referansNo },
              ].map((h) => (
                <div
                  key={h.anahtar}
                  className="p-3 rounded-xl bg-ikincil-kapsayici/50 border border-ana-outline/25"
                >
                  <div className="text-[10px] font-black uppercase tracking-wider text-ikincil/55">
                    {h.anahtar}
                  </div>
                  <div className="text-[13px] font-bold text-ana leading-snug mt-1">
                    {h.deger}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mineral-kart p-6 rounded-2xl space-y-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-ikincil/50 mb-1.5">
                02 · {t("teknikYetenekler")}
              </div>
              <h2 className="font-haber font-black text-2xl text-ikincil leading-tight">
                İlanı başarılı kılan anahtar kelimeler
              </h2>
            </div>
            <div className="space-y-3.5">
              {teknikYetenekler.map((g, gi) => (
                <div key={gi}>
                  <div className="text-xs font-bold text-ana uppercase tracking-wider mb-1.5">
                    {g.grup}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.etiketler.map((et) => (
                      <span
                        key={et}
                        className="px-3 py-1.5 rounded-full bg-ana-kapsayici/60 border border-ana-outline/30 text-xs font-bold text-ana"
                      >
                        {et}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mineral-kart p-6 rounded-2xl border-altin-cila/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-altin-sabit/10 via-transparent to-ana-kapsayici/50 pointer-events-none" />
            <div className="relative space-y-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-ikincil/50 mb-1.5">
                    03 · Yasal Süreç
                  </div>
                  <h2 className="font-haber font-black text-2xl text-ikincil leading-tight">
                    {t("yasalHaklar")}
                  </h2>
                </div>
                <Rozet tur="altin" ikon="shield_person">
                  PES 2024/9182 Uyumlu
                </Rozet>
              </div>
              <ol className="grid md:grid-cols-3 gap-3">
                {izinAdimlari.map((ad, i) => (
                  <li
                    key={ad.baslik}
                    className="relative p-4 rounded-2xl bg-beyaz border border-ana-outline/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 shrink-0 rounded-xl bg-ana text-beyaz grid place-items-center shadow-mineral-dosye">
                        <span className="font-haber font-black text-xl tabular-nums">
                          {i + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="msimge text-ana text-base">{ad.ikon}</span>
                          <div className="font-bold text-sm text-ikincil leading-tight">
                            {ad.baslik}
                          </div>
                        </div>
                        <div className="text-[12px] text-ikincil/75 leading-snug">
                          {ad.aciklama}
                        </div>
                      </div>
                    </div>
                    {i < izinAdimlari.length - 1 && (
                      <div
                        className="hidden md:block absolute top-1/2 -translate-y-1/2 z-10 w-3 h-3 border-t-2 border-r-2 border-altin-cila rotate-45"
                        style={{ insetInlineStart: "calc(100% + 8px)" }}
                      ></div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="mineral-kart p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-ana-kapsayici grid place-items-center">
                  <span className="msimge text-ana">schedule</span>
                </div>
                <h3 className="font-haber font-bold text-lg text-ikincil leading-tight">
                  {t("calismaDuzeni")}
                </h3>
              </div>
              <ul className="space-y-2">
                {[
                  "Esnek mesai · 09:00 - 18:00",
                  "Hibrit çalışma modeli (haftada 2 gün ofis)",
                  "Apple M Serisi veya eşdeğer laptop + 4K monitör",
                  "Yıllık 22 gün ücretli izin + bayram izinleri",
                ].map((a) => (
                  <li key={a} className="flex items-start gap-2 text-sm text-ikincil/85">
                    <span className="msimge text-basari-900 mt-0.5 text-base">check_circle</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mineral-kart p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-altin-sabit/20 grid place-items-center">
                  <span className="msimge text-altin-cila">card_giftcard</span>
                </div>
                <h3 className="font-haber font-bold text-lg text-ikincil leading-tight">
                  {t("yanHaklar")}
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {ilan.yanHaklar.map((yh) => {
                  const bulundu = YAN_HAKLAR.find((y) => y.deger === yh);
                  return (
                    <div
                      key={yh}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-ana-kapsayici/40 border border-ana-outline/25"
                    >
                      <span className="msimge text-ana text-lg">
                        {bulundu?.ikon ?? "check"}
                      </span>
                      <span className="text-[13px] font-bold text-ana">
                        {bulundu?.etiket ?? yh}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mineral-kart p-6 rounded-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-ikincil-kapsayici/70 grid place-items-center border-2 border-beyaz shadow-mineral-dosye">
                  <span className="msimge text-ana text-3xl">apartment</span>
                </div>
                <div>
                  <h2 className="font-haber font-black text-2xl text-ikincil leading-tight">
                    {ilan.sirketAdi}
                  </h2>
                  <div className="text-xs text-ikincil/75 font-semibold mt-0.5">
                    {t("sirketProfili")} · B3-Kodu: {ilan.sirketKodu}
                  </div>
                </div>
              </div>
              <Buton tur="buton" varyant="ikincil" boyut="sm" ikon="open_in_new">
                Tüm İlanları ({Math.round(Math.random() * 14 + 4)})
              </Buton>
            </div>
            <p className="text-ikincil/80 leading-relaxed">
              {aiGerekce} Kurumsal sosyal sorumluluk projeleri ve KKTC geneli üniversite iş birliği programları ile çalışanlarına sürekli gelişim fırsatı sunmaktadır.
            </p>
          </div>

          {benzer.length > 0 && (
            <section>
              <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-ikincil/50 mb-1.5">
                    05 · Önerilen
                  </div>
                  <h2 className="font-haber font-black text-2xl text-ikincil leading-tight">
                    {t("benzerIlanlar")}
                  </h2>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {benzer.map((b) => (
                  <IlanKartı key={b.slug} ilan={b} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="sticky top-28 self-start space-y-4">
          <form
            onSubmit={gonder}
            className="mineral-kart rounded-[22px] p-6 space-y-5 shadow-mineral-yukseltilmis"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-haber font-black text-xl text-ikincil leading-tight">
                  {g("hemenBasvur")}
                </h3>
                <ATSGöstergesi yuzde={atsEsigi} boyut="sm" />
              </div>
              <p className="text-[12px] text-ikincil/75 leading-snug">
                CV'niz otomatik olarak <b className="text-ana">%{atsEsigi} AI eşiği</b> ile karşılaştırılır.
              </p>
            </div>

            <div>
              <div className="girdiEtiket">Ad Soyad *</div>
              <input className="girdi w-full" placeholder="Ahmet Yılmaz" required />
            </div>
            <div>
              <div className="girdiEtiket">E-posta *</div>
              <input type="email" className="girdi w-full" placeholder="ahmet@email.ku" required />
            </div>
            <div>
              <div className="girdiEtiket">KKTC Çalışma İzin Durumunuz *</div>
              <select
                className="girdi w-full"
                value={izinTipi}
                onChange={(e) => setIzinTipi(e.target.value)}
                required
              >
                {IZIN_TIPLERI.map((iz) => (
                  <option key={iz.deger} value={iz.deger}>
                    {iz.etiket}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="girdiEtiket">Kapak Mektubu (2-3 cümle)</div>
              <textarea
                className="girdi w-full resize-none"
                rows={3}
                value={kapakMetni}
                onChange={(e) => setKapakMetni(e.target.value)}
                placeholder="Neden bu pozisyona uygun olduğunuzu kısaca açıklayın."
              />
            </div>
            <div>
              <div className="girdiEtiket">CV Yükle (PDF/DOCX · max 4MB)</div>
              <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-dashed border-ana-outline/50 bg-ana-kapsayici/30 cursor-pointer hover:bg-ana-kapsayici/60 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="msimge text-ana">upload_file</span>
                  <div className="text-sm text-ikincil truncate">Ahmet_Yilmaz_CV_2026.pdf</div>
                </div>
                <span className="text-[11px] font-bold text-ana shrink-0">Değiştir</span>
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" />
              </label>
            </div>
            <TurnstileBileseni onDogrulama={setTurnstileToken} />
            <Buton
              tur="buton"
              varyant="ana"
              boyut="blok"
              ikon={yukleniyor ? "progress_activity" : "send"}
              ikonSonunda
              yukleniyor={yukleniyor}
              disabled={!turnstileToken || gonderildi}
            >
              {gonderildi ? "✓ Başvurunuz Alındı" : yukleniyor ? "Gönderiliyor..." : g("hemenBasvur")}
            </Buton>
            {gonderildi && (
              <div className="p-3 rounded-xl bg-basari-900/12 border border-basari-900/30 flex items-start gap-2">
                <span className="msimge text-basari-900 text-xl shrink-0 mt-0.5">task_alt</span>
                <div className="text-[12px] text-basari-900 leading-snug font-semibold">
                  Başvurunuz sisteme kaydedildi. İşveren B3 onaylı ise <b>4 saat içinde</b> dönüş beklenebilir.
                </div>
              </div>
            )}
            <div className="text-[10px] text-ikincil/60 leading-snug text-center pt-1">
              {g("hemenBasvur")} butonuna tıklayarak KVK 89/2007 uyarınca kişisel verilerinizin işverene aktarılmasını onaylıyorsunuz.
            </div>
          </form>

          <div className="mineral-kart rounded-2xl p-4 space-y-3 text-xs">
            <div className="font-haber font-bold text-ikincil flex items-center gap-2">
              <span className="msimge text-ana">tips_and_updates</span>
              Başvuru İyileştirme İpuçları
            </div>
            <ul className="space-y-1.5 text-ikincil/75 leading-snug">
              <li className="flex items-start gap-1.5">
                <span className="msimge text-altin-cila mt-0.5 text-base">star</span>
                İlan anahtar kelimelerini CV'nizin ilk 100 kelimesine yerleştirin.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="msimge text-altin-cila mt-0.5 text-base">star</span>
                Teknik becerilerinizi 8-12 madde ile sınırlandırın.
              </li>
              <li className="flex items-start gap-1.5">
                <span className="msimge text-altin-cila mt-0.5 text-base">star</span>
                Yazı tipi olarak Hanken Grotesk benzeri temiz bir font seçin.
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
