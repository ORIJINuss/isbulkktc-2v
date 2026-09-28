import type { IsverenKayitTipi } from "@/lib/veri/isveren-kayit-sema";
import type { IsverenIlanFormuTipi } from "@/lib/veri/isveren-ilan-formu-sema";
import type { Ilan, IlanDurumu } from "@/lib/veri/ilan-tipi";
import { slugla } from "@/lib/yardimcilar/bicimlendiriciler";

export type Isveren = {
  id: string;
  sirketAdi: string;
  b3SirketNo: string;
  vergiKimlikNo: string;
  kurumsalEmail: string;
  createdAt: string;
  onayDurumu: "Beklemede" | "Onayli" | "Reddedildi";
  ilanKredisi: number;
  vitrinKredisi: number;
  cvHavuzuErisimi: boolean;
  logoUrl?: string;
  sektorKodu?: string;
  webSitesi?: string;
  tanitim?: string;
};

export type YayinlanmisIlan = Ilan & { isverenId: string };

export type PaketSeviyesi = "baslangic" | "standart" | "profesyonel" | "kurumsal";

const deneyimSeviyesindenYila = (seviye: "JUN" | "MID" | "LEAD"): number => {
  switch (seviye) {
    case "JUN":
      return 0;
    case "MID":
      return 3;
    case "LEAD":
      return 6;
  }
};

export default class IsverenServisi {
  private isverenler: Isveren[];

  constructor(isverenler?: Isveren[]) {
    this.isverenler = isverenler ?? [
      {
        id: "isveren-1",
        sirketAdi: "Arkin Tech Yazılım A.Ş.",
        b3SirketNo: "B3-998123-LFKO",
        vergiKimlikNo: "0301 02345 67890",
        kurumsalEmail: "hr@arkintech.ku",
        createdAt: "2024-02-11T10:00:00.000Z",
        onayDurumu: "Onayli",
        ilanKredisi: 17,
        vitrinKredisi: 3,
        cvHavuzuErisimi: true,
        sektorKodu: "TEKNOLOJI",
        webSitesi: "https://arkintech.ku",
        tanitim:
          "Lefkoşa merkezli turtech girişimi. KKTC'de 70+ çalışan, Next.js 14 App Router, Supabase ve Pearl Field Mineral Editorial tasarım sistemi ile ürünler geliştirir.",
      },
    ];
  }

  async kayitOlustur(veri: IsverenKayitTipi): Promise<Isveren> {
    const yeni: Isveren = {
      id: `isveren-${Date.now()}`,
      sirketAdi: veri.sirketAdi,
      b3SirketNo: veri.b3SirketNo ?? "",
      vergiKimlikNo: veri.vergiKimlikNo,
      kurumsalEmail: veri.yetkiliEposta,
      createdAt: new Date().toISOString(),
      onayDurumu: "Beklemede",
      ilanKredisi: 0,
      vitrinKredisi: 0,
      cvHavuzuErisimi: false,
      sektorKodu: veri.naceKodu,
    };
    this.isverenler = [yeni, ...this.isverenler];
    return yeni;
  }

  async getir(id: string): Promise<Isveren | null> {
    return this.isverenler.find((i) => i.id === id) ?? null;
  }

  async b3NoIleAra(b3No: string): Promise<Isveren | null> {
    return this.isverenler.find((i) => i.b3SirketNo === b3No) ?? null;
  }

