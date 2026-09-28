import DogrulamaServisi from "./dogrulama-servisi";

export type CVParcalanmis = {
  adSoyad?: string;
  eposta?: string;
  telefon?: string;
  sehir?: string;
  egitim: { okul: string; bolum: string; yil?: string }[];
  deneyim: { sirket: string; pozisyon: string; sureAy: number; aciklama?: string }[];
  beceriler: string[];
  diller: { dil: string; seviye: string }[];
  sertifikalar: { ad: string; kurum: string; yil?: string }[];
  ozet?: string;
};

export type ATSSkoru = {
  toplam: number;
  beceri: number;
  deneyim: number;
  dil: number;
  format: number;
  etiket: string;
  iyilestirmeOnerileri: string[];
};

export type IslemeKuyrugu = {
  id: string;
  dosyaAdi: string;
  adayId?: string;
  boyut: number;
  durum: "Kuyrukta" | "Isleniyor" | "Basarili" | "Basarisiz";
  olusturulma: string;
  baslama?: string;
  bitis?: string;
  hata?: string;
  atsSkoru?: ATSSkoru;
};

export default class CVIslemeServisi {
  private kuyruk: IslemeKuyrugu[];
  private dogrulama: DogrulamaServisi;

  constructor(kuyruk?: IslemeKuyrugu[]) {
    this.kuyruk = kuyruk ?? [];
    this.dogrulama = new DogrulamaServisi();
  }

  private idUret(): string {
    return `cv-is-${Date.now()}-${Math.round(Math.random() * 999)}`;
  }

  async cvYukleVeParcala(
    dosyaAdi: string,
    _icerik: ArrayBuffer,
    adayId?: string
  ): Promise<IslemeKuyrugu> {
    const desteklenen = ["pdf", "docx", "doc", "txt"];
    const uzanti = dosyaAdi.split(".").pop()?.toLowerCase() ?? "";
    if (!desteklenen.includes(uzanti)) {
      throw new Error(`Desteklenmeyen dosya biçimi: .${uzanti}`);
    }
    const gorev: IslemeKuyrugu = {
      id: this.idUret(),
      dosyaAdi,
      adayId,
      boyut: Math.max(50_000, Math.round(Math.random() * 1.2e6)),
      durum: "Kuyrukta",
      olusturulma: new Date().toISOString(),
    };
    this.kuyruk = [gorev, ...this.kuyruk];
    return gorev;
  }

  async islemeBaslat(gorevId: string): Promise<IslemeKuyrugu> {
    const g = this.kuyruk.find((x) => x.id === gorevId);
    if (!g) throw new Error("Görev bulunamadı");
    g.durum = "Isleniyor";
    g.baslama = new Date().toISOString();
    await new Promise((r) => setTimeout(r, 400));
    const ortalama = 58 + Math.round(Math.random() * 35);
    const beceri = Math.max(35, Math.min(100, ortalama + Math.round((Math.random() - 0.4) * 20)));
    const deneyim = Math.max(30, Math.min(100, ortalama - 4 + Math.round((Math.random() - 0.5) * 14)));
    const dil = Math.max(20, Math.min(100, ortalama - 10 + Math.round((Math.random() - 0.5) * 18)));
    const format = Math.max(40, Math.min(100, ortalama + 4 + Math.round((Math.random() - 0.3) * 12)));
    const toplam = Math.round((beceri + deneyim + dil + format) / 4);
    const etiket =
      toplam >= 90
        ? "Mükemmel"
        : toplam >= 80
        ? "Çok Yüksek"
        : toplam >= 70
        ? "Yüksek"
        : toplam >= 55
        ? "Orta"
        : "Geliştirilmeli";

    const oneriler = this.iyilestirmeOnerileri({ beceri, deneyim, dil, format, toplam });
    g.durum = "Basarili";
    g.bitis = new Date().toISOString();
    g.atsSkoru = { toplam, beceri, deneyim, dil, format, etiket, iyilestirmeOnerileri: oneriler };
    return g;
  }

  private iyilestirmeOnerileri(skor: Omit<ATSSkoru, "etiket" | "iyilestirmeOnerileri">): string[] {
    const liste: string[] = [];
    if (skor.beceri < 75) {
      liste.push(
        "Beceri bölümünü 8-12 arası endüstri standardı anahtar kelime (Next.js, Supabase vb.) ile zenginleştirin."
      );
    }
    if (skor.deneyim < 70) {
      liste.push(
        "Her iş deneyiminin başarı metriklerini sayısal (%, ₺, kullanıcı) ifadelerle tamamlayın."
      );
    }
    if (skor.dil < 65) {
      liste.push(
        "Resmi CEFR seviyelerini (C1 Advanced vb.) ekleyin ve dil sertifikası numaralarını belirtin."
      );
    }
    if (skor.format < 70) {
      liste.push(
        "CV'yi tek sütun, ters kronolojik, 2 sayfa ile sınırlandırın; Arial veya Hanken Grotesk kullanın."
      );
    }
    if (skor.toplam < 80) {
      liste.push(
        "İlan başlığına özel becerileri özet sayfanızın ilk 100 kelimesine yerleştirerek akıllı sıralamada yükselin."
      );
    }
    return liste;
  }

