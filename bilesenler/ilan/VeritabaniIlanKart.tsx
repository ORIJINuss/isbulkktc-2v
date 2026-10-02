"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/yonlendirme";
import { tarihFormatla } from "@/lib/yardimcilar/bicimlendiriciler";
import Ikon3D from "@/bilesenler/genel/Ikon3D";
import Rozet from "@/bilesenler/genel/Rozet";
import type {
  IlanAramaSatiri,
  IlanSirketBilgisi,
} from "@/lib/depolar/ilan-arama-deposu";

/* -------------------------------------------------------------------------- */
/* Etiket esleme yardimcilari                                                 */
/* Veritabanindaki degerler Turkce etiket karsiligi olmayabilir; bilinmeyen    */
/* degerler oldugu gibi gosterilir (uydurma metin uretilmez).                 */
/* -------------------------------------------------------------------------- */

const CALISMA_SEKLI_ANAHTARLARI: Record<string, string> = {
  full_time: "calismaSekliTamZamanli",
  fulltime: "calismaSekliTamZamanli",
  part_time: "calismaSekliYariZamanli",
  parttime: "calismaSekliYariZamanli",
  contract: "calismaSekliSozlesmeli",
  temporary: "calismaSekliGecici",
  internship: "calismaSekliStajyer",
  intern: "calismaSekliStajyer",
  seasonal: "calismaSekliSezonluk",
  freelance: "calismaSekliFreelance",
};

const CALISMA_MODELI_ANAHTARLARI: Record<string, string> = {
  onsite: "calismaModeliOfiste",
  on_site: "calismaModeliOfiste",
  office: "calismaModeliOfiste",
  hybrid: "calismaModeliHibrit",
  remote: "calismaModeliUzaktan",
};

const normalizeEtiket = (deger: string | null): string =>
  (deger ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");

function calismaSekliAnahtari(deger: string): string | undefined {
  return CALISMA_SEKLI_ANAHTARLARI[normalizeEtiket(deger)];
}

export function calismaSekliEtiket(
  deger: string | null,
  cevir: (anahtar: string) => string
): string | null {
  if (!deger) return null;
  const anahtar = calismaSekliAnahtari(deger);
  return anahtar ? cevir(anahtar) : deger;
}

export function calismaModeliEtiket(
  deger: string | null,
  cevir: (anahtar: string) => string
): string | null {
  if (!deger) return null;
  const anahtar = CALISMA_MODELI_ANAHTARLARI[normalizeEtiket(deger)];
  return anahtar ? cevir(anahtar) : deger;
}

const sayiyiBicimle = (deger: number): string =>
  new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(deger);

/** Yalnizca veritabanindaki gercek tutarlari kullanir; yoksa null doner. */
export function maasAraligiMetni(ilan: IlanAramaSatiri): string | null {
  const { salary_min: min, salary_max: mak, currency } = ilan;
  if (min === null && mak === null) return null;
  const para = currency?.trim().toUpperCase() ?? "";
  const alt = min ?? mak ?? 0;
  const ust = mak ?? min ?? 0;
  const aralik = alt === ust ? sayiyiBicimle(alt) : `${sayiyiBicimle(alt)} – ${sayiyiBicimle(ust)}`;
  return para ? `${aralik} ${para}` : aralik;
}

export function sirketAdi(
  sirket: IlanSirketBilgisi,
  cevir: (anahtar: string) => string
): string {
  const ad = sirket?.company_name?.trim();
  return ad && ad.length > 0 ? ad : cevir("sirketBilgisiYok");
}

type Props = {
  ilan: IlanAramaSatiri;
};

/* -------------------------------------------------------------------------- */
/* REQ-JOB-LIVE-001 — canli job_posts satirini render eden kart                 */
/* -------------------------------------------------------------------------- */
export default function VeritabaniIlanKart({ ilan }: Props) {
  const t = useTranslations("ilanAra");
  const yerel = useLocale();

  const cevir = (anahtar: string) => t(anahtar);
  const ad = sirketAdi(ilan.companies, cevir);
  const maas = maasAraligiMetni(ilan);
  const sekil = calismaSekliEtiket(ilan.employment_type, cevir);
  const model = calismaModeliEtiket(ilan.remote_policy, cevir);

  return (
    <article className="mineral-kart rounded-3xl p-5 md:p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {ilan.is_featured && (
          <Rozet tur="altin" ikon="star" kucuk>
            {t("oneCikan")}
          </Rozet>
        )}
        {ilan.location && (
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-ikincil/70">
            <Ikon3D tur="bolge" boyut={16} className="ikon-3d--bolge" />
            {ilan.location}
          </span>
        )}
        {ilan.published_at && (
          <span className="inline-flex items-center gap-1 text-[12px] text-ikincil/60">
            <Ikon3D tur="takvim" boyut={16} />
            {t("yayin")}: {tarihFormatla(ilan.published_at, yerel)}
          </span>
        )}
        {ilan.expires_at && (
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-altin-cila">
            <Ikon3D tur="takvim" boyut={16} />
            {t("sonBasvuru")}: {tarihFormatla(ilan.expires_at, yerel)}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="text-[12px] font-bold tracking-wide text-ana">{ad}</p>
        <h3 className="text-xl font-bold leading-snug text-ikincil">
          <Link
            href={{ pathname: "/ilan/[slug]", params: { slug: ilan.slug } }}
            className="hover:text-ana transition-colors"
          >
            {ilan.title}
          </Link>
        </h3>
        {ilan.summary && (
          <p className="text-[13px] leading-relaxed text-ikincil/75 line-clamp-3">
            {ilan.summary}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {sekil && (
          <Rozet tur="ozel-mineral" kucuk ikon="work">
            {sekil}
          </Rozet>
        )}
        {model && (
          <Rozet tur="ikincil" kucuk ikon="public">
            {model}
          </Rozet>
        )}
        {maas ? (
          <span className="text-[13px] font-bold text-ana tabular-nums">{maas}</span>
        ) : (
          <span className="text-[12px] text-ikincil/60">{t("maasBelirtilmedi")}</span>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-ana-outline/25">
        <Link
          href={{ pathname: "/ilan/[slug]", params: { slug: ilan.slug } }}
          className="buton-ana text-sm"
        >
          {t("ilaniIncele")}
          <span className="msimge text-base" aria-hidden="true">
            arrow_forward
          </span>
        </Link>
      </div>
    </article>
  );
}
