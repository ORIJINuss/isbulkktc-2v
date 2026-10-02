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

function hataMesajiniAl(hata: unknown): string {
  if (hata instanceof Error) return hata.message;
  if (typeof hata === "object" && hata !== null) {
    const alanlar = [
      "code" in hata && typeof hata.code === "string" ? hata.code : undefined,
      "message" in hata && typeof hata.message === "string" ? hata.message : undefined,
    ].filter((alan): alan is string => Boolean(alan));
    if (alanlar.length > 0) return alanlar.join(": ");
  }
  return String(hata);
}

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
    yaz("hata", mesaj, { ...alanlar, hata: hataMesajiniAl(hata) }),
};
