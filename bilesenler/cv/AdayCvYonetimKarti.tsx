"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/yonlendirme";
import { sb } from "@/lib/yardimcilar/sinif-yardimcisi";
import Buton from "@/bilesenler/genel/Buton";
import Rozet from "@/bilesenler/genel/Rozet";
import type {
  adayBasvurulariniGetir,
  adayCvBelgeleriniGetir,
  adayProfiliniGetir,
} from "@/lib/depolar/aday-deposu";

type Props = {
  profil: Awaited<ReturnType<typeof adayProfiliniGetir>>;
  basvurular: Awaited<ReturnType<typeof adayBasvurulariniGetir>>;
  belgeler: Awaited<ReturnType<typeof adayCvBelgeleriniGetir>>;
  adSoyad: string;
  sinif?: string;
};

const SEKMELER = [
  { anahtar: "genel", ikon: "dashboard_customize", etiketAnahtar: "sekmeGenel" },
  { anahtar: "basvurular", ikon: "task_alt", etiketAnahtar: "sekmeBasvurular" },
  { anahtar: "alarmlar", ikon: "notifications_active", etiketAnahtar: "sekmeAlarmlar" },
  { anahtar: "kvk", ikon: "shield_person", etiketAnahtar: "sekmeKVK" },
  { anahtar: "belgeler", ikon: "folder_managed", etiketAnahtar: "sekmeBelgeler" },
] as const;

type Sekme = (typeof SEKMELER)[number]["anahtar"];

/**
 * Supabase gömülü seçimleri, ilişki tekil olsa bile dizi döndürebiliyor.
 * Bu yüzden önce dizi mi nesne mi kontrol edip ilk kaydı alıyoruz.
 *
 * NOT: Doğrudan `Array.isArray(x) ? x[0] : x` yazmak yanlıştı. Supabase
 * istemcisi şema generic'i olmadan ilişkileri dizi olarak varsayıyor; bu
 * durumda TypeScript false dalını `never`'a indirgiyor ve `x.company_name`
 * erişimi derleme hatası veriyordu. Jenerik yardımcıda `T` henüz çözülmediği
 * için daraltma güvenli çalışıyor.
 */
function ilkKayit<T>(deger: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(deger)) return deger[0];
  return deger ?? undefined;
}

function ilanVeSirketAdi(basvuru: Props["basvurular"][number]) {
  const ilan = ilkKayit(basvuru.job_posts);
  const sirketAdi = ilkKayit(ilan?.companies)?.company_name;
  return { ilan, sirketAdi: sirketAdi ?? "" };
}

function profilTamamlanma(profil: Props["profil"]): number {
  if (!profil) return 0;
  const alanlar = [
    profil.headline,
    profil.summary,
    profil.city,
    profil.country,
    profil.linkedin_url,
    profil.portfolio_url,
    profil.availability,
  ];
  return Math.round((alanlar.filter((alan) => Boolean(alan?.trim())).length / alanlar.length) * 100);
}

