import type {
  Ilan,
  IlanFiltreleri,
  IlceKodu,
  YanHakKodu,
  CalismaSekliKodu,
  IzinTipiKodu,
  ParaBirimiKodu,
  CalismaModeliKodu,
} from "@/lib/veri/ilan-tipi";
import { YAN_HAKLAR } from "@/lib/sabitler/alan-degiskenleri";

export type TeknikYetenekGrubu = {
  grup: string;
  etiketler: string[];
};

export type EskiIlanEkMeta = {
  tanitim: string;
  pozisyonTanimi: string[];
  teknikYetenekler: TeknikYetenekGrubu[];
  sirketAciklamasi: string;
  ilceUzunIsim: string;
  sektorAciklama: string;
  calismaSekliAciklama: string;
  izinTipiAciklama: string;
};

const yanHakKodunaCevir = (aciklama: string): YanHakKodu | null => {
  const haritamiz: Record<string, YanHakKodu> = {
    lojman: "LOJMAN",
    "personel servisi": "SERVIS",
    servis: "SERVIS",
    saglik: "SAGLIK",
    "saglik sigortasi": "SAGLIK",
    yemek: "YEMEK",
    sodexo: "YEMEK",
    ucak: "UCAK",
    "yillik ucak": "UCAK",
    ekipman: "EKIPMAN",
    mac: "EKIPMAN",
    studio: "EKIPMAN",
    spor: "SPOR",
    salon: "SPOR",
    egitim: "EGITIM",
    sertifika: "EGITIM",
    konferans: "EGITIM",
  };
  const anahtar = aciklama.toLowerCase();
  for (const [kelime, kod] of Object.entries(haritamiz)) {
    if (anahtar.includes(kelime)) return kod;
  }
  const tanimliKod = YAN_HAKLAR.find(
    (y) => y.deger.toLowerCase() === anahtar || y.etiket === aciklama
  );
  return tanimliKod ? (tanimliKod.deger as YanHakKodu) : null;
};

const ilcedenKodaCevir = (ilceUzunIsim: string): IlceKodu[] => {
  const haritamiz: Record<string, IlceKodu> = {
    lefkosa: "LEF",
    nicosia: "LEF",
    kösklüçiftlik: "LEF",
    "organize sanayi": "LEF",
    girne: "GIR",
    kyrenia: "GIR",
    alsancak: "GIR",
    merkez: "GIR",
    bellapais: "GIR",
    "karaoğlanoğlu": "GIR",
    gazimağusa: "GAM",
    famagusta: "GAM",
    "daü teknopark": "GAM",
    iskele: "ISK",
    güzelyurt: "GUZ",
    morphou: "GUZ",
    lefke: "LEFKE",
    lefka: "LEFKE",
  };
  const bulunanlar = new Set<IlceKodu>();
  const anahtar = ilceUzunIsim.toLowerCase();
  for (const [kelime, kod] of Object.entries(haritamiz)) {
    if (anahtar.includes(kelime)) bulunanlar.add(kod);
  }
  if (bulunanlar.size === 0) bulunanlar.add("KKTC");
  return Array.from(bulunanlar);
};

const eskiSekildenYeniSekle = (
  eskiKod: string
): CalismaSekliKodu | null => {
  const haritamiz: Record<string, CalismaSekliKodu> = {
    TAM: "TAM_ZAMANLI",
    YARI: "YARI_ZAMANLI",
    FREELANCE: "FREELANCE",
    SEZON: "SEZONLUK",
    STAJ: "STAJYER",
  };
  return haritamiz[eskiKod] ?? null;
};

const izinKodunuDogrula = (kod: string): IzinTipiKodu[] => {
  const gecerli: IzinTipiKodu[] = [
    "VATANDAS",
    "YOK",
    "NORMAL_1",
    "NORMAL_2",
    "OGRENCI",
  ];
  const dogru = gecerli.find((g) => g === kod);
  return dogru ? [dogru] : ["YOK"];
};

const paraKodunuDogrula = (p: string): ParaBirimiKodu => {
  const gecerli: ParaBirimiKodu[] = ["GBP", "TRY", "USD", "EUR"];
  const c = gecerli.find((g) => g === p);
  return c ?? "GBP";
};

const calismaModeliCikar = (
  sekilAciklama: string,
  sekil: string
): CalismaModeliKodu => {
  const a = `${sekilAciklama} ${sekil}`.toLowerCase();
  if (a.includes("hibrit")) return "HIBRIT";
  if (a.includes("uzaktan") || a.includes("remote")) return "UZAKTAN";
  return "OFISTE";
};

const becerileriDuzlestir = (
  teknikYetenekler: TeknikYetenekGrubu[]
): string[] => {
  return teknikYetenekler.flatMap((grup) =>
    grup.etiketler.map((etiket) => etiket.trim())
  );
};

const isTanimiOlustur = (
  tanitim: string,
  pozisyonTanimi: string[]
): string => {
  const maddeler = pozisyonTanimi
    .map((satir) => `• ${satir}`)
    .join("\n");
  return `${tanitim}\n\n${maddeler}`.trim();
};

const tarih = (oncekiGun: number): string =>
  new Date(Date.now() - 1000 * 60 * 60 * 24 * oncekiGun).toISOString();

const sonBasvuruTarihiOlustur = (gunSonra: number): string =>
  new Date(Date.now() + 1000 * 60 * 60 * 24 * gunSonra).toISOString();

type HamIlan = {
  slug: string;
  referansNo: string;
  baslik: string;
  sirketAdi: string;
  sirketKodu: string;
  sirketAciklamasi: string;
  ilceUzunIsim: string;
  sektorAciklama: string;
  sektorKodu: string;
  calismaSekliAciklama: string;
  eskiCalismaSekliKodu: string;
  izinTipiAciklama: string;
  eskiIzinKodu: string;
  eskiIzinKisaltma: string;
  minNetAylik: number;
  makNetAylik: number;
  paraBirimiHam: string;
  b3OnayliMi: boolean;
  acilMi: boolean;
  goruntulenmeSayisi: number;
  basvuruSayisi: number;
  yayinGunOnce: number;
  bitisGunSonra: number;
  tanitim: string;
  pozisyonTanimi: string[];
  teknikYetenekler: TeknikYetenekGrubu[];
  yanHakAciklamalari: string[];
  atsYuzdesi: number;
  eslesmeGerekcesi: string;
  oneriler: string[];
};

