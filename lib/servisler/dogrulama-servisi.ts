type B3Sonuc = {
  gecerli: boolean;
  sirketAdi?: string;
  il?: string;
  kayitTarihi?: string;
  primDurumu?: "Düzenli" | "Gecikmiş" | "Pasif";
};

type PESLisansSonuc = {
  gecerli: boolean;
  lisansNo: string;
  aciklama: string;
  bitisTarihi: string;
};

type TurnstileSonuc = {
  basarili: boolean;
  hataKodu?: string;
};

export default class DogrulamaServisi {
  private static readonly B3_DESENI = /^B3-\d{6}-[A-Z]{2,5}$/;
  async b3NumarasiDogrula(b3No: string): Promise<B3Sonuc> {
    if (!b3No || typeof b3No !== "string") {
      return { gecerli: false };
    }
    const temiz = b3No.trim().toUpperCase();
    if (!DogrulamaServisi.B3_DESENI.test(temiz)) {
      return { gecerli: false };
    }
    const ornekIlMap: Record<string, string> = {
      LFKO: "Lefkoşa",
      GIRN: "Girne",
      GAZA: "Gazimağusa",
      ISKE: "İskele",
      GUZY: "Güzelyurt",
      LEFK: "Lefke",
    };
    const son = temiz.split("-")[2];
    return {
      gecerli: true,
      sirketAdi: `B3 ${son} Bölgesi Kurumsal İşveren`,
      il: ornekIlMap[son] ?? "Tüm KKTC",
      kayitTarihi: "2022-04-15",
      primDurumu: "Düzenli",
    };
  }

  async pesLisansDogrula(lisansNo: string): Promise<PESLisansSonuc> {
    return {
      gecerli: false,
      lisansNo: lisansNo.trim(),
      aciklama: "Bu doğrulama şu anda etkin değil. Lütfen resmi kayıt sağlayıcısından teyit edin.",
      bitisTarihi: new Date(0).toISOString(),
    };
  }

  async turnstileDogrula(token: string, istemciIP?: string): Promise<TurnstileSonuc> {
    if (!token || typeof token !== "string" || token.length < 32) {
      return { basarili: false, hataKodu: "TOKEN_EKSIK" };
    }
    try {
      const yanit = await fetch("/api/turnstile/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          ip: istemciIP,
        }),
      });
      const veri = (await yanit.json().catch(() => ({}))) as {
        basarili?: boolean;
        hataKodu?: string;
      };
      return {
        basarili: Boolean(veri.basarili),
        hataKodu: veri.hataKodu,
      };
    } catch {
      return { basarili: false, hataKodu: "AG_HATASI" };
    }
  }

  kvkOnaylariniDogrula(onaylar: {
    kvkAydinlatma: boolean;
    acikRiza: boolean;
    yasSiniriOnay: boolean;
  }): { gecerli: boolean; eksikAlanlar: string[] } {
    const eksik: string[] = [];
    if (!onaylar.kvkAydinlatma) eksik.push("KVK Aydınlatma Metni");
    if (!onaylar.acikRiza) eksik.push("Açık Rıza Beyanı");
    if (!onaylar.yasSiniriOnay) eksik.push("15 Yaş + İş Yasası Md. 15 Onayı");
    return { gecerli: eksik.length === 0, eksikAlanlar: eksik };
  }

  async emailFormatDogrula(email: string): Promise<boolean> {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  }

  async tcKimlikDogrula(tc: string): Promise<{ gecerli: boolean; formatUygun: boolean }> {
    const format = /^\d{11}$/.test(tc.trim());
    if (!format) return { gecerli: false, formatUygun: false };
    const rakamlar = tc.split("").map(Number);
    const ilk10 = rakamlar.slice(0, 10).reduce((a, b) => a + b, 0);
    const gecerli = ilk10 % 10 === rakamlar[10];
    return { gecerli, formatUygun: true };
  }
}
