export type ParaBirimiKodu = "GBP" | "TRY" | "USD" | "EUR";

export type IlceKodu =
  | "KKTC"
  | "LEF"
  | "GIR"
  | "GAM"
  | "ISK"
  | "GUZ"
  | "LEFKE";

export type IzinTipiKodu =
  | "YOK"
  | "NORMAL_1"
  | "NORMAL_2"
  | "OGRENCI"
  | "VATANDAS";

export type CalismaSekliKodu =
  | "TAM_ZAMANLI"
  | "YARI_ZAMANLI"
  | "FREELANCE"
  | "SEZONLUK"
  | "STAJYER";

export type YanHakKodu =
  | "LOJMAN"
  | "SERVIS"
  | "SAGLIK"
  | "YEMEK"
  | "UCAK"
  | "EKIPMAN"
  | "SPOR"
  | "EGITIM";

export type IlanDurumu =
  | "AKTIF"
  | "TASLAK"
  | "SUREC_BITTI"
  | "KALDIRILDI";

export type CalismaModeliKodu = "OFISTE" | "HIBRIT" | "UZAKTAN";

export type CefrSeviyesi = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type YabanciDilSeviyesi = {
  dil: string;
  seviye: CefrSeviyesi;
};

export type Ilan = {
  id?: string;
  slug: string;
  referansNo: string;
  pozisyonBasligi: string;
  sirketKodu?: string;
  sirketAdi: string;
  sirketLogoUrl?: string;
  sirketProfilOzeti?: string;
  sektorKodu?: string;
  naceKodu?: string;
  iscoGrubu?: string;
  ilceler: IlceKodu[];
  calismaSekli: CalismaSekliKodu;
  calismaModeli: CalismaModeliKodu;
  izinTipleri: IzinTipiKodu[];
  maasAraligi: {
    gizli: boolean;
    min: number;
    mak: number;
    para: ParaBirimiKodu;
  };
  yanHaklar: YanHakKodu[];
  isTanimi: string;
  zorunluBeceriler: string[];
  tercihEdilenBeceriler?: string[];
  minDeneyimYili?: number;
  yabanciDilSeviyesi?: YabanciDilSeviyesi[];
  acilMi: boolean;
  yayinTarihi: string;
  sonBasvuruTarihi?: string;
  goruntulenmeSayisi: number;
  basvuruSayisi?: number;
  durum: IlanDurumu;

  /** @deprecated Yerine ilceler kullanın */
  ilce?: string;
  /** @deprecated Yerine pozisyonBasligi kullanın */
  baslik?: string;
  /** @deprecated Yerine maasAraligi kullanın */
  minNetAylik?: number;
  /** @deprecated Yerine maasAraligi kullanın */
  makNetAylik?: number;
  /** @deprecated Yerine calismaSekli + izinTipleri kullanın */
  calismaIzniTipiKodu?: IzinTipiKodu;
  /** @deprecated Yerine izinTipleri kullanın */
  izinKisaltma?: string;
  /** @deprecated Yerine sektorKodu kullanın */
  sektor?: string;
  /** @deprecated Yerine isTanimi kullanın */
  pozisyonTanimi?: string[];
  /** @deprecated Yerine zorunluBeceriler kullanın */
  teknikYetenekler?: { grup: string; etiketler: string[] }[];
  /** @deprecated Yerine acilMi kullanın */
  acilIlan?: boolean;
  /** @deprecated Yerine calismaSekli kullanın */
  calismaSekliKodu?: string;
  /** @deprecated Yerine maasAraligi.para kullanın */
  paraBirimi?: ParaBirimiKodu;
};

export type IlanFiltreleri = {
  arananKelime?: string;
  ilceKodlari?: IlceKodu[];
  sektorKodlari?: string[];
  calismaSekliKodlari?: CalismaSekliKodu[];
  izinTipiKodlari?: IzinTipiKodu[];
  minMaas?: number;
  makMaas?: number;
  paraBirimi?: ParaBirimiKodu;
  yayinTarihiAraligiGun?: number;
  acilMi?: boolean;
  siralama?: "akilli" | "yeni" | "maas" | "acil";
  sadeceFreelance?: boolean;
  maasBelirtilmisMi?: boolean;
  lojmanVarMi?: boolean;
};