const HAM_ILANLAR: HamIlan[] = [
  {
    slug: "kobi-finans-uzmani-lefkosa",
    referansNo: "İB-2026-0001",
    baslik: "KOBİ Finans Uzmanı",
    sirketAdi: "Akdeniz Bankası",
    sirketKodu: "AKDENIZ-BANKASI",
    sirketAciklamasi:
      "Akdeniz Bankası, KKTC genelinde şube ve dijital kanallardan hizmet veren, KKTC B3 İhtiyat Sandığı mevzuatına uygun faaliyet gösteren yerel bir bankadır.",
    ilceUzunIsim: "Lefkoşa (Lefkosa)",
    sektorAciklama: "Finans & Bankacılık",
    sektorKodu: "FINANS",
    calismaSekliAciklama: "Ofiste çalışma, haftada bir gün hibrit düzen",
    eskiCalismaSekliKodu: "TAM",
    izinTipiAciklama: "KKTC Vatandaşı",
    eskiIzinKodu: "VATANDAS",
    eskiIzinKisaltma: "VAT",
    minNetAylik: 2800,
    makNetAylik: 3800,
    paraBirimiHam: "GBP",
    b3OnayliMi: true,
    acilMi: false,
    goruntulenmeSayisi: 1842,
    basvuruSayisi: 96,
    yayinGunOnce: 2,
    bitisGunSonra: 28,
    tanitim:
      "Akdeniz Bankası KOBİ biriminde işletme ve girişimciler için finansal analiz yapacak bir KOBİ Finans Uzmanı arıyoruz.",
    pozisyonTanimi: [
      "KOBİ müşteri portföyündeki işletmelerin bilanço ve nakit akışı analizlerini yürüteceksiniz.",
      "Kredi başvurularını değerlendirip uygun ürün ve vade önerilerini müşteriye sunacaksınız.",
      "KOBİ kredi portföyünün risk izini takip ederek erken uyarı raporları hazırlayacaksınız.",
      "Şube ve dijital kanallarda işletmeler için finansal okuryazarlık eğitimleri düzenleyeceksiniz."
    ],
    teknikYetenekler: [
      {
        grup: "Finansal Analiz",
        etiketler: [
          "Bilanço analizi",
          "Nakit akışı takibi",
          "Kredi risk değerlendirme",
          "Finansal modelleme"
        ]
      },
      {
        grup: "Mevzuat",
        etiketler: [
          "KKTC B3 İhtiyat Sandığı mevzuatı",
          "Kambiyo mevzuatı",
          "Mesleki yeterlilik"
        ]
      },
      { grup: "Yazılım", etiketler: ["Excel ileri seviye", "Kredi skorlama modelleri"] }
    ],
    yanHakAciklamalari: ["saglik sigortasi", "yillik ucak", "egitim"],
    atsYuzdesi: 88,
    eslesmeGerekcesi:
      "KOBİ kredi analizi deneyimi ve KKTC bankacılık mevzuatına hâkimiyeti, pozisyonun teknik gereksinimleriyle yüksek ölçüde örtüşüyor.",
    oneriler: [
      "Excel ve finansal modelleme deneyiminizi somut proje örnekleriyle belirtin.",
      "KKTC B3 İhtiyat Sandığı mevzuatına ilişkin çalışmalarınızı özgeçmişte vurgulayın."
    ]
  },
  {
    slug: "otel-on-buro-muduru-girne",
    referansNo: "İB-2026-0002",
    baslik: "Otel Ön Büro Müdürü",
    sirketAdi: "Girne Sahil Otelcilik",
    sirketKodu: "GIRNE-SAHIL-OTELCILIK",
    sirketAciklamasi:
      "Girne Sahil Otelcilik, Girne sahil bandında 120 yataklı butik otel, kiralık daire ve etkinlik alanı işletmektedir.",
    ilceUzunIsim: "Girne",
    sektorAciklama: "Turizm & Otelcilik",
    sektorKodu: "TURIZM",
    calismaSekliAciklama: "Ofiste çalışma, sezon yoğunluğunda ek vardiya",
    eskiCalismaSekliKodu: "TAM",
    izinTipiAciklama: "Normal Çalışma İzni (1 Yıl)",
    eskiIzinKodu: "NORMAL_1",
    eskiIzinKisaltma: "N1",
    minNetAylik: 2100,
    makNetAylik: 2900,
    paraBirimiHam: "GBP",
    b3OnayliMi: true,
    acilMi: false,
    goruntulenmeSayisi: 1290,
    basvuruSayisi: 71,
    yayinGunOnce: 5,
    bitisGunSonra: 21,
    tanitim:
      "Girne sahilinde konumlanan 120 yataklı butik otelimizde, misafir deneyiminden sorumlu Ön Büro Müdürü arıyoruz.",
    pozisyonTanimi: [
      "Otel giriş, konaklama ve çıkış süreçlerini yürüterek misafir memnuniyetini ölçeceksiniz.",
      "KKTC B3 İhtiyat Sandığı kapsamındaki B3 belgeli personel ve misafir işlemlerini yöneteceksiniz.",
      "Otel gelirlerini oda doluluk oranı ve ek gelir kalemleriyle takip edeceksiniz.",
      "Sezonluk personel planlamasını ve vardiya çizelgelerini hazırlayacaksınız."
    ],
    teknikYetenekler: [
      {
        grup: "Otel Operasyonu",
        etiketler: ["Ön büro yönetimi", "Otel gelir yönetimi", "Misafir ilişkileri"]
      },
      {
        grup: "Mevzuat",
        etiketler: [
          "KKTC B3 İhtiyat Sandığı mevzuatı",
          "Konaklama ve turizm işletmeleri ruhsatı",
          "Mesleki yeterlilik"
        ]
      },
      {
        grup: "Dil",
        etiketler: ["İngilizce akıcı", "Rusça temel", "Üçüncü dil tercih sebebi"]
      }
    ],
    yanHakAciklamalari: ["lojman", "yemek", "personel servisi"],
    atsYuzdesi: 76,
    eslesmeGerekcesi:
      "Adayın ön büro yöneticiliği deneyimi ve KKTC konaklama mevzuatına hâkimiyeti, pozisyonun aradığı operasyon bilgisiyle örtüşmektedir.",
    oneriler: [
      "Otel ön büro ekibini yönetme deneyiminizi ve ekip büyüklüğünü belirtin.",
      "Rusça veya üçüncü dil yeterkinliğiniz varsa belirtin."
    ]
  },
  {
    slug: "frontend-yazilim-gelistirici-lefkosa",
    referansNo: "İB-2026-0003",
    baslik: "Frontend Yazılım Geliştirici",
    sirketAdi: "Lefkoşa Teknoloji A.Ş.",
    sirketKodu: "LEFKOSA-TEKNOLOJI",
    sirketAciklamasi:
      "Lefkoşa Teknoloji A.Ş., KKTC merkezli ürün ekibiyle finans ve turizm alanında kurumsal web uygulamaları geliştirmektedir.",
    ilceUzunIsim: "Lefkoşa (Lefkosa)",
    sektorAciklama: "Bilişim & Yazılım",
    sektorKodu: "BILISIM",
    calismaSekliAciklama: "Hibrit çalışma modeli, haftada üç gün ofis",
    eskiCalismaSekliKodu: "TAM",
    izinTipiAciklama: "KKTC Vatandaşı",
    eskiIzinKodu: "VATANDAS",
    eskiIzinKisaltma: "VAT",
    minNetAylik: 3600,
    makNetAylik: 5200,
    paraBirimiHam: "GBP",
    b3OnayliMi: true,
    acilMi: false,
    goruntulenmeSayisi: 2410,
    basvuruSayisi: 148,
    yayinGunOnce: 1,
    bitisGunSonra: 35,
    tanitim:
      "Ürün ekibimizde, kurumsal müşterilerimize yönelik web arayüzlerini tasarlayıp geliştirecek bir Frontend Yazılım Geliştirici arıyoruz.",
    pozisyonTanimi: [
      "Türkiye ve KKTC müşterileri için tasarım sistemlerine uygun web arayüzleri geliştireceksiniz.",
      "Ekip içi tasarım sistemi ve bileşen kütüphanesi standardına uyacak, kod kalitesini koruyacaksınız.",
      "Performans, erişilebilirlik ve tarayıcı uyumluluğu ölçütlerini iyileştireceksiniz.",
      "Ürün ekipleriyle haftalık iterasyonlarda çalışarak teslimat takibi yapacaksınız."
    ],
    teknikYetenekler: [
      {
        grup: "Frontend",
        etiketler: ["TypeScript", "React", "Next.js", "Tailwind CSS", "Performans optimizasyonu"]
      },
      {
        grup: "Kalite",
        etiketler: ["Vitest", "Playwright", "Erişilebilirlik (WCAG)"]
      },
      { grup: "Yazılım", etiketler: ["REST", "Git", "CI/CD"] }
    ],
    yanHakAciklamalari: ["ekipman", "saglik sigortasi", "egitim", "spor salonu"],
    atsYuzdesi: 92,
    eslesmeGerekcesi:
      "TypeScript ve Next.js tabanlı ürün geliştirme deneyimi, pozisyonun teknik yığın talebiyle neredeyse birebir örtüşmektedir.",
    oneriler: [
      "Yayınlanmış bir Next.js projenizin GitHub bağlantısını özgeçmişinize ekleyin.",
      "Erişilebilirlik ve performans çalışmalarınıza somut metriklerle değin."
    ]
  },
  {
    slug: "turizm-ogretim-gorevlisi-gazimagusa",
    referansNo: "İB-2026-0004",
    baslik: "Turizm Bölümü Öğretim Görevlisi",
    sirketAdi: "Doğu Akdeniz Üniversitesi",
    sirketKodu: "DOGU-AKDENIZ-UNIVERSITESI",
    sirketAciklamasi:
      "Doğu Akdeniz Üniversitesi, Gazimağusa kampüsünde turizm, otelcilik ve gastronomi bölümleriyle KKTC'nin turizm eğitim merkezidir.",
    ilceUzunIsim: "Gazimağusa (DAÜ Teknopark)",
    sektorAciklama: "Eğitim & Üniversite",
    sektorKodu: "EGITIM",
    calismaSekliAciklama: "Ofiste çalışma, dönem içi yoğun program",
    eskiCalismaSekliKodu: "TAM",
    izinTipiAciklama: "Normal Uzun Dönem İzni (2 Yıl)",
    eskiIzinKodu: "NORMAL_2",
    eskiIzinKisaltma: "N2",
    minNetAylik: 2700,
    makNetAylik: 3600,
    paraBirimiHam: "GBP",
    b3OnayliMi: true,
    acilMi: true,
    goruntulenmeSayisi: 764,
    basvuruSayisi: 33,
    yayinGunOnce: 9,
    bitisGunSonra: 14,
    tanitim:
      "Doğu Akdeniz Üniversitesi Turizm ve Otelcilik Bölümü, lisans düzeyinde ders verecek bir Öğretim Görevlisi arıyor.",
    pozisyonTanimi: [
      "Turizm ve otelcilik lisans programında ders verecek ve ders içeriğini güncelleyeceksiniz.",
      "Öğrenci projelerini yürletecek ve akademik danışmanlık görevleri üstleneceksiniz.",
      "Turizm sektörüyle iş birliği kurarak uygulamalı eğitim programları tasarlayacaksınız.",
      "Araştırma çalışmaları yürüterek bölümün akademik çıktılarına katkı sağlayacaksınız."
    ],
    teknikYetenekler: [
      {
        grup: "Akademik",
        etiketler: [
          "Lisans düzeyi ders verme",
          "Ders materyali hazırlama",
          "Akademik danışmanlık",
          "Araştırma yazımı"
        ]
      },
      {
        grup: "Sektör",
        etiketler: ["Konaklama işletmeciliği", "Turizm ekonomisi", "Gastronomi"]
      },
      { grup: "Dil", etiketler: ["İngilizce akıcı", "Rusça temel"] }
    ],
    yanHakAciklamalari: ["egitim", "yemek", "spor salonu"],
    atsYuzdesi: 68,
    eslesmeGerekcesi:
      "Turizm eğitimi alanındaki akademik geçmiş, pozisyonun ders verme ve araştırma beklentilerini karşılamakla birlikte sektör deneyiminin güçlendirilmesi fırsatı bulunmaktadır.",
    oneriler: [
      "Yayınlarınızı ve akademik unvanınızı özgeçmişinizin başında belirtin.",
      "Turizm sektöründeki saha deneyiminizi ve uygulamalı eğitim katkılarınızı ekleyin."
    ]
  },
  {
    slug: "kidemli-muhasebeci-lefkosa",
    referansNo: "İB-2026-0005",
    baslik: "Kıdemli Muhasebeci",
    sirketAdi: "Lefkoşa Yapı Market",
    sirketKodu: "LEFKOSA-YAPI-MARKET",
    sirketAciklamasi:
      "Lefkoşa Yapı Market, inşaat malzemeleri ve yapı market ürünleri konusunda KKTC'nin üç şubeli zincir perakendecisidir.",
    ilceUzunIsim: "Lefkoşa (Lefkosa)",
    sektorAciklama: "İnşaat & Gayrimenkul",
    sektorKodu: "INSAT",
    calismaSekliAciklama: "Ofiste çalışma, maliye dönemi yoğunluğunda ek mesai",
    eskiCalismaSekliKodu: "TAM",
    izinTipiAciklama: "KKTC Vatandaşı",
    eskiIzinKodu: "VATANDAS",
    eskiIzinKisaltma: "VAT",
    minNetAylik: 42000,
    makNetAylik: 58000,
    paraBirimiHam: "TRY",
    b3OnayliMi: true,
    acilMi: true,
    goruntulenmeSayisi: 612,
    basvuruSayisi: 27,
    yayinGunOnce: 12,
    bitisGunSonra: 7,
    tanitim:
      "Üç şubeli mağaza ağımızın mali işlerini yönetecek, kıdemli muhasebeci arıyoruz.",
    pozisyonTanimi: [
      "Şirket hesaplarını yürüterek banka hesaplarının mutabakatını düzenli olarak kontrol edeceksiniz.",
      "Aylık ve üç aylık beyannameleri hazırlayacak, mali mevzuat değişikliklerini takip edeceksiniz.",
      "Stok, cari hesap ve şube kasa hareketlerini analiz ederek raporlayacaksınız.",
      "Mali müşavirle birlikte denetim süreçlerine hazırlık yapacaksınız."
    ],
    teknikYetenekler: [
      {
        grup: "Mali İşler",
        etiketler: [
          "Genel muhasebe kaydı",
          "Beyanname hazırlama",
          "Mali tablo analizi",
          "Bütçeleme"
        ]
      },
      { grup: "Uyum", etiketler: ["KKTC vergi mevzuatı", "PES bildirimleri", "İç kontrol"] },
      { grup: "Yazılım", etiketler: ["Logo Muhasebe", "Excel ileri seviye", "ERP sistemleri"] }
    ],
    yanHakAciklamalari: ["yemek", "personel servisi", "egitim"],
    atsYuzdesi: 74,
    eslesmeGerekcesi:
      "Çok şubeli perakende işletmesinde uçtan uca muhasebe deneyimi, pozisyonun mali işler beklentisini karşılamaktadır.",
    oneriler: [
      "Kullandığınız muhasebe programlarını ve şube sayısını belirtin.",
      "Mali mevzuat uyum süreçlerindeki katkılarınıza örnekler verin."
    ]
  },
  {
    slug: "ik-uzmani-gazimagusa-liman",
    referansNo: "İB-2026-0006",
    baslik: "İnsan Kaynakları Uzmanı",
    sirketAdi: "Gazimağusa Liman İşletmeleri",
    sirketKodu: "GAZIMAGUSA-LIMAN",
    sirketAciklamasi:
      "Gazimağusa Liman İşletmeleri, denizcilik, lojistik ve liman hizmetlerinde faaliyet gösteren bir liman işletme firmasıdır.",
    ilceUzunIsim: "Gazimağusa",
    sektorAciklama: "Perakende & Lojistik",
    sektorKodu: "PERAKENDE",
    calismaSekliAciklama: "Ofiste çalışma, vardiya saatlerine göre esnek başlangıç",
    eskiCalismaSekliKodu: "TAM",
    izinTipiAciklama: "Normal Çalışma İzni (1 Yıl)",
    eskiIzinKodu: "NORMAL_1",
    eskiIzinKisaltma: "N1",
    minNetAylik: 0,
    makNetAylik: 0,
    paraBirimiHam: "GBP",
    b3OnayliMi: false,
    acilMi: false,
    goruntulenmeSayisi: 431,
    basvuruSayisi: 12,
    yayinGunOnce: 26,
    bitisGunSonra: 4,
    tanitim:
      "Liman operasyonlarımızda büyüyen personel yapımızı yönetmek üzere bir İnsan Kaynakları Uzmanı arıyoruz.",
    pozisyonTanimi: [
      "İşe alım, işe alıştırma ve bordrolama süreçlerini yürüteceksiniz.",
      "KKTC B3 İhtiyat Sandığı kapsamındaki yabancı personel izin ve uyum süreçlerini takip edeceksiniz.",
      "Personel ilişkileri, vardiya planlaması ve performans değerlendirme süreçlerini iyileştireceksiniz.",
      "İş sağlığı ve güvenliği eğitimlerinin planlamasını yapacaksınız."
    ],
    teknikYetenekler: [
      {
        grup: "İnsan Kaynakları",
        etiketler: ["Bordrolama", "İşe alım süreçleri", "Performans değerlendirme", "Vardiya planlaması"]
      },
      {
        grup: "Uyum",
        etiketler: [
          "KKTC B3 İhtiyat Sandığı mevzuatı",
          "İş kanunu uyum takibi",
          "Yabancı personel izinleri"
        ]
      },
      { grup: "Sistemler", etiketler: ["Personel yönetim sistemleri", "Excel ileri seviye"] }
    ],
    yanHakAciklamalari: ["personel servisi", "yemek", "saglik sigortasi"],
    atsYuzdesi: 47,
    eslesmeGerekcesi:
      "Bordro ve yabancı personel izin süreçlerindeki deneyim değerlidir; ancak liman ve vardiya bazlı personel yönetimi bilgisi ile İngilizce seviyesinin güçlendirilmesi beklenmektedir.",
    oneriler: [
      "B3 ve yabancı personel izin başvurularında yürüttüğünüz süreçleri somutlulaştırın.",
      "Vardiya bazlı personel planlaması deneyiminizi ayrı bir başlıkta belirtin.",
      "Özlük hakları ve KKTC mevzuatı konusundaki güncel bilginizi güçlendirin."
    ]
  },
  {
    slug: "sezonluk-asci-lefke",
    referansNo: "İB-2026-0007",
    baslik: "Sezonluk Aşçı",
    sirketAdi: "Karpaz Tarım ve Hayvancılık",
    sirketKodu: "KARPAZ-TARIM",
    sirketAciklamasi:
      "Karpaz Tarım ve Hayvancılık, Lefke bölgesinde zeytin, narenciye ve üretim mutfağı işleten yerel bir üreticidir.",
    ilceUzunIsim: "Lefke",
    sektorAciklama: "Perakende & Lojistik",
    sektorKodu: "PERAKENDE",
    calismaSekliAciklama: "Sezonluk çalışma, yoğun dönemde günlük vardiya",
    eskiCalismaSekliKodu: "SEZON",
    izinTipiAciklama: "Normal Çalışma İzni (1 Yıl)",
    eskiIzinKodu: "NORMAL_1",
    eskiIzinKisaltma: "N1",
    minNetAylik: 1600,
    makNetAylik: 2300,
    paraBirimiHam: "GBP",
    b3OnayliMi: true,
    acilMi: false,
    goruntulenmeSayisi: 2088,
    basvuruSayisi: 213,
    yayinGunOnce: 3,
    bitisGunSonra: 45,
    tanitim:
      "Lefke'deki üretim mutfağımız ve zeytinyağı tadım merkezimizde sezon boyunca görev alacak bir aşçı arıyoruz.",
    pozisyonTanimi: [
      "Menüyü hazırlayarak günlük üretim planına uygun şekilde yemekleri hazırlayacaksınız.",
      "Zeytin ve yerel ürünlerden oluşan menüyü standartlara uygun biçimde uygulayacaksınız.",
      "Mutfak hijyen kurallarına ve gıda güvenliği mevzuatına uyacak, denetimlere hazır olacaksınız.",
      "Staj ve çırak çalışanlara mutfak uygulamalarında mentorluk yapacaksınız."
    ],
    teknikYetenekler: [
      {
        grup: "Mutfak",
        etiketler: ["Menü hazırlama", "Akdeniz mutfağı", "Gıda güvenliği hijyeni", "Stok yönetimi"]
      },
      { grup: "Sektör", etiketler: ["Zeytincilik", "Yerel ürünler", "Tadım ve etkinlik organizasyonu"] },
      { grup: "Belge", etiketler: ["Gıda işletmesi belgesi", "Sağlık raporu"] }
    ],
    yanHakAciklamalari: ["yemek", "lojman", "personel servisi"],
    atsYuzdesi: 58,
    eslesmeGerekcesi:
      "Akdeniz mutfağı ve gıda hijyeni deneyimi pozisyon için değerlidir; öğrenmeye açık, sezon programına uygun bir aday beklenmektedir.",
    oneriler: [
      "Gıda işletmesi belgesi ve sağlık raporunuzun geçerli olduğunu belirtin.",
      "Hizmet ettiğiniz mutfak sayısını ve günlük ortalama tabak hacmini yazın."
    ]
  },
  {
    slug: "denizcilik-kaptani-iskele",
    referansNo: "İB-2026-0008",
    baslik: "Denizcilik Kaptanı",
    sirketAdi: "Cyprus Marina Girişim",
    sirketKodu: "CYPRUS-MARINA",
    sirketAciklamasi:
      "Cyprus Marina Girişim, İskele'de marina işletmeciliği, tekne bakımı ve yat kiralama hizmetleri veren bir şirkettir.",
    ilceUzunIsim: "İskele (Iskele)",
    sektorAciklama: "Turizm & Otelcilik",
    sektorKodu: "TURIZM",
    calismaSekliAciklama: "Ofiste ve sahada çalışma, mevsimsel yoğunluk",
    eskiCalismaSekliKodu: "TAM",
    izinTipiAciklama: "KKTC Vatandaşı",
    eskiIzinKodu: "VATANDAS",
    eskiIzinKisaltma: "VAT",
    minNetAylik: 2500,
    makNetAylik: 3400,
    paraBirimiHam: "USD",
    b3OnayliMi: true,
    acilMi: false,
    goruntulenmeSayisi: 596,
    basvuruSayisi: 24,
    yayinGunOnce: 15,
    bitisGunSonra: 9,
    tanitim:
      "Marina operasyonlarımızda, deniz güvenliği ve yat trafiğinden sorumlu bir Kaptan arıyoruz.",
    pozisyonTanimi: [
      "Marina giriş çıkış trafiğini düzenleyip deniz güvenliği kurallarına uyulmasını sağlayacaksınız.",
      "Yatların hareket ve bakım süreçlerini planlayacak, ekip ile koordinasyonu sürdüreceksiniz.",
      "Denizcilik mevzuatı ve liman düzenlemelerine uygun işlemleri yürüteceksiniz.",
      "Denizcilik ekibinin vardiya planlamasını ve güvenlik tatbikatlarını organize edeceksiniz."
    ],
    teknikYetenekler: [
      {
        grup: "Denizcilik",
        etiketler: [
          "Marina operasyonları",
          "Deniz güvenliği",
          "Yat yönetimi",
          "Vardiya planlaması"
        ]
      },
      {
        grup: "Belgeler",
        etiketler: ["Kaptan belgesi", "Denizcilik ruhsatları", "Mesleki yeterlilik", "İlk yardım sertifikası"]
      },
      { grup: "Dil", etiketler: ["İngilizce akıcı", "İtalyanca temel"] }
    ],
    yanHakAciklamalari: ["ekipman", "saglik sigortasi", "yemek"],
    atsYuzdesi: 81,
    eslesmeGerekcesi:
      "Geçerli kaptan belgesi ve marina operasyonu deneyimi, pozisyonun güvenlik ve düzenleme gereksinimlerini karşılamaktadır.",
    oneriler: [
      "Kaptanlık belgenizin numarasını ve geçerlilik tarihini belirtin.",
      "Yönetlediğiniz en büyük marina ve ekip büyüklüğünü yazın."
    ]
  },
  {
    slug: "insaat-stajyeri-lefkosa",
    referansNo: "İB-2026-0009",
    baslik: "İnşaat Stajyeri",
    sirketAdi: "Lefkoşa Yapı Market",
    sirketKodu: "LEFKOSA-YAPI-MARKET",
    sirketAciklamasi:
      "Lefkoşa Yapı Market, inşaat malzemeleri alanında KKTC genelinde hizmet veren ve öğrenci staj programı yürüten bir kuruluştur.",
    ilceUzunIsim: "Lefkoşa (Lefkosa)",
    sektorAciklama: "İnşaat & Gayrimenkul",
    sektorKodu: "INSAT",
    calismaSekliAciklama: "Ofiste çalışma, haftada üç gün staj programı",
    eskiCalismaSekliKodu: "STAJ",
    izinTipiAciklama: "Öğrenci Çalışma İzni",
    eskiIzinKodu: "OGRENCI",
    eskiIzinKisaltma: "OGR",
    minNetAylik: 0,
    makNetAylik: 0,
    paraBirimiHam: "GBP",
    b3OnayliMi: true,
    acilMi: false,
    goruntulenmeSayisi: 322,
    basvuruSayisi: 19,
    yayinGunOnce: 0,
    bitisGunSonra: 60,
    tanitim:
      "Mühendislik ve mimarlık öğrencilerine yönelik, üniversite müfredatını destekleyen yapı malzemeleri staj programımız başlıyor.",
    pozisyonTanimi: [
      "Şantiye ve mağaza operasyonlarında teknik ekibe destek olarak görev alacaksınız.",
      "Ürün teknik föyleri ve uygulama detaylarını hazırlayarak müşteri bilgilendirmesi yapacaksınız.",
      "Stok, sevkiyat ve şantiye teslim süreçlerini gözlemleyerek raporlayacaksınız.",
      "Üniversite staj değerlendirme dosyanızı mentor desteğiyle tamamlayacaksınız."
    ],
    teknikYetenekler: [
      {
        grup: "Teknik",
        etiketler: ["AutoCAD", "Beton ve yapı malzemeleri", "Teknik föy hazırlama", "Ölçü okuma"]
      },
      { grup: "Sektör", etiketler: ["Yapı market operasyonu", "Şantiye lojistiği"] },
      { grup: "Yazılım", etiketler: ["Excel", "Word"] }
    ],
    yanHakAciklamalari: ["yemek", "personel servisi", "egitim"],
    atsYuzdesi: 46,
    eslesmeGerekcesi:
      "Yapı malzemeleri bilgisi staj programına uygundur; AutoCAD ve AutoCAD benzeri teknik çizim programlarındaki ilerlemeniz değerlendirmeyi hızlandıracaktır.",
    oneriler: [
      "Öğrenci çalışma izin belgesinin ve devam durumunuzun geçerli olduğunu belirtin.",
      "Yaklaşık hangi bölümde okuduğunuzu ve staj sürenizi belirtin."
    ]
  },
  {
    slug: "veri-analisti-gazimagusa",
    referansNo: "İB-2026-0010",
    baslik: "Veri Analisti",
    sirketAdi: "DAÜ Teknopark Girişim A.Ş.",
    sirketKodu: "DAU-TEKNOPARK",
    sirketAciklamasi:
      "DAÜ Teknopark Girişim A.Ş., Gazimağusa'da teknoloji tabanlı girişimlere veri altyapısı ve analiz hizmeti sunmaktadır.",
    ilceUzunIsim: "Gazimağusa (DAÜ Teknopark)",
    sektorAciklama: "Bilişim & Yazılım",
    sektorKodu: "BILISIM",
    calismaSekliAciklama: "Uzaktan çalışma, haftada iki gün ofis",
    eskiCalismaSekliKodu: "TAM",
    izinTipiAciklama: "Normal Uzun Dönem İzni (2 Yıl)",
    eskiIzinKodu: "NORMAL_2",
    eskiIzinKisaltma: "N2",
    minNetAylik: 3200,
    makNetAylik: 4500,
    paraBirimiHam: "GBP",
    b3OnayliMi: true,
    acilMi: true,
    goruntulenmeSayisi: 1675,
    basvuruSayisi: 88,
    yayinGunOnce: 4,
    bitisGunSonra: 30,
    tanitim:
      "Girişim ekibimizde, ürün ve büyüme ekipleri için veriden içgörü üreten bir Veri Analisti arıyoruz.",
    pozisyonTanimi: [
      "Ürün kullanım verilerini analiz ederek davranış içgörüleri çıkaracaksınız.",
      "Metrik tanımlarını yapılandıracak, gösterge panolarını güncelleyeceksiniz.",
      "Deney tasarımı yaparak büyüme girişimlerini ölçülebilir kılacaksınız.",
      "Analiz bulgularını teknik olmayan ekiplere anlaşılır biçimde aktaracaksınız."
    ],
    teknikYetenekler: [
      {
        grup: "Analiz",
        etiketler: ["SQL", "Python (pandas)", "Deney tasarımı", "Kohort analizi"]
      },
      {
        grup: "Veri Altyapısı",
        etiketler: ["Veri modelleme", "ETL hatları", "Power BI", "BigQuery"]
      },
      { grup: "Yazılım", etiketler: ["Git", "API entegrasyonu"] }
    ],
    yanHakAciklamalari: ["ekipman", "saglik sigortasi", "spor salonu", "egitim"],
    atsYuzdesi: 86,
    eslesmeGerekcesi:
      "SQL ve Python tabanlı analiz deneyimi ile ürün metriği kurma tecrübesi, pozisyonun teknik ve iş gereksinimlerini güçlü biçimde karşılamaktadır.",
    oneriler: [
      "Kurduğunuz bir metrik veya gösterge paneli örneğini paylaşın.",
      "Deney tasarımı ve istatistiksel analiz deneyiminizi belirtin."
    ]
  },
  {
    slug: "turizm-rehberi-girne",
    referansNo: "İB-2026-0011",
    baslik: "Turizm Rehberi (Yarı Zamanlı)",
    sirketAdi: "Kuzey Cyprus Turizm",
    sirketKodu: "KUZEY-CYPRUS-TURIZM",
    sirketAciklamasi:
      "Kuzey Cyprus Turizm, Girne merkezinde tur paketleri, rehberlik hizmetleri ve kültür turları düzenleyen bir acentidir.",
    ilceUzunIsim: "Girne",
    sektorAciklama: "Turizm & Otelcilik",
    sektorKodu: "TURIZM",
    calismaSekliAciklama: "Yarı zamanlı çalışma, hafta sonları yoğun program",
    eskiCalismaSekliKodu: "YARI",
    izinTipiAciklama: "KKTC Vatandaşı",
    eskiIzinKodu: "VATANDAS",
    eskiIzinKisaltma: "VAT",
    minNetAylik: 950,
    makNetAylik: 1400,
    paraBirimiHam: "GBP",
    b3OnayliMi: true,
    acilMi: false,
    goruntulenmeSayisi: 1450,
    basvuruSayisi: 97,
    yayinGunOnce: 18,
    bitisGunSonra: 6,
    tanitim:
      "Kuzey Cyprus Turizm ekibimizde, yarı zamanlı çalışarak çok dilli tur gruplarını ağırlayacak bir Turizm Rehberi arıyoruz.",
    pozisyonTanimi: [
      "Kültür ve doğa turlarını İngilizce, Rusça veya Almanca yürüterek anlatım yapacaksınız.",
      "Tur rezervasyon ve grup koordinasyonunu takip ederek program akışını yöneteceksiniz.",
      "Misafir geri bildirimlerini toplayarak hizmet kalitesini artıracak öneriler sunacaksınız.",
      "KKTC turizm mevzuatına uygun rehberlik prosedürlerini uygulayacaksınız."
    ],
    teknikYetenekler: [
      {
        grup: "Rehberlik",
        etiketler: ["Tur anlatımı", "Kültür ve doğa rotaları", "Grup yönetimi", "Tur rezervasyonu"]
      },
      {
        grup: "Dil",
        etiketler: ["İngilizce akıcı", "Rusça akıcı", "Almanca temel"]
      },
      { grup: "Mevzuat", etiketler: ["KKTC turizm rehberi belgesi", "Mesleki yeterlilik"] }
    ],
    yanHakAciklamalari: ["personel servisi", "spor salonu", "egitim"],
    atsYuzdesi: 62,
    eslesmeGerekcesi:
      "Çok dilli tur anlatımı deneyimi ve turizm rehberi belgesi, yarı zamanlı program��n gereksinimlerini karşılamaktadır.",
    oneriler: [
      "Rehberlik belgesi numaranızı ve yıllık tur sayınızı belirtin.",
      "Rusça ve Almanca seviyenizi çalışma dili olarak belirtin."
    ]
  },
  {
    slug: "sosyal-medya-ve-icerik-yoneticisi-iskele",
    referansNo: "İB-2026-0012",
    baslik: "Sosyal Medya ve İçerik Yöneticisi",
    sirketAdi: "Marina Gold Residence",
    sirketKodu: "MARINA-GOLD",
    sirketAciklamasi:
      "Marina Gold Residence, İskele sahilinde uzun dönem konaklama sunan butik konaklama işletmesidir.",
    ilceUzunIsim: "İskele (Iskele)",
    sektorAciklama: "Turizm & Otelcilik",
    sektorKodu: "TURIZM",
    calismaSekliAciklama: "Uzaktan ve esnek çalışma, proje bazlı sözleşme",
    eskiCalismaSekliKodu: "FREELANCE",
    izinTipiAciklama: "Çalışma İzni Gerekmez",
    eskiIzinKodu: "YOK",
    eskiIzinKisaltma: "YOK",
    minNetAylik: 0,
    makNetAylik: 0,
    paraBirimiHam: "GBP",
    b3OnayliMi: false,
    acilMi: false,
    goruntulenmeSayisi: 688,
    basvuruSayisi: 31,
    yayinGunOnce: 31,
    bitisGunSonra: 3,
    tanitim:
      "Marina Gold Residence için sosyal medya ve içerik üretimini dış kaynaklı yürütecek bir İçerik Yöneticisi arıyoruz.",
    pozisyonTanimi: [
      "Aylık içerik takvimini oluşturarak sosyal medya paylaşımlarını planlayacaksınız.",
      "Konaklama deneyimini anlatan fotoğraf ve video içerikleri üreteceksiniz.",
      "Misafir yorumlarına yanıt vererek topluluk yönetimini sürdüreceksiniz.",
      "Dönemsel kampanyalarda yerel işletmelerle ortak içerik üretimi yapacaksınız."
    ],
    teknikYetenekler: [
      {
        grup: "İçerik",
        etiketler: [
          "İçerik takvimi",
          "Fotoğraf ve video üretimi",
          "Yorum yönetimi",
          "Metin yazımı"
        ]
      },
      {
        grup: "Araçlar",
        etiketler: ["Canva", "Meta Business Suite", "Google Analytics", "Edit video"]
      },
      { grup: "Dil", etiketler: ["İngilizce akıcı", "Rusça temel"] }
    ],
    yanHakAciklamalari: ["ekipman", "egitim"],
    atsYuzdesi: 48,
    eslesmeGerekcesi:
      "Sosyal medya içerik üretimi deneyimi projeye uygundur; konaklama sektörüne özgü içerik örneklerinin paylaşılması değerlendirmeyi güçlendirecektir.",
    oneriler: [
      "Yönettiğiniz hesapların takipçi büyümesi ve etkileşim oranını belirtin.",
      "Kendi çektiğiniz kısa video örneklerine bir bağlantı ekleyin."
    ]
  },
  {
    slug: "zeytincilik-uretim-sorumlusu-guzelyurt",
    referansNo: "İB-2026-0013",
    baslik: "Zeytin Üretim Sorumlusu",
    sirketAdi: "Güzelyurt Zeytincilik",
    sirketKodu: "GUZELYURT-ZEYTINCILIK",
    sirketAciklamasi:
      "Güzelyurt Zeytincilik, Güzelyurt ovasında zeytin yetiştiriciliği, zeytinyağı üretimi ve zeytinyağlı ürünler yapan bir işletmedir.",
    ilceUzunIsim: "Güzelyurt",
    sektorAciklama: "Perakende & Lojistik",
    sektorKodu: "PERAKENDE",
    calismaSekliAciklama: "Ofiste ve tarlada çalışma, hasat dönemi yoğunluk",
    eskiCalismaSekliKodu: "TAM",
    izinTipiAciklama: "Normal Çalışma İzni (1 Yıl)",
    eskiIzinKodu: "NORMAL_1",
    eskiIzinKisaltma: "N1",
    minNetAylik: 31000,
    makNetAylik: 43000,
    paraBirimiHam: "TRY",
    b3OnayliMi: true,
    acilMi: false,
    goruntulenmeSayisi: 457,
    basvuruSayisi: 21,
    yayinGunOnce: 22,
    bitisGunSonra: 18,
    tanitim:
      "Güzelyurt ovasındaki arazimizde zeytin üretiminden sorumeli, tarla ve fabrika süreçlerini birlikte yönetecek bir Üretim Sorumlusu arıyoruz.",
    pozisyonTanimi: [
      "Zeytinlik bakım, sulama ve hasat programını planlayarak uygulayacaksınız.",
      "Zeytinyağı üretim partiilerini izleyerek kalite ve verim kayıtlarını tutacaksınız.",
      "Ekip ve makine kullanımını planlayarak hasat dönemi iş gücünü yöneteceksınız.",
      "Gıda güvenliği ve kalite belgelerinin süreçlere uygulanmasını sağlayacaksınız."
    ],
    teknikYetenekler: [
      {
        grup: "Tarım",
        etiketler: ["Zeytin yetiştiriciliği", "Sulama yönetimi", "Hasat planlaması", "Verim takibi"]
      },
      {
        grup: "Üretim",
        etiketler: ["Zeytinyağı üretimi", "Parti izlenebilirliği", "Kalite kontrol"]
      },
      {
        grup: "Uyum",
        etiketler: ["Gıda mevzuatı", "Tarımsal destek ve sübvansyon süreçleri", "PES bildirimleri"]
      }
    ],
    yanHakAciklamalari: ["lojman", "yemek", "personel servisi", "saglik sigortasi"],
    atsYuzdesi: 55,
    eslesmeGerekcesi:
      "Zeytin yetiştiriciliği ve zeytinyağı üretimi deneyimi pozisyonun temel ihtiyacıdır; ekip yönetimi ölçeğinin güçlendirilmesi fırsatı bulunmaktadır.",
    oneriler: [
      "Yönettiğiniz dekar ve yıllık üretim hacmini belirtin.",
      "Kalite ve izlenebilirlik belgelerinizi özgeçmişinize ekleyin."
    ]
  },
  {
    slug: "universite-kutuphane-asistani-girne",
    referansNo: "İB-2026-0014",
    baslik: "Üniversite Kütüphanesi Asistanı",
    sirketAdi: "Girne Üniversitesi",
    sirketKodu: "GIRNE-UNIVERSITESI",
    sirketAciklamasi:
      "Girne Üniversitesi, merkezî ve kampüs kütüphaneleriyle eğitim ve araştırma faaliyetlerini yürüten bir devlet üniversitesidir.",
    ilceUzunIsim: "Girne",
    sektorAciklama: "Eğitim & Üniversite",
    sektorKodu: "EGITIM",
    calismaSekliAciklama: "Yarı zamanlı çalışma, dönem başı yoğun program",
    eskiCalismaSekliKodu: "YARI",
    izinTipiAciklama: "Öğrenci Çalışma İzni",
    eskiIzinKodu: "OGRENCI",
    eskiIzinKisaltma: "OGR",
    minNetAylik: 700,
    makNetAylik: 980,
    paraBirimiHam: "GBP",
    b3OnayliMi: true,
    acilMi: false,
    goruntulenmeSayisi: 903,
    basvuruSayisi: 64,
    yayinGunOnce: 8,
    bitisGunSonra: 12,
    tanitim:
      "Girne Üniversitesi kütüphanesinde, dönem başı ve dönem sonu yoğunluklarında görev alacak bir Kütüphane Asistanı arıyoruz.",
    pozisyonTanimi: [
      "Ödünç, teslim ve iade işlemlerini yürüterek kütüphane kayıtlarını güncel tutacaksınız.",
      "Koleksiyon sayımı ve raf düzeni çalışmalarında görev alacaksınız.",
      "Okuma salonu kullanım kurallarının uygulanmasına destek olacaksınız.",
      "Öğrenci ve araştırmacıların bilgi ihtiyaçlarına yönlendirme yaparak yardımcı olacaksınız."
    ],
    teknikYetenekler: [
      {
        grup: "Kütüphanecilik",
        etiketler: [
          "Katalog sistemi kullanımı",
          "Ödünç işlemleri",
          "Koleksiyon yönetimi",
          "MARC21 / OAI-PMH"
        ]
      },
      { grup: "Sistemler", etiketler: ["Kütüphane otomasyonu", "Excel", "Barkod tarama"] },
      { grup: "Dil", etiketler: ["İngilizce temel", "Almanca okuma"] }
    ],
    yanHakAciklamalari: ["yemek", "egitim", "spor salonu"],
    atsYuzdesi: 47,
    eslesmeGerekcesi:
      "Kütüphane otomasyon sistemleri ve katalog bilgisi pozisyona uygundur; araştırma kütüphanesi deneyiminin geliştirilmesi değer katacaktır.",
    oneriler: [
      "Öğrenci çalışma izin belgesinin ve haftalık izinli saatlerinizi belirtin.",
      "Kullandığınız katalog veya otomasyon sistemlerini yazın."
    ]
  },
  {
    slug: "sigorta-hasar-uzmani-gazimagusa",
    referansNo: "İB-2026-0015",
    baslik: "Sigorta Hasar Uzmanı",
    sirketAdi: "Medipol Sigorta",
    sirketKodu: "MEDIPOL-SIGORTA",
    sirketAciklamasi:
      "Medipol Sigorta, KKTC'de bireysel ve kurumsal hayat ve kasko branşlarında hizmet veren bir sigorta şirketidir.",
    ilceUzunIsim: "Gazimağusa",
    sektorAciklama: "Finans & Bankacılık",
    sektorKodu: "FINANS",
    calismaSekliAciklama: "Ofiste ve saha çalışması, hasar yoğun dönemlerde mobil ekip",
    eskiCalismaSekliKodu: "TAM",
    izinTipiAciklama: "KKTC Vatandaşı",
    eskiIzinKodu: "VATANDAS",
    eskiIzinKisaltma: "VAT",
    minNetAylik: 2450,
    makNetAylik: 3300,
    paraBirimiHam: "GBP",
    b3OnayliMi: true,
    acilMi: true,
    goruntulenmeSayisi: 1128,
    basvuruSayisi: 47,
    yayinGunOnce: 6,
    bitisGunSonra: 25,
    tanitim:
      "Hasar hizmetleri ekibimizde, hasar dosyalarını sahada ve ofiste yönetecek bir Sigorta Hasar Uzmanı arıyoruz.",
    pozisyonTanimi: [
      "Hasar ihbarlerini alıp önleyici ve hasarlı sigortalılarla sahada inceleme yapacaksınız.",
      "Ekspertiz raporlarını değerlendirerek dosya kapanışını hızlandıracaksınız.",
      "Ödemelerin gerekçeli ve mevzuata uygun şekilde yapılmasını sağlayacaksınız.",
      "Hasar istatistiklerini takip ederek müşteri memnuniyetini artıracak öneriler sunacaksınız."
    ],
    teknikYetenekler: [
      {
        grup: "Sigorta",
        etiketler: ["Hasar tespiti", "Ekspertiz raporu", "Kasko ve hayat sigortası", "Dosya yönetimi"]
      },
      {
        grup: "Mevzuat",
        etiketler: ["KKTC sigorta mevzuatı", "KKTC B3 İhtiyat Sandığı mevzuatı", "Mesleki yeterlilik"]
      },
      { grup: "Dil", etiketler: ["İngilizce akıcı", "Rusça temel"] }
    ],
    yanHakAciklamalari: ["personel servisi", "saglik sigortasi", "egitim", "yillik ucak"],
    atsYuzdesi: 79,
    eslesmeGerekcesi:
      "Hasar yönetimi ve saha ekspertiz deneyimi, pozisyonun operasyonel beklentisiyle örtüşmekte olup dosya kapama sürelerini kısaltacaktır.",
    oneriler: [
      "Yıllık ortalam işlediğiniz hasar dosyası sayısını belirtin.",
      "Rusça müşteri iletişimi deneyiminiz varsa özgeçmişte vurgulayın."
    ]
  },
  {
    slug: "acil-elektrik-teknisyeni-lefkosa",
    referansNo: "İB-2026-0016",
    baslik: "Acil Elektrik Teknisyeni",
    sirketAdi: "Anadolu Güvenlik Hizmetleri",
    sirketKodu: "ANADOLU-GUVENLIK",
    sirketAciklamasi:
      "Anadolu Güvenlik Hizmetleri, KKTC'de bina güvenlik sistemleri, elektrik tesisatı ve acil teknik destek veren bir firmadır.",
    ilceUzunIsim: "Lefkoşa (Lefkosa)",
    sektorAciklama: "Perakende & Lojistik",
    sektorKodu: "PERAKENDE",
    calismaSekliAciklama: "Ofiste ve sahada çalışma, acil çağrıda 7/24 nöbet",
    eskiCalismaSekliKodu: "TAM",
    izinTipiAciklama: "Normal Çalışma İzni (1 Yıl)",
    eskiIzinKodu: "NORMAL_1",
    eskiIzinKisaltma: "N1",
    minNetAylik: 1850,
    makNetAylik: 2450,
    paraBirimiHam: "GBP",
    b3OnayliMi: false,
    acilMi: true,
    goruntulenmeSayisi: 2380,
    basvuruSayisi: 186,
    yayinGunOnce: 2,
    bitisGunSonra: 5,
    tanitim:
      "Acil çağrı ekibimize katılacak, elektrik arızalaraında hızlı müdahale edecek bir Elektrik Teknisyeni arıyoruz.",
    pozisyonTanimi: [
      "Acil çağrıları en kısa sürede değerlendirerek sahaya çıkacaksınız.",
      "Elektrik panosu, tesisat ve jeneratör arızalarını gidereceksiniz.",
      "Güvenlik sistemi kurulumlarında teknik destek vereceksiniz.",
      "Arıza kayıtlarını tutarak raporlama ve önleyici bakım önerileri sunacaksınız."
    ],
    teknikYetenekler: [
      {
        grup: "Elektrik",
        etiketler: ["Elektrik tesisatı", "Pano bakımı", "Jeneratör", "Arıza tespiti"]
      },
      {
        grup: "Güvenlik",
        etiketler: ["Kamera sistemleri", "Alarm sistemleri", "Yangın güvenliği"]
      },
      {
        grup: "Belge",
        etiketler: ["Elektrikçi belgesi", "B3 İhtiyat Sandığı onaylı personel", "İlk yardım sertifikası"]
      }
    ],
    yanHakAciklamalari: ["ekipman", "saglik sigortasi", "yemek"],
    atsYuzdesi: 51,
    eslesmeGerekcesi:
      "Acil servis tecrübesi ve elektrik sertifikası pozisyona uygundur; B3 İhtiyat Sandığı onaylı personel belgesinin bulunmaması başvuru değerlendirmesinde eksiklik oluşturabilir.",
    oneriler: [
      "B3 İhtiyat Sandığı onaylı personel belgenizi başvuruyla birlikte iletin.",
      "Acil çağrı ve vardiya deneyiminizi belirtin.",
      "Araç kullanma belgesi varsa ekleyin."
    ]
  },
  {
    slug: "kurumsal-satis-temsilcisi-iskele",
    referansNo: "İB-2026-0017",
    baslik: "Kurumsal Satış Temsilcisi",
    sirketAdi: "Akdeniz Enerji Dağıtım",
    sirketKodu: "AKDENIZ-ENERJI",
    sirketAciklamasi:
      "Akdeniz Enerji Dağıtım, elektrik ve yenilenebilir enerji sistemleri kurulumu yapan KKTC merkezli bir mühendislik firmasıdır.",
    ilceUzunIsim: "İskele (Iskele)",
    sektorAciklama: "İnşaat & Gayrimenkul",
    sektorKodu: "INSAT",
    calismaSekliAciklama: "Hibrit çalışma modeli, saha ziyaretleri ile ofis arası paylaşımlı",
    eskiCalismaSekliKodu: "TAM",
    izinTipiAciklama: "Normal Uzun Dönem İzni (2 Yıl)",
    eskiIzinKodu: "NORMAL_2",
    eskiIzinKisaltma: "N2",
    minNetAylik: 0,
    makNetAylik: 0,
    paraBirimiHam: "GBP",
    b3OnayliMi: true,
    acilMi: false,
    goruntulenmeSayisi: 341,
    basvuruSayisi: 14,
    yayinGunOnce: 19,
    bitisGunSonra: 11,
    tanitim:
      "Enerji sistemleri satış ekibimizde, kurumsal müşterilerle teknik görüşmeler yürütecek bir Satış Temsilcisi arıyoruz.",
    pozisyonTanimi: [
      "Yenilenebilir enerji ve elektrik tesisatı tekliflerini hazırlayacaksınız.",
      "Müşteri ziyaretleri düzenleyerek saha gereksinimlerini belirleyeceksiniz.",
      "Teklifleri teknik ekiple birlikte değerlendirip revize edeceksiniz.",
      "Satış hedeflerine ilişkin haftalık raporlamayı yöneteceksiniz."
    ],
    teknikYetenekler: [
      {
        grup: "Satış",
        etiketler: [
          "Kurumsal satış",
          "Teklif hazırlama",
          "Müşteri ilişkileri",
          "CRM takibi"
        ]
      },
      {
        grup: "Teknik Bilgi",
        etiketler: [
          "Fotovoltaik sistemler",
          "Elektrik tesisatı",
          "Enerji verimliliği",
          "Yenilenebilir enerji mevzuatı"
        ]
      },
      { grup: "Dil", etiketler: ["İngilizce akıcı", "Almanca temel"] }
    ],
    yanHakAciklamalari: ["ekipman", "yillik ucak", "saglik sigortasi"],
    atsYuzdesi: 72,
    eslesmeGerekcesi:
      "Kurumsal satış deneyimi ve enerji sistemleri teknik bilgisi, hibrit çalışma düzeninde saha ağırlıklı rol için uygundur.",
    oneriler: [
      "Son iki yılda yönettiğiniz ciro ve portföy büyüklüğünü belirtin.",
      "Fotovoltaik veya enerji verimliliği projelerinizden birini örnekleyin."
    ]
  },
  {
    slug: "proje-mimar-gazimagusa",
    referansNo: "İB-2026-0018",
    baslik: "Proje Mimarı",
    sirketAdi: "Doğanlı İnşaat",
    sirketKodu: "DOGANLI-INSAAT",
    sirketAciklamasi:
      "Doğanlı İnşaat, Gazimağusa'da konut, ticari ve turizm projeleri gerçekleştiren yerel bir müteahhit firmasıdır.",
    ilceUzunIsim: "Gazimağusa",
    sektorAciklama: "İnşaat & Gayrimenkul",
    sektorKodu: "INSAT",
    calismaSekliAciklama: "Ofiste çalışma, şantiye ve belediye süreçleri için sahada bulunma",
    eskiCalismaSekliKodu: "TAM",
    izinTipiAciklama: "KKTC Vatandaşı",
    eskiIzinKodu: "VATANDAS",
    eskiIzinKisaltma: "VAT",
    minNetAylik: 3300,
    makNetAylik: 4600,
    paraBirimiHam: "EUR",
    b3OnayliMi: true,
    acilMi: false,
    goruntulenmeSayisi: 794,
    basvuruSayisi: 36,
    yayinGunOnce: 11,
    bitisGunSonra: 33,
    tanitim:
      "Doğanlı İnşaat olarak Gazimağusa'daki yeni konut ve turizm projelerimizi yürütecek bir Proje Mimarı arıyoruz.",
    pozisyonTanimi: [
      "Konut ve ticari projelerde tasarım, uygulama ve ��antiye süreçlerini yöneteceksiniz.",
      "Belediye ve ruhsat süreçlerini takip ederek proje dosyalarını yürüteceksiniz.",
      "Taşeron ve tedarikçi koordinasyonunu planlayarak maliyet ve program takibi yapacaksınız.",
      "KKTC imar mevzuatına uygun uygulamaları denetleyeceksiniz."
    ],
    teknikYetenekler: [
      {
        grup: "Mimari",
        etiketler: [
          "Konut ve ticari proje tasarımı",
          "AutoCAD",
          "Revit",
          "Uygulama projesi hazırlığı"
        ]
      },
      {
        grup: "Yönetim",
        etiketler: ["Şantiye yönetimi", "Bütçe takibi", "Taşeron koordinasyonu", "Raporlama"]
      },
      {
        grup: "Mevzuat",
        etiketler: [
          "KKTC imar mevzuatı",
          "KKTC B3 İhtiyat Sandığı mevzuatı",
          "Mimar ruhsatı",
          "Mesleki yeterlilik"
        ]
      }
    ],
    yanHakAciklamalari: ["saglik sigortasi", "yillik ucak", "ekipman", "egitim"],
    atsYuzdesi: 89,
    eslesmeGerekcesi:
      "Konut ve ticari projelerde mimari tasarım ile şantiye yönetimi deneyimi, pozisyonun uygulama ve mevzuat beklentilerini tam olarak karşılamaktedır.",
    oneriler: [
      "Tamamlanmış projelerinizi alan, ölçek ve ekip büyüklüğüyle birlikte listeleyin.",
      "Mimar ruhsatı numaranızı ve geçerlilik tarihini belirtin."
    ]
  }
];

