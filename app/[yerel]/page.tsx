"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter, Link } from "@/i18n/yonlendirme";
import { CALISMA_SEKILLERI, ILCELER } from "@/lib/sabitler/alan-degiskenleri";

/* ─── Asset paths ─── */
const A = "/assets";
const imgSearch = `${A}/3bde3.svg`;

/* ─── Static data ─── */
const CATEGORIES = [
  { key: "FINANS", icon: "account_balance" },
  { key: "TURIZM", icon: "hotel" },
  { key: "BILISIM", icon: "terminal" },
  { key: "INSAT", icon: "apartment" },
  { key: "EGITIM", icon: "school" },
  { key: "PERAKENDE", icon: "storefront" },
] as const;

type HomeJob = {
  id: string;
  title: string;
  company: string;
  city: string;
  type: string;
  salary: string;
  tags: string[];
  posted: string;
  initials: string;
  clr: string;
  featured: boolean;
};

type HomeCompany = {
  name: string;
  sector: string;
  open: number;
  initials: string;
  clr: string;
};

const JOBS: HomeJob[] = [];
const COMPANIES: HomeCompany[] = [];

const POPULAR = [
  "popularSoftware",
  "popularTeacher",
  "popularNurse",
  "popularAccounting",
  "popularReception",
  "popularEngineer",
  "popularMarketing",
] as const;

/* ─── Helpers ─── */
function Ic({
  src,
  size = 18,
  alt = "",
}: {
  src: string;
  size?: number;
  alt?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size, minWidth: size }}
      className="shrink-0"
    />
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-sans-govde font-semibold bg-[rgba(24,58,51,0.07)] text-[#183a33]">
      {text}
    </span>
  );
}

