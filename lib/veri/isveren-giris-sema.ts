import { z } from "zod";

export const IsverenGirisSema = z.object({
  yetkiliEposta: z.string().email("Geçerli bir kurumsal e-posta giriniz"),
  sifre: z.string().min(6, "Şifre en az 6 karakter olmalı").max(128),
  beniHatirla: z.boolean().default(false).optional(),
  turnstileToken: z.string().min(10, "Güvenlik doğrulamasını tamamlayınız"),
});

export type IsverenGirisVeri = z.infer<typeof IsverenGirisSema>;
export type IsverenGirisTipi = IsverenGirisVeri;
export const ISVEREN_GIRIS_SEMA = IsverenGirisSema;