const ORNEK_ILANLAR: Ilan[] = HAM_ILANLAR.map<Ilan>((h) => {
  const maasGizli = h.minNetAylik <= 0 && h.makNetAylik <= 0;
  const benzersizYanHaklar = Array.from(
    new Set(
      h.yanHakAciklamalari
        .map(yanHakKodunaCevir)
        .filter((k): k is YanHakKodu => Boolean(k))
    )
  );
  const sekil = eskiSekildenYeniSekle(h.eskiCalismaSekliKodu) ?? "TAM_ZAMANLI";
  return {
    slug: h.slug,
    referansNo: h.referansNo,
    pozisyonBasligi: h.baslik,
    sirketKodu: h.sirketKodu,
    sirketAdi: h.sirketAdi,
    sirketLogoUrl: undefined,
    sirketProfilOzeti: h.sirketAciklamasi,
    sektorKodu: h.sektorKodu,
    naceKodu: undefined,
    iscoGrubu: undefined,
    ilceler: ilcedenKodaCevir(h.ilceUzunIsim),
    calismaSekli: sekil,
    calismaModeli: calismaModeliCikar(h.calismaSekliAciklama, h.eskiCalismaSekliKodu),
    izinTipleri: izinKodunuDogrula(h.eskiIzinKodu),
    maasAraligi: {
      gizli: maasGizli,
      min: h.minNetAylik,
      mak: h.makNetAylik,
      para: paraKodunuDogrula(h.paraBirimiHam),
    },
    yanHaklar: benzersizYanHaklar,
    isTanimi: isTanimiOlustur(h.tanitim, h.pozisyonTanimi),
    zorunluBeceriler: becerileriDuzlestir(h.teknikYetenekler),
    tercihEdilenBeceriler: [],
    minDeneyimYili: undefined,
    yabanciDilSeviyesi: [],
    b3OnayliMi: h.b3OnayliMi,
    acilMi: h.acilMi,
    atsSkorEsigi: 70,
    aiEslestirme: {
      skor: h.atsYuzdesi,
      gerekce: h.eslesmeGerekcesi,
      oneriler: h.oneriler,
      oneriBasligi: h.sirketAdi,
    },
    yayinTarihi: tarih(h.yayinGunOnce),
    sonBasvuruTarihi: sonBasvuruTarihiOlustur(h.bitisGunSonra),
    goruntulenmeSayisi: h.goruntulenmeSayisi,
    basvuruSayisi: h.basvuruSayisi,
    durum: "AKTIF",

    ilce: h.ilceUzunIsim,
    minNetAylik: h.minNetAylik,
    makNetAylik: h.makNetAylik,
    oneriler: h.oneriler,
    atsYuzdesi: h.atsYuzdesi,
    calismaIzniTipiKodu: izinKodunuDogrula(h.eskiIzinKodu)[0],
    izinKisaltma: h.eskiIzinKisaltma,
  };
});

