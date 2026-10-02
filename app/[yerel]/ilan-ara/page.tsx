"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Buton from "@/bilesenler/genel/Buton";
import Ikon3D from "@/bilesenler/genel/Ikon3D";
import VeritabaniIlanKart from "@/bilesenler/ilan/VeritabaniIlanKart";
import type {
  IlanAramaSatiri,
  IlanSiralamasi,
} from "@/lib/depolar/ilan-arama-deposu";

const SAYFA_BASI = 10;
const YAYIN_SECENEKLERI = [0, 1, 3, 7] as const;
const PARA_SECENEKLERI = ["", "GBP", "EUR", "TRY", "USD"] as const;
const KONUM_ONEKLERI = [
  "Lefkoşa",
  "Lefkosa",
  "Girne",
  "Kyrenia",
  "Gazimağusa",
  "Famagusta",
  "İskele",
  "Iskele",
  "Güzelyurt",
  "Morphou",
  "Lefke",
  "Lefka",
];

type FormDurumu = {
  arananKelime: string;
  konum: string;
  minMaas: string;
  makMaas: string;
  paraBirimi: string;
  uzaktan: boolean;
  maasBelirtilmisMi: boolean;
  dogrulanmisIsverenMi: boolean;
  oneCikanlarMi: boolean;
  yayinGun: number;
  siralama: IlanSiralamasi;
};

const BOS_FORM: FormDurumu = {
  arananKelime: "",
  konum: "",
  minMaas: "",
  makMaas: "",
  paraBirimi: "",
  uzaktan: false,
  maasBelirtilmisMi: false,
  dogrulanmisIsverenMi: false,
  oneCikanlarMi: false,
  yayinGun: 0,
  siralama: "akilli",
};

type ApiCevabi = {
  basarili?: boolean;
  hata?: string;
  ilanlar?: IlanAramaSatiri[];
  toplam?: number;
  sayfaBasi?: number;
};

type SonucDurumu = "bekliyor" | "yukleniyor" | "hata" | "hazir";

/** Yalnizca veritabani karsiligi dogrulanmis filtreler sorguya yazilir. */
function filtreSorgusu(form: FormDurumu): string {
  const params = new URLSearchParams();

  const kelime = form.arananKelime.trim();
  if (kelime) params.set("arananKelime", kelime);

  const konum = form.konum.trim();
  if (konum) params.set("konum", konum);

  const maas = Number(form.minMaas);
  if (form.minMaas.trim() !== "" && Number.isFinite(maas) && maas > 0) {
    params.set("minMaas", String(maas));
  }
  const makMaas = Number(form.makMaas);
  if (form.makMaas.trim() !== "" && Number.isFinite(makMaas) && makMaas > 0) {
    params.set("makMaas", String(makMaas));
  }
  if (form.paraBirimi) params.set("paraBirimi", form.paraBirimi);

  if (form.uzaktan) params.set("uzaktan", "true");
  if (form.maasBelirtilmisMi) params.set("maasBelirtilmisMi", "true");
  if (form.dogrulanmisIsverenMi) {
    params.set("dogrulanmisIsverenMi", "true");
  }
  if (form.oneCikanlarMi) params.set("oneCikanlarMi", "true");
  if (form.yayinGun > 0) params.set("yayinGun", String(form.yayinGun));

  params.set("siralama", form.siralama);
  return params.toString();
}

/** Sayfa duğmeleri icin komsu pencere; cok uzun listelerde tasmaz. */
function sayfaPenceresi(aktif: number, toplamSayfa: number): number[] {
  const enFazla = 7;
  if (toplamSayfa <= enFazla) {
    return Array.from({ length: toplamSayfa }, (_, i) => i + 1);
  }
  const bas = Math.min(Math.max(aktif - 2, 1), toplamSayfa - enFazla + 1);
  return Array.from({ length: enFazla }, (_, i) => bas + i);
}

