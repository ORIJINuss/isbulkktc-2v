"use client";

import VeritabaniIlanDetayi from "@/bilesenler/ilan/VeritabaniIlanDetayi";

type Props = {
  params: { slug: string; yerel: string };
};

/**
 * REQ-JOB-LIVE-001 — Detay rotasi yalnizca canli job_posts ilanlarini cozer.
 * Eksik slug layout tarafinda 404'e duser; kullanilamaz veri ile eksik veri
 * VeritabaniIlanDetayi icinde ayricali durumlarla gosterilir. Demo veriye
 * dusturulmaz, veri uretilmez.
 */
export default function IlanDetaySayfasi({ params }: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <VeritabaniIlanDetayi slug={params.slug} />
    </div>
  );
}
