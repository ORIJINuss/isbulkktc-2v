export const ILCELER = [
  { deger: "KKTC", etiket: "Tüm KKTC", en: "All TRNC" },
  { deger: "LEF", etiket: "Lefkoşa", en: "Nicosia" },
  { deger: "GIR", etiket: "Girne", en: "Kyrenia" },
  { deger: "GAM", etiket: "Gazimağusa", en: "Famagusta" },
  { deger: "ISK", etiket: "İskele", en: "İskele" },
  { deger: "GUZ", etiket: "Güzelyurt", en: "Morphou" },
  { deger: "LEFKE", etiket: "Lefke", en: "Lefka" }
] as const;

export const KKTC_ILLER = ILCELER;

export const IZIN_TIPLERI = [
  {
    deger: "VATANDAS",
    etiket: "KKTC / TC Vatandaşı",
    aciklama: "İzin Gerekmiyor, Doğrudan Çalışabilir",
    kisaltma: "Vatandaş",
    renkSinifi: "rozet-basari"
  },
  {
    deger: "YOK",
    etiket: "İzin Gerekmiyor (Beyaz Kimlik)",
    aciklama: "Mülteci / Beyaz Kimlik ile Çalışma Hakkı",
    kisaltma: "İzin Gerekmiyor",
    renkSinifi: "rozet-basari"
  },
  {
    deger: "NORMAL_1",
    etiket: "Normal Çalışma İzni (1 Yıl)",
    aciklama: "1 yıllık çalışma izni",
    kisaltma: "1 Yıl İzin",
    renkSinifi: "rozet-ana"
  },
  {
    deger: "NORMAL_2",
    etiket: "Normal Uzun Dönem İzni (2 Yıl)",
    aciklama: "2 Yıllık İzin, Uzun Süreli Çalışanlara Özel",
    kisaltma: "2 Yıl İzin",
    renkSinifi: "rozet-ana"
  },
  {
    deger: "OGRENCI",
    etiket: "Öğrenci Çalışma İzni",
    aciklama: "Max 24 Saat / Hafta (Üniversite Öğrencisi)",
    kisaltma: "Öğrenci İzni",
    renkSinifi: "rozet-tersiyer"
  }
] as const;

export const CALISMA_IZIN_TIPLERI = IZIN_TIPLERI;

export const SEKTORLER = [
  { deger: "BILISIM", etiket: "Bilişim & Yazılım" },
  { deger: "TURIZM", etiket: "Turizm & Otelcilik" },
  { deger: "FINANS", etiket: "Finans & Bankacılık" },
  { deger: "EGITIM", etiket: "Eğitim & Üniversite" },
  { deger: "INSAT", etiket: "İnşaat & Gayrimenkul" },
  { deger: "PERAKENDE", etiket: "Perakende & Lojistik" }
] as const;

export const CALISMA_SEKILLERI = [
  { deger: "TAM_ZAMANLI", etiket: "Tam Zamanlı" },
  { deger: "YARI_ZAMANLI", etiket: "Yarı Zamanlı" },
  { deger: "FREELANCE", etiket: "Freelance" },
  { deger: "SEZONLUK", etiket: "Sezonluk" },
  { deger: "STAJYER", etiket: "Stajyer" }
] as const;

export const PARA_BIRIMLERI = [
  { deger: "GBP", sembol: "£", etiket: "İngiliz Sterlini (Kıbrıs Sterlini)" },
  { deger: "TRY", sembol: "₺", etiket: "Türk Lirası" },
  { deger: "EUR", sembol: "€", etiket: "Euro" },
  { deger: "USD", sembol: "$", etiket: "ABD Doları" }
] as const;

export type ParaBirimi = (typeof PARA_BIRIMLERI)[number]["deger"];

export const YAN_HAKLAR = [
  { deger: "LOJMAN", etiket: "Tek Kişilik Lojman", ikon: "apartment" },
  { deger: "SERVIS", etiket: "Personel Servisi", ikon: "directions_car" },
  { deger: "SAGLIK", etiket: "Özel Sağlık Sigortası", ikon: "health_and_safety" },
  { deger: "YEMEK", etiket: "Yemek Kartı / Sodexo", ikon: "restaurant" },
  { deger: "UCAK", etiket: "Yıllık Uçak Bileti", ikon: "flight_takeoff" },
  { deger: "EKIPMAN", etiket: "Ekipman Desteği", ikon: "laptop_mac" },
  { deger: "SPOR", etiket: "Spor Salonu Üyeliği", ikon: "fitness_center" },
  { deger: "EGITIM", etiket: "Eğitim / Sertifika Bütçesi", ikon: "school" }
] as const;

export const DENEYIM_SEVIYELERI = [
  { deger: "JUN", etiket: "1-3 Yıl (Junior-Mid)", alt: "Giriş ve Orta Seviye" },
  { deger: "MID", etiket: "4-6 Yıl (Mid-Senior)", alt: "Kıdemli Orta Seviye" },
  { deger: "LEAD", etiket: "7+ Yıl (Lead / Principal)", alt: "Takım Lideri ve Üstü" }
] as const;

export const CEFR_DIL_SEVIYELERI = [
  { deger: "YOK", etiket: "Yabancı Dil Zorunlu Değil" },
  { deger: "B1", etiket: "İngilizce - B1 (Orta Düzey)" },
  { deger: "B2", etiket: "İngilizce - B2/C1 (Akıcı Profesyonel)" },
  { deger: "C2", etiket: "İngilizce - C2 (Anadil Düzeyinde)" },
  { deger: "RU_B2", etiket: "Rusça - B2 (İleri)" }
] as const;

export const FREELANCE_KATEGORILER = [
  { deger: "YAZILIM", etiket: "Yazılım & Web", aktifProje: 64 },
  { deger: "TASARIM", etiket: "UI/UX & WebGL 3D", aktifProje: 41 },
  { deger: "FINANS", etiket: "Finans & Muhasebe", aktifProje: 28 },
  { deger: "CEVIRI", etiket: "Çeviri & Yeminli", aktifProje: 22 },
  { deger: "PAZARLAMA", etiket: "Dijital Pazarlama", aktifProje: 19 },
  { deger: "MIMARLIK", etiket: "Mimarlık & Render", aktifProje: 13 }
] as const;

export const FREELANCE_KATEGORILERI = FREELANCE_KATEGORILER;
