"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/yonlendirme";
import { tarihFormatla } from "@/lib/yardimcilar/bicimlendiriciler";
import Buton from "@/bilesenler/genel/Buton";
import Rozet from "@/bilesenler/genel/Rozet";
import VeritabaniIlanBasvurusu from "@/bilesenler/ilan/VeritabaniIlanBasvurusu";
import VeritabaniIlanKart, {
  calismaModeliEtiket,
  calismaSekliEtiket,
  maasAraligiMetni,
  sirketAdi,
} from "@/bilesenler/ilan/VeritabaniIlanKart";
import type { IlanAramaSatiri } from "@/lib/depolar/ilan-arama-deposu";

type ApiHataKodu = "BULUNAMADI" | "YAPILANDIRMA" | "SUNUCU" | "ISTEK";

type ListeCevabi = {
  basarili?: boolean;
  hata?: string;
  ilanlar?: IlanAramaSatiri[];
};

type DetayCevabi = {
  basarili?: boolean;
  hata?: string;
  ilan?: IlanAramaSatiri;
};

function hatayiCevir(
  cevap: Response,
  govde: DetayCevabi | null
): { kod: ApiHataKodu; mesaj?: string } {
  if (cevap.status === 404) return { kod: "BULUNAMADI" };
  if (cevap.status === 503) return { kod: "YAPILANDIRMA" };
  if (cevap.status >= 400) return { kod: "ISTEK", mesaj: govde?.hata };
  return { kod: "SUNUCU" };
}

type Props = {
  slug: string;
};

