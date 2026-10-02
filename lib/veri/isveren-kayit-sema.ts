import { z } from "zod";

export const IsverenKayitSema = z.object({
  sirketAdi: z.string().min(2).max(160),
  vergiKimlikNo: z
    .string()
    .min(6)
    .max(32)
    .regex(/^[A-Z0-9-]{6,32}$/, "VKN / TCKN formatı uyuşmuyor"),
  yetkiliEposta: z.string().email(),
  sifre: z
    .string()
    .min(10)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
  kvkOnay: z.literal(true)
});

export type IsverenKayitVeri = z.infer<typeof IsverenKayitSema>;
export type IsverenKayitTipi = IsverenKayitVeri;
export const ISVEREN_KAYIT_SEMA = IsverenKayitSema;
