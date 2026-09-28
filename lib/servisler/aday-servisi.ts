import type { AdayKayitTipi } from "@/lib/veri/aday-kayit-sema";
import type { Ilan } from "@/lib/veri/ilan-tipi";

export type Aday = {
  id: string;
  adSoyad: string;
  email: string;
  cepTelefonu: string;
  ikametDurumu: string;
  createdAt: string;
  b3OnayliMi: boolean;
  atsSkor: number;
  fotografUrl?: string;
};

export type Basvuru = {
  id: string;
  adayId: string;
  ilanId: string;
  izinTipi: string;
  kapakMetni?: string;
  cvDosyasi?: string;
  tarih: string;
  durum:
    | "Gonderildi"
    | "AIFiltre"
    | "IsverenGoruldu"
    | "MulakatCagrildi"
    | "Olumlu"
    | "Olumsuz"
    | "Arsiv";
};

export default class AdayServisi {
  private adaylar: Aday[];
  private basvurular: Basvuru[];

  constructor(
    adaylar?: Aday[],
    basvurular?: Basvuru[]
  ) {
    this.adaylar = adaylar ?? [
      {
        id: "aday-1",
        adSoyad: "Ahmet Yılmaz",
        email: "ahmet.yilmaz@email.ku",
        cepTelefonu: "+90 533 123 45 67",
        ikametDurumu: "vatandas",
        createdAt: "2025-08-12T10:00:00.000Z",
        b3OnayliMi: true,
        atsSkor: 88,
      },
      {
        id: "aday-2",
        adSoyad: "Selin Deniz",
        email: "selin.deniz@email.ku",
        cepTelefonu: "+90 542 987 65 43",
        ikametDurumu: "normal-2-yil",
        createdAt: "2025-11-02T10:00:00.000Z",
        b3OnayliMi: false,
        atsSkor: 74,
      },
    ];
    this.basvurular = basvurular ?? [
      {
        id: "basvuru-1",
        adayId: "aday-1",
        ilanId: "ilan-1",
        izinTipi: "vatandas",
        kapakMetni:
          "Next.js 14 ve Pearl Field Mineral tasarım sistemleri konusunda 4+ yıllık deneyimimle ekibinize değer katmak istiyorum.",
        tarih: "2026-03-17T10:00:00.000Z",
        durum: "MulakatCagrildi",
      },
    ];
  }

  async kayitOlustur(veri: AdayKayitTipi): Promise<Aday> {
    const yeni: Aday = {
      id: `aday-${Date.now()}`,
      adSoyad: veri.adSoyad,
      email: veri.email,
      cepTelefonu: veri.cepTelefonu,
      ikametDurumu: veri.ikametDurumu,
      createdAt: new Date().toISOString(),
      b3OnayliMi: false,
      atsSkor: 0,
    };
    this.adaylar = [yeni, ...this.adaylar];
    return yeni;
  }

  async getir(id: string): Promise<Aday | null> {
    return this.adaylar.find((a) => a.id === id) ?? null;
  }

  async guncelle(id: string, duzeltme: Partial<Aday>): Promise<Aday> {
    const indis = this.adaylar.findIndex((a) => a.id === id);
    if (indis === -1) throw new Error("Aday bulunamadı");
    this.adaylar[indis] = { ...this.adaylar[indis], ...duzeltme };
    return this.adaylar[indis];
  }

  async cvGuncelle(id: string, _cvBuffer: ArrayBuffer, _dosyaAdi: string): Promise<{ yeniAtsSkor: number }> {
    const yeniSkor = Math.min(98, Math.max(55, 40 + Math.round(Math.random() * 55)));
    await this.guncelle(id, { atsSkor: yeniSkor });
    return { yeniAtsSkor: yeniSkor };
  }

  async basvur(
    adayId: string,
    ilan: Ilan,
    izinTipi: string,
    ek?: { kapakMetni?: string; cvDosyasi?: string }
  ): Promise<Basvuru> {
    const ilanAnahtari = (ilan as Partial<{ id?: string }>).id ?? ilan.referansNo ?? ilan.slug;
    const yeni: Basvuru = {
      id: `basvuru-${Date.now()}`,
      adayId,
      ilanId: ilanAnahtari,
      izinTipi,
      kapakMetni: ek?.kapakMetni,
      cvDosyasi: ek?.cvDosyasi,
      tarih: new Date().toISOString(),
      durum: "AIFiltre",
    };
    this.basvurular = [yeni, ...this.basvurular];
    return yeni;
  }

  async adayinBasvulari(adayId: string): Promise<Basvuru[]> {
    return [...this.basvurular]
      .filter((b) => b.adayId === adayId)
      .sort((a, b) => (a.tarih < b.tarih ? 1 : -1));
  }

  aktifAtsSeviyesi(skor: number): string {
    if (skor >= 90) return "Mükemmel";
    if (skor >= 80) return "Çok Yüksek";
    if (skor >= 70) return "Yüksek";
    if (skor >= 55) return "Orta";
    return "Geliştirilmeli";
  }
}