const formuUrlDenOku = (): { form: FormDurumu; sayfa: number } => {
  if (typeof window === "undefined") return { form: BOS_FORM, sayfa: 1 };
  const params = new URLSearchParams(window.location.search);
  const siralama = params.get("siralama");
  const sayfaHam = Number(params.get("sayfa"));
  const yayinHam = Number(params.get("yayinGun"));
  const yayinGecerli = YAYIN_SECENEKLERI.some((gun) => gun === yayinHam);
  return {
    form: {
      ...BOS_FORM,
      arananKelime: (params.get("arananKelime") ?? "").slice(0, 120),
      konum: (params.get("konum") ?? "").slice(0, 80),
      minMaas: (params.get("minMaas") ?? "").slice(0, 12),
      makMaas: (params.get("makMaas") ?? "").slice(0, 12),
      paraBirimi: (params.get("paraBirimi") ?? "").slice(0, 3),
      uzaktan: params.get("uzaktan") === "true",
      maasBelirtilmisMi: params.get("maasBelirtilmisMi") === "true",
      dogrulanmisIsverenMi:
        params.get("dogrulanmisIsverenMi") === "true",
      oneCikanlarMi: params.get("oneCikanlarMi") === "true",
      yayinGun: yayinGecerli ? yayinHam : 0,
      siralama:
        siralama === "yeni" || siralama === "maas" || siralama === "akilli"
          ? siralama
          : "akilli",
    },
    sayfa:
      Number.isInteger(sayfaHam) && sayfaHam > 0 && sayfaHam <= 500
        ? sayfaHam
        : 1,
  };
};

