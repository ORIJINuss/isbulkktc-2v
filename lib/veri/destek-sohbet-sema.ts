import { z } from "zod";

export const DESTEK_SOHBET_ROTA = z.enum([
  "/ilan-ara",
  "/ilan-paketleri",
  "/sirketler",
  "/freelance",
  "/giris",
  "/aday-profilim",
  "/isveren/sirket-kaydi",
]);

export const DestekSohbetIstekSema = z
  .object({
    yerel: z.enum(["tr", "en", "ru", "he"]),
    mesajlar: z
      .array(
        z
          .object({
            rol: z.enum(["user", "assistant"]),
            metin: z.string().trim().min(1).max(600),
          })
          .strict(),
      )
      .min(1)
      .max(8)
      .refine((mesajlar) => mesajlar.at(-1)?.rol === "user"),
  })
  .strict();

export const DestekSohbetCevapSema = z
  .object({
    cevap: z.string().trim().min(1).max(2500),
    kaynak: z.enum(["hazir", "ai", "yedek"]),
    rota: DESTEK_SOHBET_ROTA.optional(),
  })
  .strict();

export type DestekSohbetMesaji = z.infer<
  typeof DestekSohbetIstekSema
>["mesajlar"][number];
export type DestekSohbetCevabi = z.infer<typeof DestekSohbetCevapSema>;