  async ilanYayinla(
    isverenId: string,
    form: IsverenIlanFormuTipi,
    taslakMi = false
  ): Promise<YayinlanmisIlan> {
    const isveren = await this.getir(isverenId);
    if (!isveren) throw new Error("İşveren bulunamadı");
    if (!taslakMi && isveren.ilanKredisi <= 0) {
      throw new Error("Yayınlamak için yeterli ilan krediniz yok.");
    }
    const slug = slugla(form.temel.ilanBasligi);
    const minDeneyimYili = deneyimSeviyesindenYila(form.eslestirme.deneyimSeviyesi);
    const durum: IlanDurumu = taslakMi ? "TASLAK" : "AKTIF";

    const ilan: YayinlanmisIlan = {
      slug,
      isverenId,
      referansNo: `ISB-${new Date().getFullYear()}-${Math.round(Math.random() * 90000 + 10000)}`,
      pozisyonBasligi: form.temel.ilanBasligi,
      sirketAdi: isveren.sirketAdi,
      sirketKodu: isveren.b3SirketNo.slice(0, 6),
      sektorKodu: form.temel.sektorKodu,
      ilceler: form.temel.ilceKodlari,
      izinTipleri: form.yasal.izinTipiKodlari,
      calismaSekli: form.temel.calismaSekliKodu,
      calismaModeli: form.temel.calismaModeli,
      maasAraligi: form.maas.maasGizle
        ? { gizli: true, min: 0, mak: 0, para: "GBP" }
        : {
            gizli: false,
            min: form.maas.minNetAylik,
            mak: form.maas.makNetAylik,
            para: form.maas.paraBirimi,
          },
      yanHaklar: form.maas.yanHakKodlari,
      isTanimi: form.temel.isTanimi,
      zorunluBeceriler: form.eslestirme.zorunluBeceriler,
      minDeneyimYili,
      yabanciDilSeviyesi:
        form.eslestirme.yabanciDilSeviyesi === "YOK"
          ? []
          : [
              {
                dil: form.eslestirme.yabanciDilSeviyesi === "RU_B2" ? "RU" : "EN",
                seviye: form.eslestirme.yabanciDilSeviyesi === "RU_B2"
                  ? "B2"
                  : form.eslestirme.yabanciDilSeviyesi,
              },
            ],
      aiEslestirme: {
        skor: form.eslestirme.atsEsikYuzdesi,
        gerekce:
          "İşveren formunda zorunlu kılınan beceri, deneyim ve dil seviyesi ile aday havuzunda eşleşen 120+ profilden otomatik sıralama.",
        oneriler: form.eslestirme.zorunluBeceriler.slice(0, 5),
      },
      atsSkorEsigi: form.eslestirme.atsEsikYuzdesi,
      yayinTarihi: new Date().toISOString(),
      sonBasvuruTarihi: new Date(Date.now() + 30 * 864e5).toISOString(),
      goruntulenmeSayisi: 0,
      basvuruSayisi: 0,
      b3OnayliMi: isveren.onayDurumu === "Onayli",
      acilMi: form.paket?.acilRozeti ?? false,
      durum,
      // GERİYE DÖNÜK ALIASLAR (deprecated):
      id: `ilan-${Date.now()}`,
      baslik: form.temel.ilanBasligi,
      ilce: form.temel.ilceKodlari[0],
      minNetAylik: form.maas.maasGizle ? 0 : form.maas.minNetAylik,
      makNetAylik: form.maas.maasGizle ? 0 : form.maas.makNetAylik,
      atsYuzdesi: form.eslestirme.atsEsikYuzdesi,
      sektor: form.temel.sektorKodu,
      pozisyonTanimi: form.temel.isTanimi.split("\n").filter(Boolean),
      teknikYetenekler: [
        {
          grup: "Zorunlu Teknik Beceriler",
          etiketler: form.eslestirme.zorunluBeceriler,
        },
      ],
      b3Onayli: isveren.onayDurumu === "Onayli",
      acilIlan: form.paket?.acilRozeti ?? false,
    };
    if (!taslakMi) {
      isveren.ilanKredisi = Math.max(0, isveren.ilanKredisi - 1);
      if (form.paket?.vitrinOdeme) {
        isveren.vitrinKredisi = Math.max(0, isveren.vitrinKredisi - 1);
      }
      if (form.paket?.cvHavuzuErisim) {
        isveren.cvHavuzuErisimi = true;
      }
    }
    return ilan;
  }

  async paketUygula(
    isverenId: string,
    paket: PaketSeviyesi
  ): Promise<{ yeniKrediler: { ilan: number; vitrin: number }; faturaTutar: number }> {
    const tablo: Record<
      PaketSeviyesi,
      { ilan: number; vitrin: number; fiyat: number }
    > = {
      baslangic: { ilan: 3, vitrin: 1, fiyat: 149 },
      standart: { ilan: 10, vitrin: 3, fiyat: 420 },
      profesyonel: { ilan: 25, vitrin: 8, fiyat: 949 },
      kurumsal: { ilan: 50, vitrin: 15, fiyat: 1799 },
    };
    const secili = tablo[paket];
    const isveren = await this.getir(isverenId);
    if (!isveren) throw new Error("İşveren bulunamadı");
    isveren.ilanKredisi += secili.ilan;
    isveren.vitrinKredisi += secili.vitrin;
    isveren.cvHavuzuErisimi =
      isveren.cvHavuzuErisimi || paket === "profesyonel" || paket === "kurumsal";
    return {
      yeniKrediler: { ilan: secili.ilan, vitrin: secili.vitrin },
      faturaTutar: secili.fiyat,
    };
  }
}
