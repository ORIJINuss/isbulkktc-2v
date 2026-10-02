import { z } from "zod";
import type {
  IlanFiltreleri,
  ParaBirimiKodu,
  IlceKodu,
  CalismaSekliKodu,
  IzinTipiKodu,
} from "./ilan-tipi";

export const IlanAraSema = z.object({
  arananKelime: z
    .string()
    .max(120, "Arama sorgusu en fazla 120 karakter olabilir")
    .optional(),
  sayfa: z.coerce.number().int().positive().default(1),
  sayfaBasi: z.coerce.number().int().min(1).max(60).default(20),
  ilceKodlari: z.array(z.string()).default([]),
  sektorKodlari: z.array(z.string()).default([]),
  calismaSekliKodlari: z.array(z.string()).default([]),
  izinTipiKodlari: z.array(z.string()).default([]),
  minMaas: z.coerce.number().nonnegative().optional(),
  makMaas: z.coerce.number().nonnegative().optional(),
  paraBirimi: z.enum(["GBP", "TRY", "EUR", "USD"]).default("GBP") as z.ZodType<
    ParaBirimiKodu | undefined,
    any,
    ParaBirimiKodu | undefined
  >,
  yayinTarihiAraligiGun: z.enum(["1", "3", "7", "0"]).default("0"),
  acilMi: z.boolean().default(false),
  siralama: z
    .enum(["akilli", "yeni", "maas", "acil"])
    .default("akilli") as z.ZodType<
    IlanFiltreleri["siralama"],
    any,
    IlanFiltreleri["siralama"]
  >,
  kademeliGevsetmeAktif: z.boolean().default(true),
  sadeceFreelance: z.boolean().default(false),
  maasBelirtilmisMi: z.boolean().default(false),
  lojmanVarMi: z.boolean().default(false),
}).superRefine((veri, ctx) => {
  if (
    veri.minMaas !== undefined &&
    veri.makMaas !== undefined &&
    veri.minMaas > veri.makMaas
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["minMaas"],
      message: "Minimum maaş maksimum maaştan büyük olamaz",
    });
  }
});

export type IlanAraSorgu = z.infer<typeof IlanAraSema>;
export type IlanAraSemaTipi = IlanAraSorgu;

export function aramaSorgusundanFiltreye(
  sorgu: IlanAraSorgu
): IlanFiltreleri {
  const yayinGun = Number(sorgu.yayinTarihiAraligiGun);
  return {
    arananKelime: sorgu.arananKelime,
    ilceKodlari: sorgu.ilceKodlari as IlceKodu[],
    sektorKodlari: sorgu.sektorKodlari,
    calismaSekliKodlari: sorgu.calismaSekliKodlari as CalismaSekliKodu[],
    izinTipiKodlari: sorgu.izinTipiKodlari as IzinTipiKodu[],
    minMaas: sorgu.minMaas,
    makMaas: sorgu.makMaas,
    paraBirimi: sorgu.paraBirimi as ParaBirimiKodu | undefined,
    yayinTarihiAraligiGun: yayinGun > 0 ? yayinGun : undefined,
    acilMi: sorgu.acilMi || undefined,
    siralama: sorgu.siralama,
    sadeceFreelance: sorgu.sadeceFreelance || undefined,
    maasBelirtilmisMi: sorgu.maasBelirtilmisMi || undefined,
    lojmanVarMi: sorgu.lojmanVarMi || undefined,
  };
}