  async mockParcalama(dosyaAdi: string): Promise<CVParcalanmis> {
    const [ad = "", soyad = ""] = dosyaAdi
      .replace(/\.[^.]+$/, "")
      .split(/[_\s-]+/);
    const varsayilanBeceri = [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Supabase",
      "React",
    ];
    return {
      adSoyad: `${ad} ${soyad}`.trim() || "Aday Aday",
      eposta: "aday@ornek.ku",
      telefon: "+90 533 000 00 00",
      sehir: "Lefkoşa",
      egitim: [
        {
          okul: "Doğu Akdeniz Üniversitesi",
          bolum: "Bilgisayar Mühendisliği",
          yil: "2018 - 2022",
        },
      ],
      deneyim: [
        {
          sirket: "Yerel Teknoloji Şirketi",
          pozisyon: "Frontend Geliştirici",
          sureAy: 30,
          aciklama: "Next.js tabanlı admin ve müşteri panelleri geliştirildi.",
        },
      ],
      beceriler: varsayilanBeceri,
      diller: [
        { dil: "Türkçe", seviye: "Anadil" },
        { dil: "İngilizce", seviye: "C1" },
      ],
      sertifikalar: [{ ad: "IELTS Academic", kurum: "British Council", yil: "2023" }],
      ozet:
        "Öğrenmeye açık, Next.js 14 ve UI mühendisliği alanında uzmanlaşan yazılım geliştirici.",
    };
  }

  async gorevDurumu(gorevId: string): Promise<IslemeKuyrugu | null> {
    return this.kuyruk.find((k) => k.id === gorevId) ?? null;
  }

  async adayinGorevleri(adayId: string): Promise<IslemeKuyrugu[]> {
    return this.kuyruk
      .filter((k) => k.adayId === adayId)
      .sort((a, b) => (a.olusturulma < b.olusturulma ? 1 : -1));
  }

  async ilanIleAtsEslesmesi(
    ats: ATSSkoru,
    ilanBeceriAnahtarlari: string[],
    ilanMinDeneyimAy: number,
    ilanDilSeviye: string
  ): Promise<{ uyum: number; eksik: string[]; bonus: string[] }> {
    const eksik: string[] = [];
    const bonus: string[] = [];
    let uyum = ats.toplam;
    const ilanBeceriSeti = new Set(
      ilanBeceriAnahtarlari.map((b) => b.toLowerCase())
    );
    const cvParcasi = await this.mockParcalama("ornek.pdf");
    const cvSet = new Set(cvParcasi.beceriler.map((b) => b.toLowerCase()));
    let eslesen = 0;
    for (const anahtar of ilanBeceriSeti) {
      if (cvSet.has(anahtar)) eslesen++;
      else eksik.push(anahtar);
    }
    const oran =
      ilanBeceriSeti.size === 0 ? 1 : eslesen / ilanBeceriSeti.size;
    uyum = Math.round(uyum * 0.75 + oran * 100 * 0.25);
    const adayToplamDeneyim = cvParcasi.deneyim.reduce((a, d) => a + d.sureAy, 0);
    if (adayToplamDeneyim >= ilanMinDeneyimAy) {
      bonus.push("Deneyim eşiğini karşılıyor");
      uyum = Math.min(100, uyum + 3);
    } else {
      eksik.push(`Minimum ${ilanMinDeneyimAy} ay deneyim`);
      uyum = Math.max(0, uyum - 8);
    }
    const seviyeSirasi = ["A1", "A2", "B1", "B2", "C1", "C2", "Anadil"];
    const adaySeviye = cvParcasi.diller[0]?.seviye ?? "B1";
    if (seviyeSirasi.indexOf(adaySeviye) >= seviyeSirasi.indexOf(ilanDilSeviye)) {
      bonus.push("Yabancı dil eşiği geçiliyor");
      uyum = Math.min(100, uyum + 2);
    } else {
      eksik.push(`Dil seviyesi en az ${ilanDilSeviye} olmalı`);
    }
    return { uyum: Math.max(0, Math.min(100, uyum)), eksik, bonus };
  }
}
