"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { sb } from "@/lib/yardimcilar/sinif-yardimcisi";
import { paraFormatla } from "@/lib/yardimcilar/bicimlendiriciler";
import Buton from "@/bilesenler/genel/Buton";
import Rozet from "@/bilesenler/genel/Rozet";

export type Paket = {
  id: string;
  etiket: string;
  aciklama: string;
  aylikFiyatGBP: number;
  ilanKredisi: number;
  vitrinKredisi: number;
  cvHakki: number;
  ozellikler: string[];
  onerilen?: boolean;
};

const VARSAYILAN_PAKETLER: Paket[] = [
  {
    id: "baslangic",
    etiket: "Başlangıç (3)",
    aciklama: "Yeni kurulan B3 kayıtlı küçük işletmeler için.",
    aylikFiyatGBP: 149,
    ilanKredisi: 3,
    vitrinKredisi: 1,
    cvHakki: 50,
    ozellikler: [
      "3 aktif ilan hakkı",
      "B3 doğrulama rozeti",
      "Standart ATS ön filtre",
      "7/24 İngilizce & Türkçe destek",
    ],
  },
  {
    id: "standart",
    etiket: "Standart (10)",
    aciklama: "Orta ölçekli kurumsal işverenler için en çok tercih edilen.",
    aylikFiyatGBP: 420,
    ilanKredisi: 10,
    vitrinKredisi: 3,
    cvHakki: 300,
    onerilen: true,
    ozellikler: [
      "10 aktif ilan + 3 ana sayfa vitrini",
      "AI ATS eşik ayarı (40-95%)",
      "Çoklu yönetici hesabı (5)",
      "e-Arşiv fatura otomatik",
      "Öncelikli aday havuzu",
    ],
  },
  {
    id: "profesyonel",
    etiket: "Profesyonel (25)",
    aciklama: "Turizm, inşaat ve teknoloji ölçeğinde büyük işveren.",
    aylikFiyatGBP: 949,
    ilanKredisi: 25,
    vitrinKredisi: 8,
    cvHakki: 9999,
    ozellikler: [
      "25 aktif ilan · 8 öne çıkan",
      "Sınırsız CV görüntüleme",
      "Aday bulk davet + SMS kampanyası",
      "Hesap yöneticisi atanır",
      "KKTC 6 ilçeye özel filtre",
    ],
  },
];

type OdemeKanali = "banka" | "mobi" | "kripto";

