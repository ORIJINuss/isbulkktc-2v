import { z } from "zod";
import { sunucuIcinSupabaseOlustur } from "@/lib/supabase/sunucu-istemci";
import { log } from "@/lib/sunucu/loglama";

/**
 * REQ-JOB-LIVE-001 — Canli ilan verisi.
 *
 * Yalnızca kanıtlanmış alanlar okunur:
 *  - job_posts: id, company_id, title, slug, summary, description, location,
 *    employment_type, remote_policy, salary_min, salary_max, currency,
 *    is_featured, published_at, expires_at
 *  - companies (herkese acik alanlar): company_name, slug, logo_url
 *
 * Kolon semantigi dogrulanmayan filtreler bu katmana hic girmez.
 */

export const ILAN_ALANLARI =
  "id, company_id, title, slug, summary, description, location, employment_type, remote_policy, salary_min, salary_max, currency, is_featured, published_at, expires_at, companies!inner(company_name, slug, logo_url, is_verified)";

export const ILAN_SIRALAMALARI = ["akilli", "yeni", "maas"] as const;
export type IlanSiralamasi = (typeof ILAN_SIRALAMALARI)[number];

/** Uygulama genelinde veritabani karsiligi olmayan, bu yuzden uygulanmayan filtreler. */
export const DESTEKLENMEYEN_FILTRELER = [
  "sektorKodlari",
  "izinTipiKodlari",
  "acilMi",
  "lojmanVarMi",
  "calismaSekliKodlari",
  "siralaAcil",
] as const;

export type IlanAramaFiltreleri = {
  arama?: string;
  konum?: string;
  uzaktan?: boolean;
  minMaas?: number;
  makMaas?: number;
  paraBirimi?: string;
  maasBelirtilmisMi?: boolean;
  dogrulanmisIsverenMi?: boolean;
  oneCikanlarMi?: boolean;
  yayinGun?: number;
  siralama?: IlanSiralamasi;
  sayfa?: number;
  sayfaBoyutu?: number;
};

const SirketSatiriSema = z.object({
  company_name: z.string().nullable(),
  slug: z.string().nullable(),
  logo_url: z.string().nullable(),
  is_verified: z.boolean().nullish().transform((deger) => deger ?? false),
});

export type IlanSirketSatiri = z.infer<typeof SirketSatiriSema>;

/** PostgREST gomulu kaynaklari many-to-one oldugunda nesne, aksi halde dizi dondurebilir. */
const SirketGomuluSema = z.union([
  SirketSatiriSema.nullable(),
  SirketSatiriSema.array(),
]);

/** Kanonik sirket bilgisi: her zaman tek nesne ya da null. */
export type IlanSirketBilgisi = IlanSirketSatiri | null;

const sirketBilgisiniCoz = (
  gomulu: z.infer<typeof SirketGomuluSema>
): IlanSirketBilgisi => {
  if (Array.isArray(gomulu)) return gomulu[0] ?? null;
  return gomulu ?? null;
};

const metinSema = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((deger) => {
    if (deger === null || deger === undefined) return null;
    const metin = String(deger).trim();
    return metin.length > 0 ? metin : null;
  });

const tarihSema = metinSema.refine(
  (deger) => deger === null || !Number.isNaN(Date.parse(deger)),
  { message: "Tarih bicimi cozulemedi." }
);

const tutarSema = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((deger) => {
    if (deger === null || deger === undefined || deger === "") return null;
    return typeof deger === "number" ? deger : Number(deger);
  })
  .refine((deger) => deger === null || Number.isFinite(deger), {
    message: "Maas tutari sayiya degil.",
  });

/**
 * Ham satir: PostgREST'in dondurdugu butun iliskili kaynak formalarini kabul
 * eder. Bu sema yalnizca ayrimtida (parse) kullanilir, disariya sizmaz.
 */
