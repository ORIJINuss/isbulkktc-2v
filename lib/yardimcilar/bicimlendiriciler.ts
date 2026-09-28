export function paraFormatla(
  tutar: number,
  paraBirimiKodu: "GBP" | "TRY" | "EUR" | "USD" | "USDC" = "GBP",
  secenekler?: { maksOndalik?: number; sembolKonumu?: "sol" | "sag" }
): string {
  const { maksOndalik = 0, sembolKonumu = "sol" } = secenekler ?? {};
  const semboller: Record<string, string> = {
    GBP: "£",
    TRY: "₺",
    EUR: "€",
    USD: "$",
    USDC: "USDC "
  };
  const sembol = semboller[paraBirimiKodu] ?? paraBirimiKodu;
  const bicimli = new Intl.NumberFormat(paraBirimiKodu === "TRY" ? "tr-TR" : "en-GB", {
    maximumFractionDigits: maksOndalik,
    minimumFractionDigits: 0
  }).format(tutar);
  return sembolKonumu === "sol" ? `${sembol}${bicimli}` : `${bicimli} ${sembol}`;
}

export function tarihFormatla(tarih: Date | string, yerel: string = "tr-TR"): string {
  const d = typeof tarih === "string" ? new Date(tarih) : tarih;
  return new Intl.DateTimeFormat(yerel, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(d);
}

export function gunBazliNeKadarOnce(tarih: Date | string): string {
  const d = typeof tarih === "string" ? new Date(tarih) : tarih;
  const farkMilisaniye = Date.now() - d.getTime();
  const saatFarki = Math.floor(farkMilisaniye / (1000 * 60 * 60));
  const gunFarki = Math.floor(saatFarki / 24);

  if (saatFarki < 1) return "Az önce";
  if (saatFarki < 24) return `${saatFarki} saat önce`;
  if (gunFarki < 7) return `${gunFarki} gün önce`;
  if (gunFarki < 30) return `${Math.floor(gunFarki / 7)} hafta önce`;
  return tarihFormatla(d);
}

export function slugla(metin: string): string {
  return metin
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function atsRenkSınıfı(yuzde: number): string {
  if (yuzde >= 85) return "text-ana bg-ana-sabit border-ana-sabit/70";
  if (yuzde >= 70) return "text-ikincil-sabit-varyant-uzerinde bg-ikincil-sabit border-ikincil-sabit/60";
  if (yuzde >= 50) return "text-tersiyer-sabit-uzerinde bg-tersiyer-sabit border-tersiyer-sabit/60";
  return "text-hata-kapsayici-uzerinde bg-hata-kapsayici border-hata-kapsayici/70";
}
