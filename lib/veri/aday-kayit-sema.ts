import { z } from "zod";

export const AdayKayitSema = z
  .object({
    adSoyad: z.string().min(2, "Ad Soyad en az 2 karakter olmalı").max(80),
    cepTelefonu: z
      .string()
      .regex(
        /^(\+?90|\+?90392|0?5[0-9]{2})[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/,
        "KKTC veya Türkiye cep telefonu formatında olmalı (örn: +90 548 123 4567)"
      ),
    ikametDurumu: z.enum([
      "KKTC_VATANDAS",
      "TC_VATANDAS",
      "UCUNCU_ULKE",
      "OGRENCI"
    ]),
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    sifre: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalı")
      .max(128)
      .regex(/[A-Z]/, "Şifre en az bir büyük harf içermeli")
      .regex(/[0-9]/, "Şifre en az bir rakam içermeli"),
    sifreTekrar: z.string(),
    kvkAydinlatmaOnay: z.literal(true, {
      errorMap: () => ({ message: "KVK Aydınlatma Metni'ni okuyup onaylamalısınız" })
    }),
    acikRizaOnay: z.literal(true, {
      errorMap: () => ({ message: "Açık Rıza Beyanı'nı onaylamalısınız" })
    }),
    yasSiniriOnay: z.literal(true, {
      errorMap: () => ({ message: "15 yaşından büyük olduğunuzu onaylamalısınız" })
    })
  })
  .superRefine((veri, ctx) => {
    if (veri.sifre !== veri.sifreTekrar) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Şifreler birbiriyle eşleşmiyor",
        path: ["sifreTekrar"]
      });
    }
  });

export type AdayKayitVeri = z.infer<typeof AdayKayitSema>;
export type AdayKayitTipi = AdayKayitVeri;
export const ADAY_KAYIT_SEMA = AdayKayitSema;
