import { randomUUID } from "crypto";

export type IstekBaglami = { istekKimligi: string; yol?: string; method?: string };

export function istekBaglamiOlustur(istek: Request): IstekBaglami {
  return {
    istekKimligi: istek.headers.get("x-request-id")?.trim() || randomUUID(),
    yol: new URL(istek.url).pathname,
    method: istek.method,
  };
}

type LogAlanlari = Record<string, unknown>;
function yaz(seviye: "bilgi" | "uyari" | "hata", mesaj: string, alanlar: LogAlanlari = {}) {
  const kayit = JSON.stringify({ zaman: new Date().toISOString(), seviye, mesaj, ...alanlar });
  if (seviye === "hata") console.error(kayit);
  else if (seviye === "uyari") console.warn(kayit);
  else console.info(kayit);
}

export const log = {
  bilgi: (mesaj: string, alanlar?: LogAlanlari) => yaz("bilgi", mesaj, alanlar),
  uyari: (mesaj: string, alanlar?: LogAlanlari) => yaz("uyari", mesaj, alanlar),
  hata: (mesaj: string, hata: unknown, alanlar: LogAlanlari = {}) =>
    yaz("hata", mesaj, { ...alanlar, hata: hata instanceof Error ? hata.message : String(hata) }),
};
