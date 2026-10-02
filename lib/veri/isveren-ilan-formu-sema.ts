import { z } from "zod";
import type {
  IlceKodu,
  CalismaModeliKodu,
  CalismaSekliKodu,
  IzinTipiKodu,
  ParaBirimiKodu,
  YanHakKodu,
  CefrSeviyesi,
} from "./ilan-tipi";

const TemelAdimSema = z.object({
  ilanBasligi: z.string().min(4, "İlan başlığı en az 4 karakter olmalı").max(160),
  naceKodu: z.string().min(3).max(32),
  iscoGrubu: z.string().min(3).max(32),
  sektorKodu: z.string().min(2).max(32),
  ilceKodlari: z
    .array(z.string() as z.ZodType<IlceKodu>)
    .min(1, "En az bir ilçe seçmelisiniz")
    .max(7),
  calismaSekliKodu: z.enum([
    "TAM_ZAMANLI",
    "YARI_ZAMANLI",
    "FREELANCE",
    "SEZONLUK",
    "STAJYER",
  ]) as z.ZodType<CalismaSekliKodu>,
  calismaModeli: z.enum(["HIBRIT", "OFISTE", "UZAKTAN"]) as z.ZodType<
    CalismaModeliKodu | "HIBRIT" | "OFISTE" | "UZAKTAN"
  >,
  isTanimi: z
    .string()
    .min(40, "İş tanımı en az 40 karakter olmalı")
    .max(8000),
});

const YasalAdimSema = z.object({
  izinTipiKodlari: z
    .array(z.string() as z.ZodType<IzinTipiKodu>)
    .min(1, "En az bir çalışma izni türü seçmelisiniz")
    .max(5),
});

const MaasAdimSema = z.object({
  paraBirimi: z.enum(["GBP", "TRY", "EUR", "USD"]) as z.ZodType<ParaBirimiKodu>,
  minNetAylik: z.coerce.number().positive("Minimum maaş pozitif olmalı"),
  makNetAylik: z.coerce.number().positive("Maksimum maaş pozitif olmalı"),
  maasGizle: z.boolean().default(false),
  yanHakKodlari: z
    .array(z.string() as z.ZodType<YanHakKodu>)
    .max(16, "En fazla 16 yan hak seçilebilir")
    .default([]),
}).superRefine((v, ctx) => {
  if (!v.maasGizle && v.minNetAylik > v.makNetAylik) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Minimum maaş maksimumdan büyük olamaz",
      path: ["minNetAylik"],
    });
  }
});

const EslestirmeAdimSema = z.object({
  zorunluBeceriler: z
    .array(z.string())
    .max(64, "En fazla 64 beceri eklenebilir")
    .default([]),
  deneyimSeviyesi: z.enum(["JUN", "MID", "LEAD"]),
  yabanciDilSeviyesi: z.enum([
    "YOK",
    "B1",
    "B2",
    "C1",
    "C2",
    "RU_B2",
  ]) as z.ZodType<CefrSeviyesi | "YOK" | "RU_B2">,
});

const PaketAdimSema = z.object({
  vitrinOdeme: z.boolean().default(false),
  acilRozeti: z.boolean().default(false),
  sureUzatma: z.boolean().default(false),
  cvHavuzuErisim: z.boolean().default(false),
});

export const IsverenIlanFormuSema = z.object({
  temel: TemelAdimSema,
  yasal: YasalAdimSema,
  maas: MaasAdimSema,
  eslestirme: EslestirmeAdimSema,
  paket: PaketAdimSema.optional(),
});

export type IsverenIlanFormVeri = z.infer<typeof IsverenIlanFormuSema>;
export type IsverenIlanFormTipi = IsverenIlanFormVeri;
export type IsverenIlanFormuTipi = IsverenIlanFormVeri;
export const ISVEREN_ILAN_FORMU_SEMA = IsverenIlanFormuSema;

export const ADIM_SAYISI = 4;
export const ADIM_BASLIKLARI = [
  "Temel Bilgiler",
  "Yasal & İzin",
  "Maaş & Yan Haklar",
  "Aday Kriterleri",
];
