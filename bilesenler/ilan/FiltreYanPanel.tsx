"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { sb } from "@/lib/yardimcilar/sinif-yardimcisi";
import Buton from "@/bilesenler/genel/Buton";
import {
  ILCELER,
  SEKTORLER,
  CALISMA_SEKILLERI,
  IZIN_TIPLERI,
  PARA_BIRIMLERI,
} from "@/lib/sabitler/alan-degiskenleri";
import type {
  IlanFiltreleri,
  IlceKodu,
  CalismaSekliKodu,
  IzinTipiKodu,
  ParaBirimiKodu,
} from "@/lib/veri/ilan-tipi";

type FiltreYanPanelProps = {
  filtreler?: IlanFiltreleri;
  degisince?: (yeni: IlanFiltreleri) => void;
  sadeceFreelance?: boolean;
  className?: string;
};

const yayinTarihindenGune = (deger: string): number | undefined => {
  switch (deger) {
    case "24s":
      return 1;
    case "3g":
      return 3;
    case "7g":
      return 7;
    default:
      return undefined;
  }
};

export default function FiltreYanPanel({
  filtreler = {},
  degisince,
  sadeceFreelance = false,
  className,
}: FiltreYanPanelProps) {
  const t = useTranslations("ilanAra");
  const f = useTranslations("freelance");
  const g = useTranslations("genel");

  const [secilenIlceler, setSecilenIlceler] = useState<IlceKodu[]>(
    (filtreler.ilceKodlari as IlceKodu[]) ?? []
  );
  const [secilenSektorler, setSecilenSektorler] = useState<string[]>(
    filtreler.sektorKodlari ?? []
  );
  const [secilenCalismaSekilleri, setSecilenCalismaSekilleri] = useState<
    (string | CalismaSekliKodu)[]
  >((filtreler.calismaSekliKodlari as CalismaSekliKodu[]) ?? []);
  const [secilenIzinTipleri, setSecilenIzinTipleri] = useState<IzinTipiKodu[]>(
    (filtreler.izinTipiKodlari as IzinTipiKodu[]) ?? []
  );
  const [minMaas, setMinMaas] = useState<number>(filtreler.minMaas ?? 0);
  const [paraBirimi, setParaBirimi] = useState<ParaBirimiKodu>(
    filtreler.paraBirimi ?? "GBP"
  );
  const [paraBirimiSecildi, setParaBirimiSecildi] = useState<boolean>(
    filtreler.paraBirimi !== undefined
  );
  const [yayinTarihi, setYayinTarihi] = useState<string>(() => {
    const gun = filtreler.yayinTarihiAraligiGun;
    if (gun === 1) return "24s";
    if (gun === 3) return "3g";
    if (gun === 7) return "7g";
    return "tum";
  });
  const [acil, setAcil] = useState<boolean>(filtreler.acilMi ?? false);

  const filtreDegerAnahtari = useMemo(
    () =>
      JSON.stringify({
        ilceKodlari: filtreler.ilceKodlari ?? [],
        sektorKodlari: filtreler.sektorKodlari ?? [],
        calismaSekliKodlari: filtreler.calismaSekliKodlari ?? [],
        izinTipiKodlari: filtreler.izinTipiKodlari ?? [],
        minMaas: filtreler.minMaas ?? 0,
        paraBirimi: filtreler.paraBirimi ?? "GBP",
        yayinTarihiAraligiGun: filtreler.yayinTarihiAraligiGun,
        acilMi: filtreler.acilMi ?? false,
      }),
    [
      filtreler.ilceKodlari,
      filtreler.sektorKodlari,
      filtreler.calismaSekliKodlari,
      filtreler.izinTipiKodlari,
      filtreler.minMaas,
      filtreler.paraBirimi,
      filtreler.yayinTarihiAraligiGun,
      filtreler.acilMi,
    ]
  );

  const filtreDurumu = useMemo(
    () =>
      JSON.parse(filtreDegerAnahtari) as {
        ilceKodlari: IlceKodu[];
        sektorKodlari: string[];
        calismaSekliKodlari: (string | CalismaSekliKodu)[];
        izinTipiKodlari: IzinTipiKodu[];
        minMaas: number;
        paraBirimi: ParaBirimiKodu;
        yayinTarihiAraligiGun?: number;
        acilMi: boolean;
      },
    [filtreDegerAnahtari]
  );

  useEffect(() => {
    setSecilenIlceler(filtreDurumu.ilceKodlari ?? []);
    setSecilenSektorler(filtreDurumu.sektorKodlari ?? []);
    setSecilenCalismaSekilleri(filtreDurumu.calismaSekliKodlari ?? []);
    setSecilenIzinTipleri(filtreDurumu.izinTipiKodlari ?? []);
    setMinMaas(filtreDurumu.minMaas ?? 0);
    setParaBirimi(filtreDurumu.paraBirimi ?? "GBP");
    setParaBirimiSecildi(filtreDurumu.paraBirimi !== undefined);
    const gun = filtreDurumu.yayinTarihiAraligiGun;
    setYayinTarihi(gun === 1 ? "24s" : gun === 3 ? "3g" : gun === 7 ? "7g" : "tum");
    setAcil(filtreDurumu.acilMi ?? false);
  }, [filtreDurumu]);

  const toggleDizi = <T extends string>(
    dizi: T[],
    eleman: T,
    ayarla: (d: T[]) => void
  ) => {
    ayarla(dizi.includes(eleman) ? dizi.filter((e) => e !== eleman) : [...dizi, eleman]);
  };

  const sifirla = () => {
    setSecilenIlceler([]);
    setSecilenSektorler([]);
    setSecilenCalismaSekilleri([]);
    setSecilenIzinTipleri([]);
    setMinMaas(0);
    setParaBirimi("GBP");
    setParaBirimiSecildi(false);
    setYayinTarihi("tum");
    setAcil(false);
    degisince?.({
      ...filtreler,
      ilceKodlari: [],
      sektorKodlari: [],
      calismaSekliKodlari: [],
      izinTipiKodlari: [],
      minMaas: undefined,
      makMaas: undefined,
      paraBirimi: undefined,
      yayinTarihiAraligiGun: undefined,
      acilMi: undefined,
      maasBelirtilmisMi: undefined,
      lojmanVarMi: undefined,
      sadeceFreelance: sadeceFreelance || undefined,
    });
  };

  const uygula = () => {
    if (!degisince) return;
    const yeni: IlanFiltreleri = {
      ...filtreler,
      ilceKodlari: secilenIlceler,
      sektorKodlari: secilenSektorler,
      calismaSekliKodlari: secilenCalismaSekilleri.filter((e) =>
        CALISMA_SEKILLERI.some((c) => c.deger === (e as string))
      ) as CalismaSekliKodu[],
      izinTipiKodlari: secilenIzinTipleri,
      minMaas: minMaas > 0 ? minMaas : undefined,
      paraBirimi: paraBirimiSecildi ? paraBirimi : undefined,
      yayinTarihiAraligiGun: yayinTarihindenGune(yayinTarihi),
      acilMi: acil || undefined,
      sadeceFreelance: sadeceFreelance || undefined,
      maasBelirtilmisMi: filtreler.maasBelirtilmisMi,
      lojmanVarMi: filtreler.lojmanVarMi,
    };
    degisince(yeni);
  };

  const sektorler = useMemo(
    () =>
      SEKTORLER.map((s) => ({
        deger: s.deger,
        etiket: s.etiket,
      })),
    []
  );

  return (
    <aside
      className={sb(
        "sticky top-28 self-start w-full lg:w-[320px] shrink-0",
        className
      )}
    >
      <div className="mineral-kart p-6 me-2 lg:ms-2 space-y-6">
        {!sadeceFreelance && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-haber text-ana font-bold tracking-tight text-sm">
                {t("ilceler")}
              </h4>
              <span className="text-xs text-ikincil/60">
                {secilenIlceler.length} seçili
              </span>
            </div>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {ILCELER.map((i) => (
                <label
                  key={i.deger}
                  className={sb(
                    "flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors",
                    secilenIlceler.includes(i.deger)
                      ? "bg-ana-kapsayici"
                      : "hover:bg-ikincil-kapsayici/60"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={secilenIlceler.includes(i.deger)}
                    onChange={() =>
                      toggleDizi(secilenIlceler, i.deger, setSecilenIlceler)
                    }
                    className="w-4 h-4 rounded border-ana-outline text-ana focus:ring-ana"
                  />
                  <span className="text-sm text-ikincil">{i.etiket}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-haber text-ana font-bold tracking-tight text-sm">
              {t("sektorler")}
            </h4>
            <span className="text-xs text-ikincil/60">
              {secilenSektorler.length} seçili
            </span>
          </div>
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {sektorler.map((s) => (
              <label
                key={s.deger}
                className={sb(
                  "flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors",
                  secilenSektorler.includes(s.deger)
                    ? "bg-ana-kapsayici"
                    : "hover:bg-ikincil-kapsayici/60"
                )}
              >
                <input
                  type="checkbox"
                  checked={secilenSektorler.includes(s.deger)}
                  onChange={() =>
                    toggleDizi(secilenSektorler, s.deger, setSecilenSektorler)
                  }
                  className="w-4 h-4 rounded border-ana-outline text-ana focus:ring-ana"
                />
                <span className="text-sm text-ikincil">{s.etiket}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-ana-outline/30">
          <h4 className="font-haber text-ana font-bold tracking-tight text-sm mb-3">
            {sadeceFreelance ? f("deneyimSeviyesi") : t("calismaSekli")}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {(sadeceFreelance
              ? [
                  { deger: "baslangic", etiket: "Başlangıç" },
                  { deger: "orta", etiket: "Orta Seviye" },
                  { deger: "kidemli", etiket: "Kıdemli" },
                  { deger: "uzman", etiket: "Uzman" },
                  { deger: "yonetici", etiket: "Yönetici" },
                ]
              : CALISMA_SEKILLERI
            ).map((c) => (
              <button
                key={c.deger}
                type="button"
                onClick={() =>
                  toggleDizi(
                    secilenCalismaSekilleri,
                    c.deger,
                    setSecilenCalismaSekilleri
                  )
                }
                className={sb(
                  "px-3 py-2 rounded-xl text-xs font-medium transition-all",
                  secilenCalismaSekilleri.includes(c.deger)
                    ? "bg-ana text-beyaz shadow-mineral-dosye"
                    : "bg-ikincil-kapsayici/60 text-ikincil hover:bg-ikincil-kapsayici"
                )}
              >
                {c.etiket}
              </button>
            ))}
          </div>
        </div>

        {!sadeceFreelance && (
          <div className="pt-2 border-t border-ana-outline/30">
            <h4 className="font-haber text-ana font-bold tracking-tight text-sm mb-3">
              Çalışma İzni
            </h4>
            <div className="space-y-1.5">
              {IZIN_TIPLERI.map((i) => (
                <label
                  key={i.deger}
                  className={sb(
                    "flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors",
                    secilenIzinTipleri.includes(i.deger)
                      ? "bg-ana-kapsayici"
                      : "hover:bg-ikincil-kapsayici/60"
                  )}
                >
                  <input
                    type="radio"
                    name="izin"
                    checked={secilenIzinTipleri.includes(i.deger)}
                    onChange={() => setSecilenIzinTipleri([i.deger])}
                    className="mt-0.5 w-4 h-4 text-ana focus:ring-ana"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm text-ana font-medium">
                      {i.etiket}
                    </span>
                    <span className="text-[11px] text-ikincil/70 leading-snug">
                      {i.aciklama}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-ana-outline/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-haber text-ana font-bold tracking-tight text-sm">
              {sadeceFreelance ? f("butceTipi") : t("maaşAraligi")}
            </h4>
            <select
              value={paraBirimi}
              onChange={(e) => {
                setParaBirimi(e.target.value as ParaBirimiKodu);
                setParaBirimiSecildi(true);
              }}
              className="text-xs px-2 py-1 rounded-lg bg-ikincil-kapsayici border border-ana-outline/40 text-ikincil focus:outline-none"
            >
              {PARA_BIRIMLERI.map((p) => (
                <option key={p.deger} value={p.deger}>
                  {p.sembol} {p.deger}
                </option>
              ))}
            </select>
          </div>
          <div className="px-1">
            <input
              type="range"
              min={0}
              max={sadeceFreelance ? 50000 : 60000}
              step={500}
              value={minMaas}
              onChange={(e) => setMinMaas(Number(e.target.value))}
              className="w-full h-1.5 rounded-full bg-ikincil-kapsayici accent-ana"
            />
            <div className="flex justify-between text-[11px] text-ikincil/60 mt-1.5 tabular-nums">
              <span>0</span>
              <span className="text-ana font-semibold">
                ≥ {minMaas.toLocaleString("tr-TR")} {paraBirimi}
              </span>
              <span>
                {(sadeceFreelance ? 50000 : 60000).toLocaleString("tr-TR")}
              </span>
            </div>
          </div>
        </div>

        {!sadeceFreelance && (
          <div className="pt-2 border-t border-ana-outline/30">
            <h4 className="font-haber text-ana font-bold tracking-tight text-sm mb-3">
              {t("yayinTarihi")}
            </h4>
            <div className="space-y-1.5">
              {[
                { deger: "24s", etiket: t("son24Saat") },
                { deger: "3g", etiket: t("son3Gun") },
                { deger: "7g", etiket: t("son7Gun") },
                { deger: "tum", etiket: t("tumAktif") },
              ].map((y) => (
                <label
                  key={y.deger}
                  className={sb(
                    "flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors",
                    yayinTarihi === y.deger
                      ? "bg-ana-kapsayici"
                      : "hover:bg-ikincil-kapsayici/60"
                  )}
                >
                  <input
                    type="radio"
                    name="yayin"
                    checked={yayinTarihi === y.deger}
                    onChange={() => setYayinTarihi(y.deger)}
                    className="w-4 h-4 text-ana focus:ring-ana"
                  />
                  <span className="text-sm text-ikincil">{y.etiket}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-ana-outline/30 space-y-2.5">
          {[
            !sadeceFreelance && {
              anahtar: "acil",
              acik: acil,
              degistir: () => setAcil(!acil),
              etiket: "Acil İlanlar",
              ikon: "bolt",
            },
          ]
            .filter(Boolean)
            .map((tgl: any) => (
              <label
                key={tgl.anahtar}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-ikincil-kapsayici/40 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="msimge text-ana/80 text-lg">{tgl.ikon}</span>
                  <span className="text-sm text-ikincil">{tgl.etiket}</span>
                </div>
                <button
                  type="button"
                  onClick={tgl.degistir}
                  className={sb(
                    "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                    tgl.acik ? "bg-ana" : "bg-ikincil-kapsayici"
                  )}
                >
                  <span
                    className={sb(
                      "inline-block h-4 w-4 transform rounded-full bg-beyaz transition-transform",
                      tgl.acik ? "ms-4" : "ms-0.5"
                    )}
                  />
                </button>
              </label>
            ))}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Buton
            tur="buton"
            varyant="silinmis"
            boyut="sm"
            ikon="refresh"
            onClick={sifirla}
            className="flex-1"
          >
            {g("sifirla")}
          </Buton>
          <Buton
            tur="buton"
            varyant="ana"
            boyut="sm"
            ikon="tune"
            ikonSonunda
            onClick={uygula}
            className="flex-1"
          >
            {g("uygula")}
          </Buton>
        </div>
      </div>
    </aside>
  );
}