export default function IlanAraSayfasi() {
  const t = useTranslations("ilanAra");
  const g = useTranslations("genel");

  const [form, setForm] = useState<FormDurumu>(BOS_FORM);
  const [sayfa, setSayfa] = useState(1);
  const [urlOkundu, setUrlOkundu] = useState(false);

  const [durum, setDurum] = useState<SonucDurumu>("bekliyor");
  const [ilanlar, setIlanlar] = useState<IlanAramaSatiri[]>([]);
  const [toplam, setToplam] = useState(0);
  const [hataMesaji, setHataMesaji] = useState<string | null>(null);
  const [denemeNo, setDenemeNo] = useState(0);

  const istekSayaci = useRef(0);

  useEffect(() => {
    const { form: ilkForm, sayfa: ilkSayfa } = formuUrlDenOku();
    setForm(ilkForm);
    setSayfa(ilkSayfa);
    setUrlOkundu(true);
  }, []);

  const filtreDizesi = useMemo(() => filtreSorgusu(form), [form]);
  const sorguDizesi = useMemo(
    () => `${filtreDizesi}&sayfa=${sayfa}&sayfaBasi=${SAYFA_BASI}`,
    [filtreDizesi, sayfa]
  );

  useEffect(() => {
    if (!urlOkundu) return;
    // Yerellestirilmis yolu koru; yalnizca sorgu dizesini degistir.
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${sorguDizesi}`
    );
  }, [sorguDizesi, urlOkundu]);

  useEffect(() => {
    if (!urlOkundu) return;
    const numara = istekSayaci.current + 1;
    istekSayaci.current = numara;
    const controller = new AbortController();
    let istekIptalEdildi = false;
    let zamanAsimi = false;
    let zamanlayiciIptal: ReturnType<typeof setTimeout> | null = null;

    const zamanlayici = setTimeout(async () => {
      setDurum("yukleniyor");
      zamanlayiciIptal = setTimeout(() => {
        zamanAsimi = true;
        controller.abort();
      }, 15_000);
      try {
        const cevap = await fetch(`/api/ilanlar?${sorguDizesi}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const govde = (await cevap.json().catch(() => null)) as ApiCevabi | null;
        if (istekSayaci.current !== numara) return;
        if (!cevap.ok || !govde?.basarili || !Array.isArray(govde.ilanlar)) {
          // Sunucu mesaji Turkce olabilir; arayuz metinleri yerellestirilmis kalsin.
          setHataMesaji(
            cevap.status === 503
              ? t("servisYapilandirilmamis")
              : cevap.status === 400
                ? t("sorguGecersiz")
                : t("sonucHatasiAciklama")
          );
          setIlanlar([]);
          setToplam(0);
          setDurum("hata");
          return;
        }
        setIlanlar(govde.ilanlar);
        setToplam(govde.toplam ?? 0);
        setHataMesaji(null);
        setDurum("hazir");
      } catch {
        if (istekIptalEdildi || istekSayaci.current !== numara) return;
        setHataMesaji(
          zamanAsimi ? t("sonucZamanAsimi") : t("sonucHatasiAciklama"),
        );
        setIlanlar([]);
        setToplam(0);
        setDurum("hata");
      } finally {
        if (zamanlayiciIptal) clearTimeout(zamanlayiciIptal);
      }
    }, 300);

    return () => {
      istekIptalEdildi = true;
      clearTimeout(zamanlayici);
      if (zamanlayiciIptal) clearTimeout(zamanlayiciIptal);
      controller.abort();
    };
  }, [sorguDizesi, urlOkundu, denemeNo, t]);

  const formGuncelle = (yeni: FormDurumu) => {
    setForm(yeni);
    setSayfa(1);
  };

  const sayfaSayisi = Math.max(1, Math.ceil(toplam / SAYFA_BASI));
  const etkinSayfa = Math.min(Math.max(sayfa, 1), sayfaSayisi);
  const ilkSatir = toplam === 0 ? 0 : (etkinSayfa - 1) * SAYFA_BASI + 1;
  const sonSatir = Math.min(etkinSayfa * SAYFA_BASI, toplam);
  const sayfaNumaralari = sayfaPenceresi(etkinSayfa, sayfaSayisi);

  useEffect(() => {
    if (durum === "hazir" && etkinSayfa !== sayfa) {
      setSayfa(etkinSayfa);
    }
  }, [durum, etkinSayfa, sayfa]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <header className="max-w-3xl space-y-2">
        <h1 className="font-haber font-black text-3xl sm:text-4xl tracking-tight text-ikincil">
          {t("sayfaBasligi")}
        </h1>
        <p className="text-ikincil/75 leading-relaxed">{t("sayfaAciklamasi")}</p>
      </header>

      {/* Veri kaynagi aciklamasi */}
      <section className="grid sm:grid-cols-2 gap-3.5">
        {[
          {
            ikon: "database",
            baslik: t("kesifBand1"),
            aciklama: t("kesifBand1Aciklama"),
            tur: "ana-kapsayici",
          },
          {
            ikon: "payments",
            baslik: t("kesifBand2"),
            aciklama: t("kesifBand2Aciklama"),
            tur: "altin-sabit/20",
          },
        ].map((kutu) => (
          <div
            key={kutu.baslik}
            className={`p-[1.125rem] rounded-2xl flex items-start gap-3.5 border border-ana-outline/30 ${
              kutu.tur === "ana-kapsayici"
                ? "bg-ana-kapsayici/50"
                : "bg-altin-sabit/15"
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-beyaz grid place-items-center shadow-mineral-dosye shrink-0">
              <span className="msimge text-ana text-xl" aria-hidden="true">
                {kutu.ikon}
              </span>
            </div>
            <div className="flex-1">
              <div className="font-haber font-bold text-ikincil leading-tight">
                {kutu.baslik}
              </div>
              <div className="text-[12px] text-ikincil/70 leading-snug mt-1">
                {kutu.aciklama}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Arama ve desteklenen filtreler */}
      <section className="mineral-kart p-5 sm:p-6 rounded-2xl space-y-5">
        <form
          className="grid sm:grid-cols-[1.4fr_1fr_auto] gap-3 items-end"
          onSubmit={(olay) => olay.preventDefault()}
          role="search"
          aria-label={t("aramaFormuEtiketi")}
        >
          <div>
            <label className="girdiEtiket" htmlFor="ilan-ara-kelime">
              {t("aramaEtiketi")}
            </label>
            <input
              id="ilan-ara-kelime"
              type="search"
              className="girdi w-full"
              placeholder={t("aramaYerTutucu")}
              value={form.arananKelime}
              maxLength={120}
              onChange={(olay) =>
                formGuncelle({ ...form, arananKelime: olay.target.value })
              }
            />
          </div>
          <div>
            <label className="girdiEtiket" htmlFor="ilan-ara-konum">
              {t("konumEtiketi")}
            </label>
            <input
              id="ilan-ara-konum"
              type="search"
              className="girdi w-full"
              placeholder={t("konumYerTutucu")}
              list="ilan-ara-konum-listesi"
              value={form.konum}
              maxLength={80}
              onChange={(olay) => formGuncelle({ ...form, konum: olay.target.value })}
            />
            <datalist id="ilan-ara-konum-listesi">
              {KONUM_ONEKLERI.map((oneri) => (
                <option key={oneri} value={oneri} />
              ))}
            </datalist>
          </div>
          <Buton
            tur="buton"
            varyant="ana"
            boyut="md"
            ikon="search"
            onClick={() => setDenemeNo((no) => no + 1)}
          >
            {t("ara")}
          </Buton>
        </form>

        <fieldset className="space-y-4 border-t border-ana-outline/25 pt-4">
          <legend className="text-[11px] font-black uppercase tracking-[0.18em] text-ikincil/55">
            {t("filtrelerBaslik")}
          </legend>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="girdiEtiket" id="yayin-etiket">
                {t("yayinTarihi")}
              </div>
              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-labelledby="yayin-etiket"
              >
                {YAYIN_SECENEKLERI.map((gun) => (
                  <button
                    key={gun}
                    type="button"
                    aria-pressed={form.yayinGun === gun}
                    onClick={() => formGuncelle({ ...form, yayinGun: gun })}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${
                      form.yayinGun === gun
                        ? "bg-ana text-beyaz border-ana"
                        : "bg-beyaz text-ikincil/75 border-ana-outline/40 hover:bg-ikincil-kapsayici/60"
                    }`}
                  >
                    {gun === 0
                      ? t("tumAktif")
                      : t("sonGunler", { gun: gun })}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="girdiEtiket" id="maas-araligi-etiket">
                {t("maaşAraligi")}
              </div>
              <div
                className="mt-1.5 grid grid-cols-2 gap-2"
                aria-labelledby="maas-araligi-etiket"
              >
                <div>
                  <label className="sr-only" htmlFor="min-maas">
                    {t("minMaasFiltre")}
                  </label>
                  <input
                    id="min-maas"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={100}
                    className="girdi w-full"
                    placeholder={t("minMaasFiltre")}
                    value={form.minMaas}
                    onChange={(olay) =>
                      formGuncelle({ ...form, minMaas: olay.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="sr-only" htmlFor="max-maas">
                    {t("makMaasFiltre")}
                  </label>
                  <input
                    id="max-maas"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={100}
                    className="girdi w-full"
                    placeholder={t("makMaasFiltre")}
                    value={form.makMaas}
                    onChange={(olay) =>
                      formGuncelle({ ...form, makMaas: olay.target.value })
                    }
                  />
                </div>
                <select
                  className="girdi col-span-2 w-full"
                  aria-label={t("paraBirimiEtiketi")}
                  value={form.paraBirimi}
                  onChange={(olay) =>
                    formGuncelle({ ...form, paraBirimi: olay.target.value })
                  }
                >
                  {PARA_SECENEKLERI.map((para) => (
                    <option key={para || "tum"} value={para}>
                      {para || t("tumParaBirimleri")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            {[
              {
                anahtar: "uzaktan",
                ikon: "public",
                yazi: t("uzaktanCalisilir"),
                kontrol: form.uzaktan,
                degistir: () => formGuncelle({ ...form, uzaktan: !form.uzaktan }),
              },
              {
                anahtar: "maasBelirtilmisMi",
                ikon: "paid",
                yazi: t("maasBelirtilmis"),
                kontrol: form.maasBelirtilmisMi,
                degistir: () =>
                  formGuncelle({
                    ...form,
                    maasBelirtilmisMi: !form.maasBelirtilmisMi,
                  }),
              },
              {
                anahtar: "dogrulanmisIsverenMi",
                ikon: "verified",
                yazi: t("dogrulanmisIsveren"),
                kontrol: form.dogrulanmisIsverenMi,
                degistir: () =>
                  formGuncelle({
                    ...form,
                    dogrulanmisIsverenMi: !form.dogrulanmisIsverenMi,
                  }),
              },
              {
                anahtar: "oneCikanlarMi",
                ikon: "star",
                yazi: t("sadeceOneCikan"),
                kontrol: form.oneCikanlarMi,
                degistir: () =>
                  formGuncelle({ ...form, oneCikanlarMi: !form.oneCikanlarMi }),
              },
            ].map((secim) => (
              <button
                key={secim.anahtar}
                type="button"
                aria-pressed={secim.kontrol}
                onClick={secim.degistir}
                className={`inline-flex items-center justify-between gap-3 px-3 py-2 rounded-xl border text-start text-[12px] font-semibold transition-colors ${
                  secim.kontrol
                    ? "bg-ana-kapsayici border-ana/40 text-ana"
                    : "bg-beyaz border-ana-outline/30 text-ikincil/75 hover:bg-ikincil-kapsayici/60"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="msimge text-[17px]" aria-hidden="true">
                    {secim.ikon}
                  </span>
                  {secim.yazi}
                </span>
                <span
                  className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                    secim.kontrol ? "bg-ana" : "bg-ikincil-kapsayici"
                  }`}
                  aria-hidden="true"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-beyaz transition-transform ${
                      secim.kontrol ? "ms-4" : "ms-0.5"
                    }`}
                  />
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Buton
              tur="buton"
              varyant="silinmis"
              boyut="sm"
              ikon="refresh"
              onClick={() => formGuncelle(BOS_FORM)}
            >
              {g("sifirla")}
            </Buton>
          </div>

          <p className="text-[11px] leading-relaxed text-ikincil/65 flex items-start gap-2">
            <span className="msimge text-base mt-0.5" aria-hidden="true">
              info
            </span>
            {t("desteklenmeyenAciklama")}
          </p>
        </fieldset>
      </section>

      {/* Sonuclar */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="text-[13px] text-ikincil/80 font-semibold"
            aria-live="polite"
            aria-atomic="true"
          >
            {durum === "hata" ? (
              <span>{t("sonucHatasi")}</span>
            ) : (
              <>
                <span className="text-ana font-black tabular-nums">
                  {toplam.toLocaleString("tr-TR")}
                </span>{" "}
                {t("sonucMetni2")}{" "}
                <span className="tabular-nums">
                  {toplam > 0
                    ? t("sonucAralik", { baslangic: ilkSatir, bitis: sonSatir })
                    : "-"}
                </span>
              </>
            )}
          </div>

          <div
            className="inline-flex p-1 rounded-2xl bg-ikincil-kapsayici/60"
            role="group"
            aria-label={t("siralamaEtiketi")}
          >
            {(
              [
                { etiket: t("siralamaAkilli"), ikon: "auto_awesome", mod: "akilli" },
                { etiket: t("siralamaYeni"), ikon: "new_releases", mod: "yeni" },
                { etiket: t("siralamaMaas"), ikon: "trending_up", mod: "maas" },
              ] as const
            ).map((secim) => (
              <button
                key={secim.mod}
                type="button"
                aria-pressed={form.siralama === secim.mod}
                aria-label={secim.etiket}
                onClick={() => formGuncelle({ ...form, siralama: secim.mod })}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 transition-colors ${
                  form.siralama === secim.mod
                    ? "bg-beyaz text-ana shadow-mineral-dosye"
                    : "text-ikincil/75 hover:text-ikincil"
                }`}
              >
                <span className="msimge text-[16px]" aria-hidden="true">
                  {secim.ikon}
                </span>
                <span className="hidden sm:inline">{secim.etiket}</span>
              </button>
            ))}
          </div>
        </div>

        {durum === "bekliyor" || durum === "yukleniyor" ? (
          <div
            className="mineral-kart rounded-3xl p-10 text-center space-y-3"
            role="status"
            aria-live="polite"
          >
            <span
              className="msimge text-4xl text-ana animate-spin"
              aria-hidden="true"
            >
              progress_activity
            </span>
            <p className="text-sm font-semibold text-ikincil/80">
              {t("sonucYukleniyor")}
            </p>
          </div>
        ) : null}

        {durum === "hata" ? (
          <div className="mineral-kart rounded-3xl p-10 text-center space-y-3" role="alert">
            <span className="msimge text-5xl text-hata" aria-hidden="true">
              error
            </span>
            <h2 className="font-haber text-lg font-bold text-ikincil">
              {t("sonucHatasi")}
            </h2>
            <p className="text-sm text-ikincil/70 max-w-md mx-auto leading-relaxed">
              {hataMesaji}
            </p>
            <Buton
              tur="buton"
              varyant="ana"
              boyut="sm"
              ikon="refresh"
              onClick={() => setDenemeNo((no) => no + 1)}
            >
              {t("yenidenDene")}
            </Buton>
          </div>
        ) : null}

        {durum === "hazir" && ilanlar.length === 0 ? (
          <div className="mineral-kart rounded-3xl p-10 text-center space-y-3">
            <Ikon3D tur="arama" boyut={56} className="mx-auto ikon-3d--arama" />
            <h2 className="font-haber text-lg font-bold text-ikincil">
              {t("bosSonucBaslik")}
            </h2>
            <p className="text-sm text-ikincil/70 max-w-md mx-auto leading-relaxed">
              {t("bosSonucAciklama")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Buton
                tur="buton"
                varyant="ikincil"
                boyut="sm"
                ikon="refresh"
                onClick={() => formGuncelle(BOS_FORM)}
              >
                {g("sifirla")}
              </Buton>
            </div>
          </div>
        ) : null}

        {durum === "hazir" && ilanlar.length > 0 ? (
          <div className="flex flex-col gap-4">
            {ilanlar.map((ilan) => (
              <VeritabaniIlanKart key={ilan.id} ilan={ilan} />
            ))}
          </div>
        ) : null}

        {toplam > SAYFA_BASI && (
          <nav
            className="flex items-center justify-center gap-1.5 pt-2 flex-wrap"
            aria-label={t("sayfalamaEtiketi")}
          >
            <button
              type="button"
              className="sayfalama-buton w-auto min-w-9 px-3 text-xs font-bold tabular-nums disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => setSayfa((deger) => Math.max(1, etkinSayfa - 1))}
              disabled={etkinSayfa <= 1}
              aria-label={g("onceki")}
            >
              <span className="msimge" aria-hidden="true">
                chevron_left
              </span>
            </button>
            {sayfaNumaralari.map((no) => (
              <button
                key={no}
                type="button"
                className={`sayfalama-buton w-auto min-w-9 px-3 text-xs font-bold tabular-nums ${
                  no === etkinSayfa ? "sayfalama-aktif" : ""
                }`}
                onClick={() => setSayfa(no)}
                aria-current={no === etkinSayfa ? "page" : undefined}
              >
                {no}
              </button>
            ))}
            <button
              type="button"
              className="sayfalama-buton w-auto min-w-9 px-3 text-xs font-bold tabular-nums disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() =>
                setSayfa((deger) => Math.min(sayfaSayisi, etkinSayfa + 1))
              }
              disabled={etkinSayfa >= sayfaSayisi}
              aria-label={g("sonraki")}
            >
              <span className="msimge" aria-hidden="true">
                chevron_right
              </span>
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
