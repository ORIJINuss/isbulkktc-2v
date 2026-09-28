/**
 * Stitch 2.0 "Pearl Field Mineral" tasarım tokeni tipleri.
 *
 * Bu dosya `lib/tasarim/tasarim-tokenlari.json` dosyasının TypeScript karşılığıdır.
 * JSON tek kaynak (single source of truth) kabul edilir; buradaki tipler onun birebir
 * yapısını yansıtır. JSON'a yeni bir anahtar eklendiğinde buraya da eklenmelidir.
 *
 * Anahtarların büyük bölümü JSON'da tire (`-`) veya Türkçe karakter içerdiği için
 * TypeScript'te geçerli bir tanımlayıcı değildir; bu yüzden tırnak içinde yazılmıştır.
 */

// ─── Kök çerçeve ───

export interface TasarimSistemi {
  ad: string;
  tema: string;
  dil: string;
  "yön": string;
}

// ─── Renkler ───

export type RenkAnahtari =
  | "pearl-alan"
  | "pearl-sicak"
  | "pearl-ana"
  | "pearl-notr"
  | "pearl-soguk"
  | "bedford-gölge"
  | "bedford-temel"
  | "bedford-mineral"
  | "bedford-hafif"
  | "bedford-uzerine"
  | "buzlu-derin"
  | "buzlu-hava"
  | "buzlu-kenar"
  | "buzlu-beyaz"
  | "mineral-50"
  | "mineral-100"
  | "mineral-200"
  | "mineral-300"
  | "mineral-400"
  | "mineral-500"
  | "zeytin-inci"
  | "verdigris"
  | "mineral-teal"
  | "basari"
  | "basari-kapsayici"
  | "uyari"
  | "uyari-kapsayici"
  | "bilgi"
  | "bilgi-kapsayici"
  | "hata"
  | "hata-kapsayici"
  | "yüzey"
  | "yüzey-uzerinde"
  | "cizgi"
  | "cizgi-degisken"
  | "alan";

export type Renkler = Record<RenkAnahtari, string>;

// ─── Malzeme seviyeleri ───

export type MalzemeSeviyesi =
  | "level-0-alan"
  | "level-1-mineral"
  | "level-2-cam"
  | "level-3-kristal"
  | "level-4-kahraman";

export interface MalzemeSeviyesiTanimi {
  /** Zemin rengi: bir renk anahtarı adı, bir `rgba(...)` ifadesi veya sayısal şeffaflık. */
  arka: string;
  /** Kullanım davranışını tanımlayan açıklama. */
  ozellik: string;
  /** Yalnızca mineral seviyesinde bulunan 1px saç teli kenar. */
  sinir?: string;
  /** Cam ve kristal seviyelerinde bulunan gölge. */
  "gölge"?: string;
  /** Cam ve kristal seviyelerinde bulunan yüzey geçişi. */
  gradient?: string;
}

export type MalzemeSeviyeleri = Record<MalzemeSeviyesi, MalzemeSeviyesiTanimi>;

// ─── Boşluklar ve köşe yarıçapları ───

export type BoslukAnahtari = "xs" | "sm" | "md" | "lg" | "xl" | "olcu" | "dis";
export type Bosluklar = Record<BoslukAnahtari, string>;

export type KoseYaricaplari = {
  sm: string;
  md: string;
  lg: string;
  kart: string;
  "düğme-sm": string;
  "düğme-lg": string;
  dolgun: string;
};

// ─── Fontlar ───

export type Fontlar = {
  "latin-family": string;
  "hebrew-family": string;
  "ikon-family": string;
};

// ─── Tipografi hiyerarşisi ───

export interface TipografiBasamagi {
  /** Önerilen piksel aralığı, örn. `"40px-52px"`. */
  boyut: string;
  "satır-yüksekliği": string;
  "ağırlık": string;
  /** Yalnızca dar ekranlar için geçerli. */
  mobil?: string;
}

export type TipografiBasamaklari =
  | "display-hero"
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "secondary"
  | "metadata";

export type TipografiHiyerarsisi = Record<TipografiBasamaklari, TipografiBasamagi>;

// ─── Hareket ───

export interface HareketBasamagi {
  /** Önerilen süre aralığı, örn. `"120ms-220ms"`. */
  "hız": string;
  "eğri": string;
  "kullanım": string;
}

export type HareketBasamaklari = "micro" | "malzeme" | "atmosferik";

export type Hareket = Record<HareketBasamaklari, HareketBasamagi>;

// ─── Renk dağılımı hedefi ───

export type RenkDagilimiHedefi = {
  "pearl-alan": string;
  "mineral-notr": string;
  bedford: string;
  "optik-renkler": string;
  "buzlu-hava": string;
};

// ─── Yükseklik (gölge) seviyeleri ───

export type YukseklikSeviyeleri = {
  alan: string;
  "yüzey-karti": string;
  "yukseltilmis-dosye": string;
  kaplama: string;
};

// ─── Tam şema ───

export interface TasarimTokenlari {
  $aciklama: string;
  versiyon: string;
  "tasarim-sistemi": TasarimSistemi;
  renkler: Renkler;
  "malzeme-seviyeleri": MalzemeSeviyeleri;
  bosluklar: Bosluklar;
  "kose-yaricaplari": KoseYaricaplari;
  fontlar: Fontlar;
  "tipografi-hierarşi": TipografiHiyerarsisi;
  hareket: Hareket;
  "renk-dağılımı-hedefi": RenkDagilimiHedefi;
  "yukseklik-seviyeleri": YukseklikSeviyeleri;
}