const HamIlanSatiriSema = z.object({
  id: z.string().min(1),
  company_id: z.string().nullable(),
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: metinSema,
  description: metinSema,
  location: metinSema,
  employment_type: metinSema,
  remote_policy: metinSema,
  salary_min: tutarSema,
  salary_max: tutarSema,
  currency: metinSema,
  is_featured: z.boolean().nullish().transform((deger) => deger ?? false),
  published_at: tarihSema,
  expires_at: tarihSema,
  companies: SirketGomuluSema,
});

/**
 * Kanonik public satir: gomulu sirket iliskisi ayrimtinda tek nesne ya da
 * null'a indirgenir. Boylece API, kart, detay ve JSON-LD tarafinda
 * `companies` her zaman `IlanSirketBilgisi` tipindedir (dizi formu asla tasmaz).
 */
export const IlanSatiriSema = HamIlanSatiriSema.transform((satir) => ({
  ...satir,
  companies: sirketBilgisiniCoz(satir.companies),
}));

export type IlanAramaSatiri = z.infer<typeof IlanSatiriSema>;

const aramaMetniniTemizle = (deger: string): string =>
  deger
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

const konumMetniniTemizle = (deger: string): string =>
  deger
    .replace(/[%_\\]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

export async function ilanlariAra(filtreler: IlanAramaFiltreleri = {}) {
  const supabase = await sunucuIcinSupabaseOlustur();
  const sayfaBoyutu = Math.min(Math.max(filtreler.sayfaBoyutu ?? 20, 1), 50);
  const sayfa = Math.max(filtreler.sayfa ?? 1, 1);
  const baslangic = (sayfa - 1) * sayfaBoyutu;
  const bitis = baslangic + sayfaBoyutu - 1;
  const simdi = new Date().toISOString();

  let sorgu = supabase
    .from("job_posts")
    .select(ILAN_ALANLARI, { count: "exact" });
  sorgu = sorgu.eq("status", "active");
  sorgu = sorgu.not("published_at", "is", null);
  sorgu = sorgu.or(`expires_at.is.null,expires_at.gt.${simdi}`);

  const arama = filtreler.arama ? aramaMetniniTemizle(filtreler.arama) : "";
  if (arama) {
    sorgu = sorgu.textSearch("title", arama, {
      type: "websearch",
      config: "simple",
    });
  }

  const konum = filtreler.konum ? konumMetniniTemizle(filtreler.konum) : "";
  if (konum) {
    sorgu = sorgu.ilike("location", `%${konum}%`);
  }

  if (filtreler.uzaktan) {
    sorgu = sorgu.in("remote_policy", ["remote", "hybrid"]);
  }

  if (
    typeof filtreler.minMaas === "number" &&
    Number.isFinite(filtreler.minMaas) &&
    filtreler.minMaas > 0
  ) {
    sorgu = sorgu.gte("salary_max", filtreler.minMaas);
  }

  if (
    typeof filtreler.makMaas === "number" &&
    Number.isFinite(filtreler.makMaas) &&
    filtreler.makMaas > 0
  ) {
    sorgu = sorgu.lte("salary_min", filtreler.makMaas);
  }

  const paraBirimi = filtreler.paraBirimi?.trim().toUpperCase();
  if (paraBirimi) {
    sorgu = sorgu.eq("currency", paraBirimi);
  }

  if (filtreler.maasBelirtilmisMi) {
    sorgu = sorgu.not("salary_min", "is", null);
  }

  if (filtreler.dogrulanmisIsverenMi) {
    sorgu = sorgu.eq("companies.is_verified", true);
  }

  if (filtreler.oneCikanlarMi) {
    sorgu = sorgu.eq("is_featured", true);
  }

  const yayinGun = filtreler.yayinGun;
  if (typeof yayinGun === "number" && Number.isFinite(yayinGun) && yayinGun > 0) {
    const esik = new Date(Date.now() - yayinGun * 24 * 60 * 60 * 1000).toISOString();
    sorgu = sorgu.gte("published_at", esik);
  }

  const siralama = filtreler.siralama ?? "akilli";
  if (siralama === "yeni") {
    sorgu = sorgu
      .order("published_at", { ascending: false })
      .order("id", { ascending: true });
  } else if (siralama === "maas") {
    sorgu = sorgu
      .order("salary_max", { ascending: false, nullsFirst: false })
      .order("published_at", { ascending: false })
      .order("id", { ascending: true });
  } else {
    sorgu = sorgu
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false })
      .order("id", { ascending: true });
  }

  sorgu = sorgu.range(baslangic, bitis);

  const { data, error, count } = await sorgu;
  if (error) {
    log.hata("ilanlariAra: canli ilan sorgusu basarisiz", error, {
      sayfa,
      sayfaBoyutu,
    });
    throw new Error("İlan araması tamamlanamadı.");
  }

  // PostgREST basarili bir SELECT icinde her zaman satir dizisi dondurmeli.
  // null / dizi olmayan cevap "bos sonuc" sayilmaz, sozlesme ihlali olarak islenir;
  // gecerli ve bos [] cevabi ise normal bos liste olarak devam eder.
  const veriHam: unknown = data;
  if (!Array.isArray(veriHam)) {
    log.hata(
      "ilanlariAra: sorgu cevabi satir dizisi degil, veri sozlesmesi ihlali",
      "Beklenen: satir dizisi.",
      {
        alinanTip: veriHam === null ? "null" : typeof veriHam,
        sayfa,
        sayfaBoyutu,
      }
    );
    throw new Error("İlan araması tamamlanamadı.");
  }

  const veri = z.array(IlanSatiriSema).safeParse(veriHam);
  if (!veri.success) {
    log.hata("ilanlariAra: satir semasi uyusmadi, veri sozlesmesi ihlali", veri.error, {
      ayiklanan: veri.error.issues.slice(0, 10).map((i) => i.path.join(".")),
      sorunSayisi: veri.error.issues.length,
    });
    throw new Error("İlan araması tamamlanamadı.");
  }

  return {
    ilanlar: veri.data,
    toplam: count ?? 0,
    sayfa,
    sayfaBoyutu,
    dahaFazla: (count ?? 0) > bitis + 1,
  };
}

