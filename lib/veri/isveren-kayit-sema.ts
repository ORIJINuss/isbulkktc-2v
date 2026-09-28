import { z } from "zod";

export const IsverenKayitSema = z.object({
  sirketAdi: z.string().min(2).max(160),
  vergiKimlikNo: z
    .string()
    .min(6)
    .max(32)
    .regex(/^[A-Z0-9-]{6,32}$/, "VKN / TCKN formatı uyuşmuyor"),
  b3SirketNo: z
    .string()
    .max(32)
    .regex(/^[0-9/-]{4,32}$|^$/, "B3 kayıt numarası rakam ve / içerebilir")
    .optional()
    .or(z.literal("")),
  naceKodu: z.string().min(3).max(16),
  ilce: z.string().min(2).max(48),
  yetkiliAdSoyad: z.string().min(2).max(80),
  yetkiliEposta: z.string().email(),
  yetkiliCep: z
    .string()
    .regex(/^(\+?90|\+?90392|0?5[0-9]{2})[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/),
  sifre: z
    .string()
    .min(10)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
  isverenHukukiBeyan: z.literal(true),
  kvkOnay: z.literal(true)
});

export type IsverenKayitVeri = z.infer<typeof IsverenKayitSema>;
export type IsverenKayitTipi = IsverenKayitVeri;
export const ISVEREN_KAYIT_SEMA = IsverenKayitSema;
