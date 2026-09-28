type Kanallar = "banka" | "mobi" | "kripto";

export type OdemeEmri = {
  id: string;
  tutar: number;
  paraBirimi: "GBP" | "TRY" | "USD" | "USDC" | "EUR";
  kanal: Kanallar;
  musteriId?: string;
  aciklama: string;
  olusturulma: string;
  durum: "Bekliyor" | "Basarili" | "Basarisiz" | "IadeEdildi";
  referans?: string;
  dekontYolu?: string;
};

export default class OdemeServisi {
  private odemeler: OdemeEmri[];

  constructor(odemeler?: OdemeEmri[]) {
    this.odemeler = odemeler ?? [];
  }

  kdvHesapla(araToplam: number, oran = 0.2): { kdv: number; toplam: number } {
    const kdv = Number((araToplam * oran).toFixed(2));
    return { kdv, toplam: Number((araToplam + kdv).toFixed(2)) };
  }

  kurCevir(
    tutar: number,
    kaynak: OdemeEmri["paraBirimi"],
    hedef: OdemeEmri["paraBirimi"]
  ): number {
    const oranlar: Record<OdemeEmri["paraBirimi"], number> = {
      GBP: 1,
      TRY: 42.5,
      USD: 1.27,
      USDC: 1.27,
      EUR: 1.17,
    };
    const gbptutar = tutar / oranlar[kaynak];
    return Number((gbptutar * oranlar[hedef]).toFixed(2));
  }

  private siparisIdUret(prefix = "ISB"): string {
    const ts = Date.now().toString().slice(-8);
    const rast = Math.round(Math.random() * 8999 + 1000);
    return `${prefix}-2026-${ts}-${rast}`;
  }

  async odemeEmriOlustur(opts: {
    tutar: number;
    paraBirimi: OdemeEmri["paraBirimi"];
    kanal: Kanallar;
    musteriId?: string;
    aciklama: string;
  }): Promise<OdemeEmri> {
    const emir: OdemeEmri = {
      id: this.siparisIdUret(),
      tutar: opts.tutar,
      paraBirimi: opts.paraBirimi,
      kanal: opts.kanal,
      musteriId: opts.musteriId,
      aciklama: opts.aciklama,
      olusturulma: new Date().toISOString(),
      durum: "Bekliyor",
    };
    this.odemeler = [emir, ...this.odemeler];
    return emir;
  }

  async fastDekontKontrol(emirId: string, dekont: {
    gonderenIBAN: string;
    aliciIBAN: string;
    tutar: number;
    paraBirimi: OdemeEmri["paraBirimi"];
    tarih: string;
    dekontPDFBuffer?: Uint8Array;
  }): Promise<OdemeEmri> {
    const emir = this.odemeler.find((o) => o.id === emirId);
    if (!emir) throw new Error("Ödeme emri bulunamadı");
    const tutarUyusuyor =
      Math.abs(dekont.tutar - emir.tutar) <= 0.02 &&
      dekont.paraBirimi === emir.paraBirimi;
    if (!tutarUyusuyor) {
      emir.durum = "Basarisiz";
      return emir;
    }
    emir.durum = "Basarili";
    emir.referans = `FAST-${dekont.tarih.slice(0, 10).replace(/-/g, "")}-${Math.round(Math.random() * 9000 + 1000)}`;
    return emir;
  }

  async mobipaidOdemeLinkiUret(emirId: string, cepNo: string): Promise<{ link: string; gecerlilik: string }> {
    const emir = this.odemeler.find((o) => o.id === emirId);
    if (!emir) throw new Error("Ödeme emri bulunamadı");
    const b64 = Buffer.from(`${emirId}:${cepNo}:${Date.now()}`).toString("base64url");
    return {
      link: `https://odeme.isbulkktc.ku/mobi/${b64}`,
      gecerlilik: new Date(Date.now() + 30 * 60_000).toISOString(),
    };
  }

  async usdcTxIDDogrula(emirId: string, txid: string, beklenenAdres: string): Promise<OdemeEmri> {
    const emir = this.odemeler.find((o) => o.id === emirId);
    if (!emir) throw new Error("Ödeme emri bulunamadı");
    const formatUygun = /^0x[a-fA-F0-9]{64}$/.test(txid.trim());
    if (!formatUygun) {
      emir.durum = "Basarisiz";
      return emir;
    }
    emir.durum = "Basarili";
    emir.referans = `BASE-SCAN-${txid.slice(0, 10)}`;
    return emir;
  }

  async iadeEt(emirId: string, neden: string): Promise<OdemeEmri> {
    const emir = this.odemeler.find((o) => o.id === emirId);
    if (!emir) throw new Error("Ödeme emri bulunamadı");
    if (emir.durum !== "Basarili") {
      throw new Error("Sadece başarılı ödemeler iade edilebilir.");
    }
    emir.durum = "IadeEdildi";
    emir.aciklama = `${emir.aciklama} · İade: ${neden}`;
    return emir;
  }

  faturaOzet(
    paketFiyat: number,
    ekVitrin = 0,
    ekAcil = 0,
    kdvOran = 0.2
  ) {
    const VITRIN_FIYAT = 35;
    const ACIL_FIYAT = 49;
    const ekler = ekVitrin * VITRIN_FIYAT + ekAcil * ACIL_FIYAT;
    const araToplam = paketFiyat + ekler;
    const { kdv, toplam } = this.kdvHesapla(araToplam, kdvOran);
    return {
      paketFiyat,
      ekVitrinTutar: ekVitrin * VITRIN_FIYAT,
      ekAcilTutar: ekAcil * ACIL_FIYAT,
      araToplam: Number(araToplam.toFixed(2)),
      kdv: Number(kdv.toFixed(2)),
      toplam: Number(toplam.toFixed(2)),
      siparisNo: this.siparisIdUret("FAT"),
      faturaTarihi: new Date().toISOString(),
    };
  }

  async listele(musteriId?: string): Promise<OdemeEmri[]> {
    const filtrelenmis = musteriId
      ? this.odemeler.filter((o) => o.musteriId === musteriId)
      : [...this.odemeler];
    return filtrelenmis.sort((a, b) => (a.olusturulma < b.olusturulma ? 1 : -1));
  }
}