/* ───────────────────────────────────────────────
/* APP */
/* ─────────────────────────────────────────────── */
export default function AnaSayfa() {
  const t = useTranslations("anaSayfa");
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("KKTC");
  const [workType, setWorkType] = useState("");
  const [activeTab, setActiveTab] = useState<"seeker" | "employer">("seeker");
  const kategoriMetinleri = {
    FINANS: [t("sectorFinance"), t("sectorFinanceDescription")],
    TURIZM: [t("sectorTourism"), t("sectorTourismDescription")],
    BILISIM: [t("sectorTechnology"), t("sectorTechnologyDescription")],
    INSAT: [t("sectorConstruction"), t("sectorConstructionDescription")],
    EGITIM: [t("sectorEducation"), t("sectorEducationDescription")],
    PERAKENDE: [t("sectorRetail"), t("sectorRetailDescription")],
  } as const;
  const ilceAdlari: Record<(typeof ILCELER)[number]["deger"], string> = {
    KKTC: t("districtAll"),
    LEF: t("districtNicosia"),
    GIR: t("districtKyrenia"),
    GAM: t("districtFamagusta"),
    ISK: t("districtIskele"),
    GUZ: t("districtMorphou"),
    LEFKE: t("districtLefke"),
  };
  const calismaSekliAdlari: Record<
    (typeof CALISMA_SEKILLERI)[number]["deger"],
    string
  > = {
    TAM_ZAMANLI: t("workFullTime"),
    YARI_ZAMANLI: t("workPartTime"),
    FREELANCE: t("workFreelance"),
    SEZONLUK: t("workSeasonal"),
    STAJYER: t("workInternship"),
  };
  const arayanAdimlari = [
    { n: "01", title: t("seekerStepProfileTitle"), desc: t("seekerStepProfileDescription") },
    { n: "02", title: t("seekerStepExploreTitle"), desc: t("seekerStepExploreDescription") },
    { n: "03", title: t("seekerStepApplyTitle"), desc: t("seekerStepApplyDescription") },
  ];
  const isverenAdimlari = [
    { n: "01", title: t("employerStepAccountTitle"), desc: t("employerStepAccountDescription") },
    { n: "02", title: t("employerStepPublishTitle"), desc: t("employerStepPublishDescription") },
    { n: "03", title: t("employerStepCandidateTitle"), desc: t("employerStepCandidateDescription") },
  ];

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#faf9f3] font-sans-govde antialiased text-[#1b1c19]">
      {/* ─── NAVBAR ─── */}
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden border-b border-[#dcdcd1] bg-[#f6f5ef]">
        <div className="pointer-events-none absolute -end-24 -top-32 h-80 w-80 rounded-full bg-[#d3e7e8]/60 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -start-24 bottom-0 h-56 w-56 rounded-full bg-[#e8f4ee]/70 blur-3xl" aria-hidden="true" />
        <div className="orbit-sahnesi" aria-hidden="true">
          <span className="orbit-hale orbit-hale-bir" />
          <span className="orbit-hale orbit-hale-iki" />
          <span className="orbit-hale orbit-hale-uc" />
          <span className="orbit-parcacik orbit-parcacik-bir" />
          <span className="orbit-parcacik orbit-parcacik-iki" />
          <span className="orbit-parcacik orbit-parcacik-uc" />
          <span className="orbit-cekirdek" />
        </div>
        <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-14 md:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.58fr)] md:items-center md:px-8 md:py-24 lg:gap-12">
          <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-md bg-[#e8f4ee] border border-[#b3dbc5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1e4b39]" />
            <span className="font-sans-govde font-semibold text-[#1e4b39] text-xs tracking-wider uppercase">
              {t("heroBadge")}
            </span>
          </div>

          {/* Headline */}
          <h1 className="mb-4 max-w-3xl font-display text-[clamp(2.25rem,6vw,3.75rem)] font-bold leading-[1.06] tracking-[-0.045em] text-[#183a33]">
            {t("heroTitle")}
          </h1>

          {/* Subtitle */}
          <p className="text-[#414846] text-base sm:text-lg leading-7 mb-8 max-w-2xl font-sans-govde">
            {t("heroDescription")}
          </p>

          {/* Search box */}
          <form
            className="w-full max-w-6xl mb-4 rounded-2xl border border-[#dcdcd1] bg-white/95 p-3 md:p-4 shadow-[0_18px_45px_-18px_rgba(26,50,44,0.24)] ring-1 ring-white/70 backdrop-blur-sm"
            onSubmit={(event) => {
              event.preventDefault();
              const params = new URLSearchParams();
              const query = searchQuery.trim();
              if (query) params.set("arananKelime", query);
              if (location !== "KKTC") params.append("ilceKodlari", location);
              if (workType) params.append("calismaSekliKodlari", workType);
              const queryString = params.toString();
              router.push(
                (queryString ? `/ilan-ara?${queryString}` : "/ilan-ara") as
                  Parameters<typeof router.push>[0],
              );
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_auto] items-center gap-1">
              {/* Keyword */}
              <div className="flex items-center gap-3 px-3 py-2.5 min-h-14 border-b md:border-b-0 md:border-r border-[#e6e6dd]">
                <Ic src={imgSearch} size={20} />
                <div className="w-full">
                  <label htmlFor="search-role" className="block text-[11px] font-semibold text-[#717976] uppercase tracking-wider">
                    {t("searchRoleLabel")}
                  </label>
                  <input
                    id="search-role"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="w-full bg-transparent p-0 text-[15px] font-sans-govde text-[#1b1c19] placeholder-[#9f9f8e] border-0 focus:ring-0"
                  />
                </div>
              </div>
              {/* Location */}
              <div className="flex items-center gap-3 px-3 py-2.5 min-h-14 border-b md:border-b-0 md:border-r border-[#e6e6dd]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#717976"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 shrink-0"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div className="w-full">
                  <label htmlFor="search-location" className="block text-[11px] font-semibold text-[#717976] uppercase tracking-wider">
                    {t("locationLabel")}
                  </label>
                  <select
                    id="search-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-transparent p-0 text-[14px] font-sans-govde font-medium text-[#1b1c19] border-0 focus:ring-0 cursor-pointer"
                  >
                    {ILCELER.map((ilce) => (
                      <option key={ilce.deger} value={ilce.deger}>
                        {ilceAdlari[ilce.deger]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Employment type */}
              <div className="flex items-center gap-3 px-3 py-2.5 min-h-14">
                <span className="msimge text-[#42655c] text-xl" aria-hidden="true">
                  work
                </span>
                <div className="w-full">
                  <label htmlFor="search-work-type" className="block text-[11px] font-semibold text-[#717976] uppercase tracking-wider">
                    {t("workTypeLabel")}
                  </label>
                  <select
                    id="search-work-type"
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="w-full bg-transparent p-0 text-[14px] font-sans-govde font-medium text-[#1b1c19] border-0 focus:ring-0 cursor-pointer"
                  >
                    <option value="">{t("allWorkTypes")}</option>
                    {CALISMA_SEKILLERI.map((sekil) => (
                      <option key={sekil.deger} value={sekil.deger}>
                        {calismaSekliAdlari[sekil.deger]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Button */}
              <button
                type="submit"
                className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#305149] px-6 text-white font-sans-govde font-semibold text-[15px] hover:bg-[#42655d] transition-colors whitespace-nowrap"
              >
                <span className="msimge" aria-hidden="true">search</span>
                <span>{t("searchButton")}</span>
              </button>
            </div>
          </form>

          {/* Popular searches */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-[#717976] font-sans-govde font-medium">
              {t("popularSearches")}
            </span>
            {POPULAR.map((anahtar) => {
              const kw = t(anahtar);
              return (
              <button
                key={kw}
                onClick={() => setSearchQuery(kw)}
                className="text-[13px] font-sans-govde font-semibold text-[#42655c] bg-[#eeeee7] rounded-md px-3 py-1.5 hover:bg-[#e6e6dd] transition-colors"
              >
                {kw}
              </button>
              );
            })}
          </div>
          </div>

        </div>
      </section>


      {/* ─── KATEGORİLER ─── */}
      <section
        id="ilanlar"
        data-below-fold
        className="py-14 md:py-16 bg-[#faf9f3]"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <span className="inline-block mb-2 text-[11px] font-sans-govde font-semibold text-[#42655c] tracking-widest uppercase">
                {t("sectorsEyebrow")}
              </span>
              <h2 className="font-baslik font-semibold text-[#183a33] text-2xl sm:text-3xl tracking-[-0.025em]">
                {t("sectorsHeading")}
              </h2>
            </div>
            <Link
              href="/ilan-ara"
              className="text-[14px] font-sans-govde font-semibold text-[#305149] hover:text-[#42655c] transition-colors inline-flex items-center gap-1.5"
            >
              {t("allSectors")}
              <span className="msimge text-[18px]" aria-hidden="true">
                arrow_forward
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map(({ key, icon }) => {
              const [label, description] = kategoriMetinleri[key];
              return (
              <Link
                key={key}
                href={`/ilan-ara?sektorKodlari=${encodeURIComponent(key)}` as Parameters<typeof Link>[0]["href"]}
                className="group flex flex-col justify-between gap-4 rounded-xl border border-[#dcdcd1] bg-white p-5 md:p-6 transition-all duration-200 hover:border-[#8eb5b0] hover:shadow-[0_4px_16px_-2px_rgba(26,50,44,0.06)]"
              >
                <div className="flex items-start justify-between">
                  <span className="msimge flex h-12 w-12 items-center justify-center rounded-lg border border-[#dcdcd1] bg-[#eeeee7] text-[#305149] text-[25px] transition-colors group-hover:bg-[#edf5fa]" aria-hidden="true">
                    {icon}
                  </span>
                  <span className="text-[11px] font-sans-govde font-semibold text-[#717976] bg-[#f5f4ee] px-2.5 py-1 rounded">
                    {t("discoverSector")}
                  </span>
                </div>
                <div>
                  <h3 className="font-baslik font-semibold text-[#183a33] text-[18px] leading-snug mb-1 group-hover:text-[#42655c] transition-colors">
                    {label}
                  </h3>
                  <p className="text-[13px] leading-5 text-[#414846] font-sans-govde">
                    {description}
                  </p>
                </div>
              </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── ÖNE ÇIKAN İLANLAR ─── */}
      <section
        data-below-fold
        className="py-14 md:py-16 bg-[#f6f5ef]"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="inline-block mb-2 text-[11px] font-sans-govde font-semibold text-[#42655c] tracking-widest uppercase">
                {t("jobsEyebrow")}
              </span>
              <h2 className="font-baslik font-semibold text-[#183a33] text-2xl sm:text-3xl tracking-[-0.025em]">
                {t("jobsHeading")}
              </h2>
            </div>
            <Link
              href="/ilan-ara"
              className="text-[14px] font-sans-govde font-semibold text-[#305149] hover:text-[#42655c] transition-colors flex items-center gap-1 shrink-0"
            >
              {t("allJobs")}
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
          <div className="space-y-4">
            {JOBS.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#c1c8c5] bg-white p-8 md:p-10 text-center">
                <span
                  className="msimge text-3xl text-[#40655c]"
                  aria-hidden="true"
                >
                  search_off
                </span>
                <h3 className="mt-3 font-sans-govde text-lg text-[#183a33]">
                  {t("noJobsTitle")}
                </h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#414846]">
                  {t("noJobsDescription")}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link href="/ilan-ara" className="buton-ana">
                    {t("goToJobSearch")}
                  </Link>
                  <Link href="/isveren/yeni-ilan" className="buton-ikincil">
                    {t("publishJob")}
                  </Link>
                </div>
              </div>
            )}
            {JOBS.map((job) => (
              <article
                key={job.id}
                data-reveal
                className={`group relative bg-white border rounded-xl p-6 md:p-8 flex flex-col gap-4 hover:shadow-[0_4px_16px_-2px_rgba(26,50,44,0.06)] transition-all duration-200 ${job.featured ? "border-[#d3e7e8]" : "border-[#dcdcd1]"}`}
              >
                {job.featured && (
                  <span className="absolute top-4 right-4 text-[11px] font-sans-govde font-semibold text-[#183a33] bg-gradient-to-r from-[rgba(24,58,51,0.10)] to-[rgba(64,101,92,0.06)] border border-[rgba(24,58,51,0.12)] px-2.5 py-0.5 rounded-full">
                    {t("featuredJob")}
                  </span>
                )}
                {/* Company */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-[10px] flex items-center justify-center font-sans-govde font-extrabold text-white text-sm shadow-sm shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${job.clr}cc, ${job.clr})`,
                    }}
                  >
                    {job.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-sans-govde font-semibold text-[#1b1c19] text-[14px] leading-tight truncate">
                      {job.company}
                    </p>
                    <p className="text-[#717976] text-[12px] flex items-center gap-1 mt-0.5">
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        className="w-3 h-3 shrink-0"
                      >
                        <path
                          d="M8 1.5A4.5 4.5 0 0 0 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6A4.5 4.5 0 0 0 8 1.5z"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="8"
                          cy="6"
                          r="1.5"
                          stroke="currentColor"
                          strokeWidth="1.3"
                        />
                      </svg>
                      {job.city}
                    </p>
                  </div>
                </div>
                {/* Title */}
                <h3 className="font-baslik font-bold text-[#183a33] text-[17px] leading-snug group-hover:text-[#40655c] transition-colors">
                  {job.title}
                </h3>
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {job.tags.map((t) => (
                    <Badge key={t} text={t} />
                  ))}
                </div>
                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#f5f4ee]">
                  <div>
                    <p className="font-sans-govde font-semibold text-[#183a33] text-[14px]">
                      {job.salary}
                    </p>
                    <p className="text-[#717976] text-[12px] font-sans-govde font-medium mt-0.5">
                      {job.type} · {job.posted}
                    </p>
                  </div>
                  <Link
                    href={
                      `/ilan/${job.id}` as Parameters<typeof Link>[0]["href"]
                    }
                    className="px-4 py-2 rounded-[10px] bg-gradient-to-br from-[#40655c] to-[#1a322c] text-white text-[13px] font-sans-govde font-semibold shadow-[0_3px_10px_rgba(24,58,51,0.22)] hover:shadow-[0_5px_18px_rgba(24,58,51,0.36)] hover:-translate-y-px active:translate-y-0 transition-all duration-200"
                  >
                    {t("apply")}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── POPÜLER ŞİRKETLER ─── */}
      <section
        id="sirketler"
        data-below-fold
        className="py-14 md:py-16 bg-[#faf9f3]"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="mb-8">
            <span className="inline-block mb-2 text-[11px] font-sans-govde font-semibold text-[#42655c] tracking-widest uppercase">
              {t("employersEyebrow")}
            </span>
            <h2 className="font-sans-govde font-semibold text-[#183a33] text-2xl sm:text-3xl tracking-tight mb-2">
              {t("employersHeading")}
            </h2>
            <p className="text-[#414846] text-[15px] font-sans-govde max-w-lg">
              {t("employersDescription")}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {COMPANIES.length === 0 && (
              <div className="col-span-2 sm:col-span-3 lg:col-span-6 rounded-xl border border-dashed border-[#c1c8c5] bg-white p-8 text-center">
                <span
                  className="msimge text-3xl text-[#40655c]"
                  aria-hidden="true"
                >
                  domain
                </span>
                <h3 className="mt-3 font-sans-govde text-lg text-[#183a33]">
                  {t("employersPreparing")}
                </h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#414846]">
                  {t("employersEmptyDescription")}
                </p>
                <Link href="/isveren/yeni-ilan" className="buton-ana mt-5">
                  {t("employerGetStarted")}
                </Link>
              </div>
            )}
            {COMPANIES.map(({ name, sector, open, initials, clr }) => (
              <Link
                key={name}
                href="/sirketler"
                data-reveal
                className="group flex flex-col items-center gap-3 p-5 bg-white border border-[#dcdcd1] rounded-xl hover:border-[#8eb5b0] hover:shadow-[0_4px_16px_-2px_rgba(26,50,44,0.06)] transition-all duration-200"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-sans-govde font-extrabold text-white text-lg shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${clr}cc, ${clr})`,
                  }}
                >
                  {initials}
                </div>
                <div className="text-center">
                  <p className="font-sans-govde font-semibold text-[#1b1c19] text-[13px] leading-snug mb-0.5 group-hover:text-[#183a33] transition-colors">
                    {name}
                  </p>
                  <p className="text-[11px] text-[#717976]">{sector}</p>
                  <p className="text-[12px] font-sans-govde font-semibold text-[#183a33] mt-2">
                    {t("openPositions", { count: open })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NASIL KALIŞIR ─── */}
      <section
        data-below-fold
        className="py-14 md:py-16 bg-[#f5f4ee]"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <span className="inline-block mb-2 text-[11px] font-sans-govde font-semibold text-[#42655c] tracking-widest uppercase">
              {t("howItWorksEyebrow")}
            </span>
            <h2 className="font-baslik font-semibold text-[#183a33] text-2xl sm:text-3xl tracking-[-0.025em]">
              {t("howItWorksHeading")}
            </h2>
          </div>
          {/* Tab switcher */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-white border border-[#dcdcd1] rounded-lg p-1 gap-1">
              {(["seeker", "employer"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={[
                    'px-6 py-2.5 rounded-md text-[14px] font-sans-govde font-semibold transition-all duration-200',
                    activeTab === tab
                      ? "bg-[#305149] text-white"
                      : "text-[#4b5563] hover:text-[#183a33]",
                  ].join(" ")}
                >
                  {tab === "seeker" ? t("jobSeekerTab") : t("employerTab")}
                </button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {(activeTab === "seeker"
              ? arayanAdimlari
              : isverenAdimlari
            ).map(({ n, title, desc }, i) => (
              <div
                key={n}
                className="relative flex flex-col items-center text-center p-6 bg-white border border-[#dcdcd1] rounded-xl hover:border-[#8eb5b0] transition-all duration-200"
              >
                {i < 2 && (
                  <span className="hidden sm:block absolute top-10 -right-3 text-[#c1c8c5] text-2xl font-light z-10">
                    →
                  </span>
                )}
                <div className="w-12 h-12 rounded-lg bg-[#eeeee7] flex items-center justify-center mb-5 text-[#305149]">
                  <span className="font-sans-govde font-extrabold text-[#305149] text-[13px]">
                    {n}
                  </span>
                </div>
                <h3 className="font-sans-govde font-extrabold text-[#183a33] text-[17px] mb-2">
                  {title}
                </h3>
                <p className="text-[#414846] text-[14px] leading-relaxed font-sans-govde font-medium">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── İŞVEREN CTA ─── */}
      <section data-below-fold className="border-t border-[#dcdcd1] bg-[#f6f5ef] py-14 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-9">
            <span className="block mb-2 text-[11px] font-sans-govde font-semibold text-[#42655c] tracking-widest uppercase">
              {t("ctaEyebrow")}
            </span>
            <h2 className="font-baslik font-semibold text-[#183a33] text-2xl sm:text-3xl tracking-[-0.025em]">
              {t("ctaHeading")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <article className="group flex flex-col justify-between rounded-2xl border border-[#dcdcd1] bg-white p-6 shadow-[0_8px_30px_-24px_rgba(24,58,51,0.5)] transition-all duration-300 hover:-translate-y-1 hover:border-[#9abdb7] hover:shadow-[0_18px_42px_-24px_rgba(24,58,51,0.55)] md:p-8">
              <div>
                <span className="msimge mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-[#b3dbc5] bg-[#e8f4ee] text-[#1e4b39] text-2xl" aria-hidden="true">
                  person_pin
                </span>
                <h3 className="font-sans-govde font-semibold text-[#183a33] text-xl mb-2">
                  {t("seekersTitle")}
                </h3>
                <p className="text-[#414846] text-[15px] leading-6 mb-5">
                  {t("seekersDescription")}
                </p>
                <ul className="space-y-2.5 mb-7 text-[14px] text-[#1b1c19]">
                  {[
                    t("seekersBulletProfile"),
                    t("seekersBulletExplore"),
                    t("seekersBulletApply"),
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span className="msimge text-[#1e4b39]" aria-hidden="true">
                        check_circle
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/giris" className="buton-ikincil inline-flex w-full items-center justify-center gap-2">
                {t("seekersButton")}
                <span className="msimge" aria-hidden="true">arrow_forward</span>
              </Link>
            </article>
            <article
              id="post-job"
              className="flex flex-col justify-between rounded-xl border border-[#d3e7e8] bg-white p-6 md:p-8"
            >
              <div>
                <span className="msimge mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-[#d3e7e8] bg-[#edf5fa] text-[#305149] text-2xl" aria-hidden="true">
                  corporate_fare
                </span>
                <h3 className="font-sans-govde font-semibold text-[#183a33] text-xl mb-2">
                  {t("employersTitle")}
                </h3>
                <p className="text-[#414846] text-[15px] leading-6 mb-5">
                  {t("employersCardDescription")}
                </p>
                <ul className="space-y-2.5 mb-7 text-[14px] text-[#1b1c19]">
                  {[
                    t("employersBulletAccount"),
                    t("employersBulletPublish"),
                    t("employersBulletReview"),
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span className="msimge text-[#305149]" aria-hidden="true">
                        check_circle
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Link href="/isveren/yeni-ilan" className="buton-ana inline-flex w-full items-center justify-center gap-2">
                  {t("employersPostJob")}
                  <span className="msimge" aria-hidden="true">add</span>
                </Link>
                <Link href="/ilan-paketleri" className="buton-ikincil inline-flex w-full items-center justify-center">
                  {t("viewPackages")}
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