/* -------------------------------------------------------------------------- */
/* REQ-JOB-LIVE-001 — canli job_posts detayi                                  */
/* Yalnizca API'nin dondurdugu gercek alanlar render edilir.                   */
/* -------------------------------------------------------------------------- */
export default function VeritabaniIlanDetayi({ slug }: Props) {
  const t = useTranslations("ilanDetay");
  const a = useTranslations("ilanAra");
  const g = useTranslations("genel");
  const yerel = useLocale();

  const [ilan, setIlan] = useState<IlanAramaSatiri | null>(null);
  const [durum, setDurum] = useState<"yukleniyor" | "hata" | "bulunamadi" | "hazir">(
    "yukleniyor"
  );
  const [hataMesaji, setHataMesaji] = useState<string | null>(null);
  const [digerler, setDigerler] = useState<IlanAramaSatiri[]>([]);
  const [denemeNo, setDenemeNo] = useState(0);

  const yukle = useCallback(async () => {
    setDurum("yukleniyor");
    setHataMesaji(null);
    try {
      const cevap = await fetch(`/api/ilanlar/${encodeURIComponent(slug)}`, {
        cache: "no-store",
      });
      const govde = (await cevap.json().catch(() => null)) as DetayCevabi | null;
      if (!cevap.ok || !govde?.basarili || !govde.ilan) {
        const hata = hatayiCevir(cevap, govde);
        if (hata.kod === "BULUNAMADI") {
          setIlan(null);
          setDurum("bulunamadi");
          return;
        }
        setHataMesaji(hata.mesaj ?? null);
        setDurum("hata");
        return;
      }
      setIlan(govde.ilan);
      setDurum("hazir");
    } catch {
      setHataMesaji(null);
      setDurum("hata");
    }
  }, [slug]);

  useEffect(() => {
    void yukle();
  }, [yukle, denemeNo]);

  useEffect(() => {
    if (durum !== "hazir") return;
    let iptal = false;
    (async () => {
      const cevap = await fetch(
        "/api/ilanlar?sayfa=1&sayfaBasi=6&siralama=akilli",
        { cache: "no-store" }
      ).catch(() => null);
      if (!cevap || !cevap.ok || iptal) return;
      const govde = (await cevap.json().catch(() => null)) as ListeCevabi | null;
      if (!govde?.basarili || !Array.isArray(govde.ilanlar) || iptal) return;
      setDigerler(govde.ilanlar.filter((kayit) => kayit.slug !== slug).slice(0, 3));
    })();
    return () => {
      iptal = true;
    };
  }, [durum, slug]);

  if (durum === "yukleniyor") {
    return (
      <div
        className="mineral-kart rounded-3xl p-10 text-center space-y-3"
        role="status"
        aria-live="polite"
      >
        <span className="msimge text-4xl text-ana animate-spin" aria-hidden="true">
          progress_activity
        </span>
        <p className="text-sm font-semibold text-ikincil/80">{t("veriYukleniyor")}</p>
      </div>
    );
  }

  if (durum === "bulunamadi" || !ilan) {
    return (
      <div className="mineral-kart rounded-3xl p-10 text-center space-y-3">
        <span className="msimge text-5xl text-ikincil/30" aria-hidden="true">
          search_off
        </span>
        <h1 className="font-haber text-xl font-bold text-ikincil">
          {t("veriBulunamadi")}
        </h1>
        <p className="text-sm text-ikincil/70 max-w-md mx-auto leading-relaxed">
          {t("veriBulunamadiAciklama")}
        </p>
        <div className="flex justify-center pt-1">
          <Link href="/ilan-ara" className="buton-ana text-sm">
            <span className="msimge text-base" aria-hidden="true">
              search
            </span>
            {g("tumunuGetir")}
          </Link>
        </div>
      </div>
    );
  }

  if (durum === "hata") {
    return (
      <div
        className="mineral-kart rounded-3xl p-10 text-center space-y-3"
        role="alert"
      >
        <span className="msimge text-5xl text-hata" aria-hidden="true">
          error
        </span>
        <h1 className="font-haber text-xl font-bold text-ikincil">
          {t("veriHatasi")}
        </h1>
        <p className="text-sm text-ikincil/70 max-w-md mx-auto leading-relaxed">
          {hataMesaji ?? t("veriHatasiAciklama")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Buton
            tur="buton"
            varyant="ana"
            boyut="sm"
            ikon="refresh"
            onClick={() => setDenemeNo((no) => no + 1)}
          >
            {a("yenidenDene")}
          </Buton>
          <Link href="/ilan-ara" className="buton-ikincil text-sm">
            {g("tumunuGetir")}
          </Link>
        </div>
      </div>
    );
  }

  const cevir = (anahtar: string) => a(anahtar);
  const ad = sirketAdi(ilan.companies, cevir);
  const maas = maasAraligiMetni(ilan);
  const sekil = calismaSekliEtiket(ilan.employment_type, cevir);
  const model = calismaModeliEtiket(ilan.remote_policy, cevir);

  const ozetSatirlari: { etiket: string; deger: string | null }[] = [
    { etiket: a("sirket"), deger: ad },
    { etiket: a("konum"), deger: ilan.location },
    { etiket: a("calismaSekliEtiketi"), deger: sekil },
    { etiket: a("calismaModeliEtiketi"), deger: model },
    { etiket: a("maas"), deger: maas },
    {
      etiket: a("yayin"),
      deger: ilan.published_at ? tarihFormatla(ilan.published_at, yerel) : null,
    },
    {
      etiket: a("sonBasvuru"),
      deger: ilan.expires_at ? tarihFormatla(ilan.expires_at, yerel) : null,
    },
  ].filter((satir) => satir.deger !== null && satir.deger.length > 0);

  return (
    <div className="py-8 sm:py-10 space-y-7">
      <Link
        href="/ilan-ara"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ana hover:underline"
      >
        <span className="msimge" aria-hidden="true">
          arrow_back
        </span>
        {g("tumunuGetir")}
      </Link>

      <div className="grid lg:grid-cols-[1.35fr_1fr] gap-6 items-start">
        <div className="space-y-6">
          <section className="mineral-kart rounded-[24px] p-6 sm:p-7 space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <Rozet tur="ozel-mineral" ikon="domain">
                {ad}
              </Rozet>
              {ilan.is_featured && (
                <Rozet tur="altin" ikon="star">
                  {a("oneCikan")}
                </Rozet>
              )}
              {sekil && (
                <Rozet tur="ana" ikon="work" kucuk>
                  {sekil}
                </Rozet>
              )}
              {model && (
                <Rozet tur="ikincil" ikon="public" kucuk>
                  {model}
                </Rozet>
              )}
            </div>

            <h1 className="font-haber font-black tracking-tight leading-[1.05] text-3xl sm:text-4xl text-ikincil">
              {ilan.title}
            </h1>

            <div className="flex flex-wrap gap-3 text-xs text-ikincil/75 font-semibold">
              {ilan.location && (
                <span className="inline-flex items-center gap-1">
                  <span className="msimge text-[17px] text-ana" aria-hidden="true">
                    place
                  </span>
                  {ilan.location}
                </span>
              )}
              {ilan.published_at && (
                <span className="inline-flex items-center gap-1">
                  <span className="msimge text-[17px] text-ana" aria-hidden="true">
                    calendar_month
                  </span>
                  {a("yayin")}: {tarihFormatla(ilan.published_at, yerel)}
                </span>
              )}
              {ilan.expires_at && (
                <span className="inline-flex items-center gap-1">
                  <span className="msimge text-[17px] text-ana" aria-hidden="true">
                    event_busy
                  </span>
                  {a("sonBasvuru")}: {tarihFormatla(ilan.expires_at, yerel)}
                </span>
              )}
            </div>
          </section>

          {ilan.summary && (
            <section className="mineral-kart rounded-2xl p-6 space-y-2">
              <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-ikincil/50">
                {a("ozet")}
              </h2>
              <p className="text-[15px] leading-relaxed text-ikincil/85">
                {ilan.summary}
              </p>
            </section>
          )}

          <section className="mineral-kart rounded-2xl p-6 space-y-3">
            <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-ikincil/50">
              {a("aciklama")}
            </h2>
            {ilan.description ? (
              <p className="text-[15px] leading-relaxed text-ikincil/85 whitespace-pre-line">
                {ilan.description}
              </p>
            ) : (
              <p className="text-sm text-ikincil/60">{a("aciklamaYok")}</p>
            )}
          </section>

          <section className="mineral-kart rounded-2xl p-6 space-y-3">
            <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-ikincil/50">
              {t("ilanBilgileri")}
            </h2>
            {ozetSatirlari.length === 0 ? (
              <p className="text-sm text-ikincil/60">{a("aciklamaYok")}</p>
            ) : (
              <dl className="grid sm:grid-cols-2 gap-2.5">
                {ozetSatirlari.map((satir) => (
                  <div
                    key={satir.etiket}
                    className="p-3 rounded-xl bg-ikincil-kapsayici/50 border border-ana-outline/25"
                  >
                    <dt className="text-[10px] font-black uppercase tracking-wider text-ikincil/55">
                      {satir.etiket}
                    </dt>
                    <dd className="text-[13px] font-bold text-ana leading-snug mt-1 break-words">
                      {satir.deger}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          {digerler.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-haber font-black text-2xl text-ikincil leading-tight">
                {a("digerIlanlar")}
              </h2>
              <div className="grid gap-4">
                {digerler.map((kayit) => (
                  <VeritabaniIlanKart key={kayit.id} ilan={kayit} />
                ))}
              </div>
            </section>
          )}
        </div>

        <VeritabaniIlanBasvurusu ilanSlug={ilan.slug} />
      </div>
    </div>
  );
}