export default function AdayCvYonetimKarti({
  profil,
  basvurular,
  belgeler,
  adSoyad,
  sinif,
}: Props) {
  const t = useTranslations("adayProfilim");
  const w = useTranslations("workspace");
  const locale = useLocale();
  const router = useRouter();
  const dosyaSecici = useRef<HTMLInputElement>(null);
  const [aktifSekme, setAktifSekme] = useState<Sekme>("genel");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const etkinBelge = belgeler.find((belge) => belge.is_active) ?? belgeler[0];
  const tamamlanma = profilTamamlanma(profil);

  async function belgeYukle(dosya: File) {
    setYukleniyor(true);
    setHata(null);
    try {
      const form = new FormData();
      form.set("file", dosya);
      const yanit = await fetch("/api/aday/cv", { method: "POST", body: form });
      const sonuc = (await yanit.json()) as { hata?: string };
      if (!yanit.ok) throw new Error(sonuc.hata ?? t("uploadFailed"));
      router.refresh();
    } catch (error) {
      setHata(error instanceof Error ? error.message : t("uploadFailed"));
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className={sb("space-y-6", sinif)}>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
        <section className="mineral-kart relative overflow-hidden rounded-2xl p-6">
          <div className="absolute -end-12 -top-12 h-44 w-44 rounded-full bg-ana-kapsayici opacity-60 blur-3xl" />
          <div className="relative">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-ana-kapsayici px-2 py-1 text-[10px] font-black uppercase tracking-wider text-ana">
                  <span className="msimge text-sm" aria-hidden="true">person</span>
                  {t("sekmeGenel")}
                </span>
                <h2 className="truncate font-haber text-2xl font-black leading-tight text-ana">
                  {adSoyad}
                </h2>
                <p className="mt-1 text-sm text-ikincil/70">
                  {profil?.headline || t("profileHeadlineMissing")}
                </p>
                <p className="mt-1 text-xs text-ikincil/60">
                  {[profil?.city, profil?.country].filter(Boolean).join(", ") || w("locationMissing")}
                </p>
              </div>
              <span className="msimge text-3xl text-ana" aria-hidden="true">description</span>
            </div>

            <div className="mb-5 rounded-xl border border-ana-outline/30 bg-ana-kapsayici/40 p-4">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold">
                <span className="text-ikincil/75">{t("tamamlanma")}</span>
                <span className="tabular-nums text-ana">%{tamamlanma}</span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-ikincil-kapsayici"
                role="progressbar"
                aria-label={t("tamamlanma")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={tamamlanma}
              >
                <div className="h-full rounded-full bg-ana transition-[width]" style={{ width: `${tamamlanma}%` }} />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ikincil/70">{t("profileCompletionHelp")}</p>
            </div>

            <p className="mb-4 rounded-xl border border-ana-outline/30 p-3 text-xs leading-relaxed text-ikincil/70">
              {t("cvProcessingUnavailable")}
            </p>

            <div className="flex flex-wrap gap-2">
              <input
                ref={dosyaSecici}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  if (file) void belgeYukle(file);
                }}
              />
              <Buton
                tur="buton"
                varyant="ana"
                boyut="sm"
                ikon="upload_file"
                sinif="flex-1"
                disabled={yukleniyor}
                onClick={() => dosyaSecici.current?.click()}
              >
                {yukleniyor ? t("uploading") : t("yeniCVYukle")}
              </Buton>
              {etkinBelge ? (
                <a
                  href={`/api/aday/cv?id=${encodeURIComponent(etkinBelge.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="buton-ikincil"
                >
                  <span className="msimge me-1" aria-hidden="true">visibility</span>
                  {t("onizle")}
                </a>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-ikincil/60">{t("uploadHelp")}</p>
            {hata ? <p className="mt-3 text-sm text-hata-900" role="alert">{hata}</p> : null}
          </div>
        </section>

        <section className="mineral-kart overflow-hidden rounded-2xl">
          <div className="flex gap-1 overflow-x-auto border-b border-ana-outline/30 bg-ikincil-kapsayici/50 p-2">
            {SEKMELER.map((sekme) => (
              <button
                key={sekme.anahtar}
                type="button"
                aria-pressed={aktifSekme === sekme.anahtar}
                onClick={() => setAktifSekme(sekme.anahtar)}
                className={sb(
                  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors",
                  aktifSekme === sekme.anahtar
                    ? "bg-ana text-beyaz shadow-mineral-dosye"
                    : "text-ikincil/75 hover:bg-ikincil-kapsayici hover:text-ana",
                )}
              >
                <span className="msimge text-base" aria-hidden="true">{sekme.ikon}</span>
                {t(sekme.etiketAnahtar)}
              </button>
            ))}
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            {aktifSekme === "genel" && (
              <>
                <div>
                  <h3 className="font-haber text-lg font-bold text-ikincil">{t("profileDetails")}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ikincil/75">
                    {profil?.summary || w("profileSummaryMissing")}
                  </p>
                </div>
                <dl className="grid gap-3 sm:grid-cols-2">
                  {[
                    [t("linkedin"), profil?.linkedin_url],
                    [t("portfolio"), profil?.portfolio_url],
                    [t("availability"), profil?.availability],
                    [t("preferredLocations"), profil?.preferred_locations?.join(", ")],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0 rounded-xl border border-ana-outline/25 bg-ikincil-kapsayici/40 p-3">
                      <dt className="text-xs font-semibold text-ikincil/60">{label}</dt>
                      <dd className="mt-1 break-words text-sm text-ikincil">{value || "—"}</dd>
                    </div>
                  ))}
                </dl>
                <Link href="/aday/masam" className="inline-flex text-sm font-semibold text-ana hover:underline">
                  {t("openCandidateWorkspace")}
                </Link>
              </>
            )}

            {aktifSekme === "basvurular" && (
              basvurular.length ? (
                <ul className="space-y-3">
                  {basvurular.map((basvuru) => {
                    const { ilan, sirketAdi } = ilanVeSirketAdi(basvuru);
                    return (
                      <li key={basvuru.id} className="rounded-xl border border-ana-outline/25 bg-ikincil-kapsayici/40 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            {ilan?.slug ? (
                              <Link
                                href={{ pathname: "/ilan/[slug]", params: { slug: ilan.slug } }}
                                className="font-bold text-ana hover:underline"
                              >
                                {ilan.title}
                              </Link>
                            ) : (
                              <p className="font-bold text-ikincil">{ilan?.title ?? w("jobUnavailable")}</p>
                            )}
                            <p className="mt-1 text-xs text-ikincil/70">
                              {[sirketAdi, ilan?.location].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          <Rozet tur={basvuru.status === "interview" ? "basari" : "ikincil"} kucuk>
                            {w(`applicationStatus.${basvuru.status}`)}
                          </Rozet>
                        </div>
                        {basvuru.created_at ? (
                          <time className="mt-3 block text-xs text-ikincil/60" dateTime={basvuru.created_at}>
                            {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(basvuru.created_at))}
                          </time>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-ana-outline/40 p-6 text-center text-sm text-ikincil/70">
                  {t("noApplications")}
                </p>
              )
            )}

            {aktifSekme === "alarmlar" && (
              <div className="rounded-xl border border-dashed border-ana-outline/40 p-6 text-center">
                <span className="msimge text-3xl text-ana" aria-hidden="true">notifications_off</span>
                <p className="mt-2 text-sm leading-relaxed text-ikincil/70">{t("savedSearchesUnavailable")}</p>
                <Link href="/ilan-ara" className="mt-3 inline-flex text-sm font-semibold text-ana hover:underline">
                  {t("findJobs")}
                </Link>
              </div>
            )}

            {aktifSekme === "kvk" && (
              <div className="rounded-xl border border-ana-outline/30 bg-ana-kapsayici/40 p-4">
                <h3 className="font-semibold text-ikincil">{t("privacySettings")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ikincil/75">{t("privacySettingsUnavailable")}</p>
              </div>
            )}

            {aktifSekme === "belgeler" && (
              belgeler.length ? (
                <ul className="space-y-2">
                  {belgeler.map((belge) => (
                    <li key={belge.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ana-outline/25 bg-ikincil-kapsayici/40 p-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="msimge text-ana" aria-hidden="true">
                          {belge.mime_type === "application/pdf" ? "picture_as_pdf" : "description"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ikincil">{belge.original_filename}</p>
                          <p className="mt-0.5 text-xs text-ikincil/65">
                            {new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(belge.byte_size / 1024)} KB
                            {" · "}{t(`documentStatus.${belge.processing_status}`)}
                            {belge.is_active ? ` · ${t("activeDocument")}` : ""}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`/api/aday/cv?id=${encodeURIComponent(belge.id)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-ana hover:underline"
                      >
                        {t("onizle")}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl border border-dashed border-ana-outline/40 p-6 text-center text-sm text-ikincil/70">
                  {t("noDocuments")}
                </p>
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