export type IlanAramaSonucu = Awaited<ReturnType<typeof ilanlariAra>>;

/**
 * Slug ile tek bir canli ilan getirir. Gorunurluk sartlari (aktif, yayinda,
 * süresi dolmamis) listenin aynisidir; bulunamazsa null doner.
 */
export async function canliIlanGetir(
  slug: string
): Promise<IlanAramaSatiri | null> {
  const temizSlug = slug.trim();
  if (!temizSlug) return null;

  const supabase = await sunucuIcinSupabaseOlustur();
  const simdi = new Date().toISOString();

  const { data, error } = await supabase
    .from("job_posts")
    .select(ILAN_ALANLARI)
    .eq("slug", temizSlug)
    .eq("status", "active")
    .not("published_at", "is", null)
    .or(`expires_at.is.null,expires_at.gt.${simdi}`)
    .limit(1);

  if (error) {
    log.hata("canliIlanGetir: ilan sorgusu basarisiz", error, { slug: temizSlug });
    throw new Error("İlan bilgisi alınamadı.");
  }

  // null / dizi olmayan cevap 404 (yok) anlamina gelmez; sozlesme ihlalidir.
  // Gecerli ve bos [] cevabi ise "yayinda ilan yok" sonucudur.
  const veriHam: unknown = data;
  if (!Array.isArray(veriHam)) {
    log.hata(
      "canliIlanGetir: sorgu cevabi satir dizisi degil, veri sozlesmesi ihlali",
      "Beklenen: satir dizisi.",
      { slug: temizSlug, alinanTip: veriHam === null ? "null" : typeof veriHam }
    );
    throw new Error("İlan bilgisi alınamadı.");
  }

  const ham = veriHam[0];
  if (!ham) return null;

  const veri = IlanSatiriSema.safeParse(ham);
  if (!veri.success) {
    log.hata("canliIlanGetir: satir semasi uyusmadi, veri sozlesmesi ihlali", veri.error, {
      slug: temizSlug,
      ayiklanan: veri.error.issues.slice(0, 10).map((i) => i.path.join(".")),
    });
    throw new Error("İlan bilgisi alınamadı.");
  }

  return veri.data;
}
