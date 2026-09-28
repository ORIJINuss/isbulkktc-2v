import { CALISMA_SEKILLERI } from "@/lib/sabitler/alan-degiskenleri";
import type {
  Ilan,
  IlanFiltreleri,
  IlceKodu,
  CalismaSekliKodu,
  IzinTipiKodu,
} from "@/lib/veri/ilan-tipi";

export class IlanServisi {
  constructor(private kaynak: Ilan[] = []) {}

  private eslesmeSkoru(ilan: Ilan): number {
    return ilan.aiEslestirme?.skor ?? ilan.atsYuzdesi ?? 0;
  }

  private maasMin(ilan: Ilan): number {
    if (ilan.maasAraligi?.min !== undefined && ilan.maasAraligi.min > 0) {
      return ilan.maasAraligi.min;
    }
    return ilan.minNetAylik ?? 0;
  }

  private maasMak(ilan: Ilan): number {
    if (ilan.maasAraligi?.mak !== undefined && ilan.maasAraligi.mak > 0) {
      return ilan.maasAraligi.mak;
    }
    return ilan.makNetAylik ?? 0;
  }

  listele(
    filtreler: IlanFiltreleri = {}
  ): { ilanlar: Ilan[]; toplam: number } {
    const suAn = Date.now();

    let sonuc: Ilan[] = [...this.kaynak];

    const arananKelime = (filtreler.arananKelime ?? "").trim().toLowerCase();
    if (arananKelime.length > 0) {
      sonuc = sonuc.filter((i) => {
        const baslik = (i.pozisyonBasligi ?? "").toLowerCase();
        const sirket = (i.sirketAdi ?? "").toLowerCase();
        const sektor = (i.sektorKodu ?? "").toLowerCase();
        const tanim = (i.isTanimi ?? "").toLowerCase();
        const ilceUzun = (i.ilce ?? "").toLowerCase();
        const beceriler = (i.zorunluBeceriler ?? []).join(" ").toLowerCase();
        const oneriler = (i.aiEslestirme?.oneriler ?? i.oneriler ?? [])
          .join(" ")
          .toLowerCase();
        return [
          baslik,
          sirket,
          sektor,
          tanim,
          ilceUzun,
          beceriler,
          oneriler,
        ].some((parca) => parca.includes(arananKelime));
      });
    }

    const ilceKodlari = filtreler.ilceKodlari ?? [];
    if (ilceKodlari.length > 0) {
      const tumKKTC = ilceKodlari.some((k) => k === "KKTC");
      if (!tumKKTC) {
        sonuc = sonuc.filter((i) => {
          const ilceKodlar = i.ilceler ?? [];
          const dizi: IlceKodu[] =
            ilceKodlar.length > 0 ? ilceKodlar : (i.ilce ? ["KKTC"] : []);
          return dizi.some((kod) => ilceKodlari.includes(kod));
        });
      }
    }

    const sektorKodlari = filtreler.sektorKodlari ?? [];
    if (sektorKodlari.length > 0) {
      sonuc = sonuc.filter((i) =>
        sektorKodlari.some((k) => k === i.sektorKodu)
      );
    }

    const calismaSekliKodlari = filtreler.calismaSekliKodlari ?? [];
    if (calismaSekliKodlari.length > 0) {
      sonuc = sonuc.filter((i) => {
        const anaSekil = i.calismaSekli as CalismaSekliKodu | undefined;
        const eskiKod = (
          CALISMA_SEKILLERI.find((c) => c.deger === i.calismaSekliKodu)?.deger ??
          null
        ) as CalismaSekliKodu | null;
        const aranan = calismaSekliKodlari;
        return (anaSekil && aranan.includes(anaSekil)) ||
          (eskiKod && aranan.includes(eskiKod))
          ? true
          : calismaSekliKodlari.length === 0;
      });
    }

    const izinTipiKodlari = filtreler.izinTipiKodlari ?? [];
    if (izinTipiKodlari.length > 0) {
      sonuc = sonuc.filter((i) => {
        const anaTipler = i.izinTipleri ?? [];
        const eskiTip = (i.calismaIzniTipiKodu as IzinTipiKodu | undefined) ?? null;
        const dizi = Array.from(new Set([...anaTipler, ...(eskiTip ? [eskiTip] : [])]));
        return dizi.some((t) => izinTipiKodlari.includes(t));
      });
    }

    if (filtreler.sadeceFreelance) {
      sonuc = sonuc.filter(
        (i) =>
          i.calismaSekli === "FREELANCE" || i.calismaSekliKodu === "FREELANCE"
      );
    }

    const minMaas = filtreler.minMaas;
    if (minMaas !== undefined && minMaas > 0) {
      sonuc = sonuc.filter((i) => this.maasMin(i) >= minMaas);
    }
    const makMaas = filtreler.makMaas;
    if (makMaas !== undefined && makMaas > 0) {
      sonuc = sonuc.filter((i) => {
        const mk = this.maasMak(i);
        return mk > 0 && mk <= makMaas;
      });
    }

    if (filtreler.b3OnayliMi === true) {
      sonuc = sonuc.filter((i) => i.b3OnayliMi);
    }
    if (filtreler.acilMi === true) {
      sonuc = sonuc.filter((i) => i.acilMi);
    }
    if (filtreler.maasBelirtilmisMi === true) {
      sonuc = sonuc.filter((i) => this.maasMin(i) > 0 && this.maasMak(i) > 0);
    }
    if (filtreler.lojmanVarMi === true) {
      sonuc = sonuc.filter((i) => (i.yanHaklar ?? []).includes("LOJMAN"));
    }
    if (filtreler.paraBirimi) {
      sonuc = sonuc.filter((i) => i.maasAraligi?.para === filtreler.paraBirimi);
    }
    const atsEsigiMin = filtreler.atsEsigiMin;
    if (atsEsigiMin !== undefined && atsEsigiMin > 0) {
      sonuc = sonuc.filter((i) => this.eslesmeSkoru(i) >= atsEsigiMin);
    }
    const tarihAraligiGun = filtreler.yayinTarihiAraligiGun;
    if (tarihAraligiGun !== undefined && tarihAraligiGun > 0) {
      const esik = suAn - tarihAraligiGun * 24 * 60 * 60 * 1000;
      sonuc = sonuc.filter((i) => {
        const ms = new Date(i.yayinTarihi).getTime();
        return !Number.isNaN(ms) && ms >= esik;
      });
    }

    const siralama = filtreler.siralama ?? "akilli";
    const akilliPuan = (i: Ilan): number => {
      const gunFarki =
        (suAn - new Date(i.yayinTarihi).getTime()) / (1000 * 60 * 60 * 24);
      return (
        this.eslesmeSkoru(i) * 0.55 +
        (i.b3OnayliMi ? 12 : 0) +
        (i.acilMi ? 6 : 0) +
        Math.max(0, 30 - gunFarki) * 0.15
      );
    };

    sonuc.sort((a, b) => {
      switch (siralama) {
        case "yeni":
          return (
            new Date(b.yayinTarihi).getTime() - new Date(a.yayinTarihi).getTime()
          );
        case "maas":
          return this.maasMak(b) - this.maasMak(a);
        case "acil":
          return Number(b.acilMi) - Number(a.acilMi);
        case "akilli":
        default:
          return akilliPuan(b) - akilliPuan(a);
      }
    });

    return { ilanlar: sonuc, toplam: sonuc.length };
  }

  faturaKDVHesapla(
    araToplam: number,
    kdvOrani = 0.2
  ): {
    araToplam: number;
    kdv: number;
    genelToplam: number;
  } {
    const kdv = Math.round(araToplam * kdvOrani * 100) / 100;
    return {
      araToplam,
      kdv,
      genelToplam: Math.round((araToplam + kdv) * 100) / 100,
    };
  }

  atsAralikOzeti(yuzde: number): string {
    if (yuzde >= 90)
      return "Mükemmel uyum — röportaj listesine girmeniz bekleniyor.";
    if (yuzde >= 75)
      return "Yüksek uyum — CV'nize 1-2 proje detayı ekleyerek öne geçebilirsiniz.";
    if (yuzde >= 55)
      return "Orta uyum — Beceri ve deneyim bölümünü genişletmek faydalı olur.";
    return "Düşük uyum — Alternatif 2-3 pozisyon inceleyin veya eğitime başvurun.";
  }
}

export const varsayilanIlanServisi = new IlanServisi();
export default IlanServisi;