export default function HibritOdemeBileseni({
  paketler = VARSAYILAN_PAKETLER,
  sinif,
}: {
  paketler?: Paket[];
  sinif?: string;
}) {
  const t = useTranslations("ilanPaketleri");
  const [seciliPaketId, setSeciliPaketId] = useState<string>("standart");
  const [ekVitrin, setEkVitrin] = useState<number>(2);
  const [ekAcil, setEkAcil] = useState<number>(1);
  const [kanal, setKanal] = useState<OdemeKanali>("banka");

  const secili = paketler.find((p) => p.id === seciliPaketId) ?? paketler[0];
  const paketTutar = secili.aylikFiyatGBP;
  const vitrinFiyat = 35;
  const acilFiyat = 49;
  const araToplam =
    paketTutar + ekVitrin * vitrinFiyat + ekAcil * acilFiyat;
  const kdvOran = 0.2;
  const kdv = araToplam * kdvOran;
  const toplam = araToplam + kdv;

  return (
    <div className={sb("grid lg:grid-cols-[1.4fr_1fr] gap-6", sinif)}>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          {paketler.map((p) => {
            const seciliMi = p.id === seciliPaketId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSeciliPaketId(p.id)}
                className={sb(
                  "text-start p-5 rounded-2xl border-2 transition-all relative overflow-hidden",
                  seciliMi
                    ? "border-ana shadow-mineral-yukseltilmis bg-beyaz"
                    : "border-ana-outline/30 mineral-kart hover:border-ana-outline/70"
                )}
              >
                {p.onerilen && (
                  <div className="absolute top-3 end-3">
                    <Rozet tur="altin" kucuk ikon="workspace_premium">
                      {t("enCokSatan")}
                    </Rozet>
                  </div>
                )}
                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-ikincil/50 mb-1">
                  PAKET
                </div>
                <h3 className="font-haber font-bold text-lg text-ana leading-tight">
                  {p.etiket}
                </h3>
                <p className="text-[11px] text-ikincil/70 leading-snug mt-1 min-h-[32px]">
                  {p.aciklama}
                </p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="font-haber text-3xl font-black text-ana tabular-nums">
                    £{p.aylikFiyatGBP}
                  </span>
                  <span className="text-xs text-ikincil/60 pb-1.5">/ay</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1 text-[10px] text-ikincil/70 font-semibold">
                  <div className="bg-ikincil-kapsayici/60 rounded-lg p-1.5 text-center">
                    <div className="font-black text-ana text-sm tabular-nums">
                      {p.ilanKredisi}
                    </div>
                    {t("krediIlan")}
                  </div>
                  <div className="bg-ikincil-kapsayici/60 rounded-lg p-1.5 text-center">
                    <div className="font-black text-altin-cila text-sm tabular-nums">
                      {p.vitrinKredisi}
                    </div>
                    {t("krediVitrin")}
                  </div>
                  <div className="bg-ikincil-kapsayici/60 rounded-lg p-1.5 text-center">
                    <div className="font-black text-ikincil text-sm tabular-nums">
                      {p.cvHakki >= 9999 ? "∞" : p.cvHakki}
                    </div>
                    {t("krediCV")}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mineral-kart p-5 rounded-2xl space-y-4">
          <h4 className="font-haber font-bold text-ana">Ek Hizmetler</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                anahtar: "vitrin",
                baslik: t("addonOneCikan"),
                aciklama: "İlanınız ana sayfada 48 saat öne çıkarılır.",
                fiyat: vitrinFiyat,
                deger: ekVitrin,
                degistir: setEkVitrin,
                ikon: "campaign",
              },
              {
                anahtar: "acil",
                baslik: t("addonAcil"),
                aciklama: "Kırmızı etiket ile öncelikli gösterilir.",
                fiyat: acilFiyat,
                deger: ekAcil,
                degistir: setEkAcil,
                ikon: "notifications_active",
              },
            ].map((ek) => (
              <div
                key={ek.anahtar}
                className="p-4 rounded-xl bg-ikincil-kapsayici/40 border border-ana-outline/30"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ana-kapsayici flex items-center justify-center shrink-0">
                    <span className="msimge text-ana text-xl">{ek.ikon}</span>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-sm text-ana">
                      {ek.baslik}
                    </h5>
                    <p className="text-[11px] text-ikincil/70 leading-snug mt-0.5">
                      {ek.aciklama}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex rounded-xl bg-beyaz border border-ana-outline/30 p-0.5">
                    <button
                      type="button"
                      onClick={() => ek.degistir(Math.max(0, ek.deger - 1))}
                      className="w-9 h-9 rounded-lg text-ikincil hover:bg-ikincil-kapsayici font-bold text-lg"
                    >
                      −
                    </button>
                    <div className="w-10 h-9 flex items-center justify-center font-bold text-ana tabular-nums">
                      {ek.deger}
                    </div>
                    <button
                      type="button"
                      onClick={() => ek.degistir(Math.min(10, ek.deger + 1))}
                      className="w-9 h-9 rounded-lg text-ikincil hover:bg-ikincil-kapsayici font-bold text-lg"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="font-haber font-bold text-ana tabular-nums">
                      £{(ek.fiyat * ek.deger).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-ikincil/60 font-semibold">
                      £{ek.fiyat}/adet
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mineral-kart p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-haber font-bold text-ana">
              Hibrit 3 Kanallı Ödeme
            </h4>
            <Rozet tur="basari" ikon="lock" kucuk>
              SSL · PCI DSS
            </Rozet>
          </div>
          <div className="grid grid-cols-3 gap-2 p-1 bg-ikincil-kapsayici/60 rounded-2xl">
            {[
              {
                id: "banka",
                etiket: t("odemeBanka"),
                ikon: "account_balance",
              },
              {
                id: "mobi",
                etiket: t("odemeMobi"),
                ikon: "sms_failed",
              },
              {
                id: "kripto",
                etiket: t("odemeKripto"),
                ikon: "currency_bitcoin",
              },
            ].map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKanal(k.id as OdemeKanali)}
                className={sb(
                  "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
                  kanal === k.id
                    ? "bg-ana text-beyaz shadow-mineral-dosye"
                    : "text-ikincil hover:text-ana"
                )}
              >
                <span className="msimge text-2xl">{k.ikon}</span>
                <span className="text-[11px] font-semibold leading-tight text-center">
                  {k.etiket}
                </span>
              </button>
            ))}
          </div>

          {kanal === "banka" && (
            <div className="camsi-kart p-4 rounded-2xl space-y-2 text-xs border-altin-cila/40">
              <div className="flex items-center gap-2 text-altin-cila font-bold">
                <span className="msimge">savings</span>
                Banka Havalesi / FAST (KT · GBP)
              </div>
              <div className="grid sm:grid-cols-3 gap-2 text-[11px]">
                <div className="bg-beyaz/70 rounded-lg p-2">
                  <div className="text-ikincil/60 font-semibold">IBAN</div>
                  <div className="font-mono font-bold text-ana tabular-nums">
                    GB97 BUKB 2020 1570 1111 88
                  </div>
                </div>
                <div className="bg-beyaz/70 rounded-lg p-2">
                  <div className="text-ikincil/60 font-semibold">Alıcı</div>
                  <div className="font-bold text-ana">İşBulKKTC A.Ş.</div>
                </div>
                <div className="bg-beyaz/70 rounded-lg p-2">
                  <div className="text-ikincil/60 font-semibold">Sipariş No</div>
                  <div className="font-mono font-bold text-ikincil">
                    ISB-2026-18142
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-ikincil/70 leading-snug">
                Dekontunuzu{" "}
                <span className="font-bold text-ana">finans@isbulkktc.ku</span>{" "}
                adresine IBAN alanını belirterek iletin. 2 saat içinde onay.
              </p>
            </div>
          )}

          {kanal === "mobi" && (
            <div className="camsi-kart p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-ana font-bold">
                <span className="msimge">smartphone</span>
                Mobipaid / Telsim / KKTCell SMS ile Ödeme
              </div>
              <p className="text-[11px] text-ikincil/70 leading-snug">
                Cep telefonunuza gönderilecek tek kullanımlık ödeme linki ile
                3D Secure olmadan 90 saniyede tamamlayın.
              </p>
              <div className="flex gap-2">
                <input
                  className="girdi flex-1"
                  placeholder="+90 (533) 123 45 67"
                />
                <Buton tur="buton" varyant="ikincil" boyut="md">
                  Link Gönder
                </Buton>
              </div>
            </div>
          )}

          {kanal === "kripto" && (
            <div className="camsi-kart p-4 rounded-2xl space-y-3 text-xs border-altin-cila/40">
              <div className="flex items-center gap-2 text-altin-cila font-bold">
                <span className="msimge">bolt</span>
                USDC on Base — Etherscan doğruluğunda
              </div>
              <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-center">
                <div className="bg-beyaz rounded-xl p-3 space-y-1">
                  <div className="text-[10px] text-ikincil/60 font-semibold uppercase">
                    Base Ağ USDC Adresi
                  </div>
                  <div className="font-mono text-[11px] break-all text-ana font-bold">
                    0x76F79Dc9f53c02FEBb74A76ED3b25a93c442B90F
                  </div>
                </div>
                <div className="w-28 h-28 shrink-0 bg-beyaz rounded-xl grid place-items-center border-4 border-beyaz">
                  <div className="w-full h-full bg-ana rounded-[8px] grid grid-cols-5 grid-rows-5 gap-[2px] p-2">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className={sb(
                          "rounded-sm",
                          (i * 7) % 3 === 0 ? "bg-beyaz" : "bg-transparent"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-ikincil/70 leading-snug">
                Transfer olduktan sonra TXID ile onay alın. Zincir üstü 6 blok
                (yaklaşık 12 saniye) sonrası bakiyeniz tanımlanır.
              </p>
            </div>
          )}
        </div>
      </div>

      <aside className="sticky top-28 self-start space-y-4">
        <div className="mineral-kart p-5 rounded-2xl space-y-4">
          <h4 className="font-haber font-bold text-ana flex items-center gap-2">
            <span className="msimge text-ikincil">receipt_long</span>
            Sipariş Özeti
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-ikincil">{secili.etiket}</span>
              <span className="font-semibold tabular-nums">
                £{paketTutar.toFixed(2)}
              </span>
            </div>
            {ekVitrin > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-ikincil">
                  Ana Sayfa Vitrin × {ekVitrin}
                </span>
                <span className="font-semibold tabular-nums">
                  £{(ekVitrin * vitrinFiyat).toFixed(2)}
                </span>
              </div>
            )}
            {ekAcil > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-ikincil">Acil Rozet × {ekAcil}</span>
                <span className="font-semibold tabular-nums">
                  £{(ekAcil * acilFiyat).toFixed(2)}
                </span>
              </div>
            )}
            <div className="h-px bg-ana-outline/30 my-2" />
            <div className="flex justify-between text-sm">
              <span className="text-ikincil/80">Ara Toplam</span>
              <span className="font-semibold tabular-nums">
                £{araToplam.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ikincil/80">
                KDV %{Math.round(kdvOran * 100)} (89/2007)
              </span>
              <span className="font-semibold tabular-nums">
                £{kdv.toFixed(2)}
              </span>
            </div>
            <div className="h-px bg-ana-outline/30 my-2" />
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.12em] font-black text-ikincil/60">
                  Genel Toplam
                </div>
                <div className="text-[10px] text-ikincil/60 font-semibold">
                  USDC/TRY/GBP kabul edilir
                </div>
              </div>
              <div className="font-haber font-black text-3xl text-ana tabular-nums">
                £{toplam.toFixed(2)}
              </div>
            </div>
          </div>
          <Buton tur="buton" varyant="ana" boyut="blok" ikon="check_circle">
            Siparişi Onayla ve Öde
          </Buton>
          <div className="bg-basari-900/10 border border-basari-900/20 rounded-xl p-3 text-[11px] leading-snug text-basari-900 font-semibold flex items-start gap-2">
            <span className="msimge text-base shrink-0">policy</span>
            14 gün cayma hakkı · PES Lisans 2024/9182 uyarınca ilan kredileri
            kullanılmamışsa %100 iade.
          </div>
        </div>
        <div className="mineral-kart p-4 rounded-2xl flex items-center gap-3">
          <div className="grid grid-cols-3 gap-1.5">
            {["vpn_lock", "cloud_done", "verified"].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-lg bg-ana-kapsayici grid place-items-center"
              >
                <span className="msimge text-ana">{i}</span>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-ikincil/75 leading-snug">
            Tüm ödemeler <b className="text-ana">Cloudflare WAF</b> +{" "}
            <b className="text-ana">Supabase Row Level Security</b> ile
            korunur.
          </div>
        </div>
      </aside>
    </div>
  );
}