const EK_META_HARITASI: Record<string, EskiIlanEkMeta> = Object.fromEntries(
  HAM_ILANLAR.map((h) => [
    h.slug,
    {
      tanitim: h.tanitim,
      pozisyonTanimi: h.pozisyonTanimi,
      teknikYetenekler: h.teknikYetenekler,
      sirketAciklamasi: h.sirketAciklamasi,
      ilceUzunIsim: h.ilceUzunIsim,
      sektorAciklama: h.sektorAciklama,
      calismaSekliAciklama: h.calismaSekliAciklama,
      izinTipiAciklama: h.izinTipiAciklama,
    },
  ])
);

export function ilanEkMetaGetir(slug: string): EskiIlanEkMeta | undefined {
  return EK_META_HARITASI[slug];
}

export function ilanlariGetir(sinir?: number): Ilan[] {
  return sinir ? ORNEK_ILANLAR.slice(0, sinir) : [...ORNEK_ILANLAR];
}

export function ilanGetir(slug: string): Ilan | undefined {
  return ORNEK_ILANLAR.find((ilan) => ilan.slug === slug);
}

function benzerIlanlarIlanNesnesiIle(aranan: Ilan, sinir = 2): Ilan[] {
  const sektorEslesti = ORNEK_ILANLAR.filter(
    (d) =>
      d.slug !== aranan.slug &&
      d.sektorKodu !== undefined &&
      d.sektorKodu === aranan.sektorKodu
  );
  const kopya = [...sektorEslesti];
  kopya.sort((a, b) => (b.aiEslestirme?.skor ?? 0) - (a.aiEslestirme?.skor ?? 0));
  if (kopya.length >= sinir) return kopya.slice(0, sinir);
  const kalan = ORNEK_ILANLAR.filter(
    (d) =>
      d.slug !== aranan.slug &&
      !(aranan.sektorKodu !== undefined && d.sektorKodu === aranan.sektorKodu)
  );
  return [...kopya, ...kalan].slice(0, sinir);
}

function benzerIlanlarSlugIle(slug: string, sinir = 2): Ilan[] {
  const ilan = ilanGetir(slug);
  if (!ilan) return ORNEK_ILANLAR.slice(0, sinir);
  return benzerIlanlarIlanNesnesiIle(ilan, sinir);
}

export function benzerIlanlar(
  arananNesneVeyaSlug: Ilan | string,
  sinir = 2
): Ilan[] {
  if (typeof arananNesneVeyaSlug === "string") {
    return benzerIlanlarSlugIle(arananNesneVeyaSlug, sinir);
  }
  return benzerIlanlarIlanNesnesiIle(arananNesneVeyaSlug, sinir);
}

export { ORNEK_ILANLAR };
