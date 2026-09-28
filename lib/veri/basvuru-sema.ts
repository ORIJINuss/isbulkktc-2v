import { z } from "zod";
import type { IzinTipiKodu } from "./ilan-tipi";

export const BasvuruSema = z.object({
  ilanSlug: z.string().min(3, "Geçersiz ilan bağlantısı"),
  adSoyad: z.string().min(2, "Ad Soyad en az 2 karakter olmalı").max(80),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  cepTelefonu: z
    .string()
    .regex(
      /^(\+?90|\+?90392|0?5[0-9]{2})[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/,
      "KKTC veya Türkiye cep telefonu formatında olmalı (örn: +90 548 123 4567)"
    ),
  ikametIzinDurumu: z.enum([
    "NORMAL_1",
    "NORMAL_2",
    "VATANDAS",
    "OGRENCI",
    "YOK",
  ]) as z.ZodType<IzinTipiKodu>,
  kapakMektubu: z
    .string()
    .max(2000, "Kapak mektubu en fazla 2000 karakter olabilir")
    .optional(),
  cvDosyaYolu: z.string().min(3).max(512).optional().or(z.literal("")),
  gizlilikIzni: z.literal(true, {
    errorMap: () => ({
      message: "KVK 89/2007 uyarınca gizlilik iznini onaylamalısınız",
    }),
  }),
});

export const BASVURU_SEMA = BasvuruSema;
export type BasvuruVeri = z.infer<typeof BasvuruSema>;
export type BasvuruTipi = BasvuruVeri;
