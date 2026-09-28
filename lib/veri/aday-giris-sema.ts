import { z } from "zod";

export const AdayGirisSema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  sifre: z.string().min(6, "Şifre en az 6 karakter olmalı").max(128),
  beniHatirla: z.boolean().default(false).optional(),
  turnstileToken: z.string().min(10, "Güvenlik doğrulamasını tamamlayınız"),
});

export type AdayGirisVeri = z.infer<typeof AdayGirisSema>;
export type AdayGirisTipi = AdayGirisVeri;
export const ADAY_GIRIS_SEMA = AdayGirisSema;
