"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/yonlendirme";
import { BASVURU_SEMA } from "@/lib/veri/basvuru-sema";
import { IZIN_TIPLERI } from "@/lib/sabitler/alan-degiskenleri";
import Buton from "@/bilesenler/genel/Buton";
import TurnstileBileseni from "@/bilesenler/genel/TurnstileBileseni";

const CV_EN_FAZLA_BOYUT = 10 * 1024 * 1024;
const CV_IZINLI_TIPLER: readonly string[] = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

type CvYuklemeCevabi = {
  basarili?: boolean;
  hata?: string;
  veri?: { storage_path?: unknown } | null;
};

async function cvDosyayiYukle(
  dosya: File,
  varsayilanHata: string
): Promise<string> {
  const formVerisi = new FormData();
  formVerisi.append("file", dosya);
  const cevap = await fetch("/api/aday/cv", {
    method: "POST",
    body: formVerisi,
  });
  const govde = (await cevap.json().catch(() => null)) as CvYuklemeCevabi | null;
  const yol = govde?.veri?.storage_path;
  if (!cevap.ok || typeof yol !== "string" || yol.length === 0) {
    throw new Error(govde?.hata ?? varsayilanHata);
  }
  return yol;
}

type Props = {
  ilanSlug: string;
};

/* -------------------------------------------------------------------------- */
/* REQ-JOB-LIVE-001 — canli ilan basvuru formu                                 */
/* Akis korunur: CV once adaya ozel depolamaya yuklenir, ardindan basvuru      */
/* kaydi olusturulur. Yol dogrulamasi sunucuda aday sahipligi ile yapilir.     */
/* -------------------------------------------------------------------------- */
export default function VeritabaniIlanBasvurusu({ ilanSlug }: Props) {
  const t = useTranslations("ilanDetay");
  const g = useTranslations("genel");

  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [izinTipi, setIzinTipi] = useState<string>("VATANDAS");
  const [kapakMetni, setKapakMetni] = useState<string>("");
  const [adSoyad, setAdSoyad] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [cepTelefonu, setCepTelefonu] = useState<string>("");
  const [cvDosya, setCvDosya] = useState<File | undefined>();
  const [gizlilikOnayi, setGizlilikOnayi] = useState(false);
  const [alanHatalari, setAlanHatalari] = useState<
    Partial<Record<"adSoyad" | "email" | "cepTelefonu" | "gizlilikIzni", string>>
  >({});
  const [yukleniyor, setYukleniyor] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);
  const [kanalHatasi, setKanalHatasi] = useState<string | null>(null);

  const gonder = async (e: FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) return;

    const veri = BASVURU_SEMA.safeParse({
      ilanSlug,
      adSoyad: adSoyad.trim(),
      email: email.trim(),
      cepTelefonu: cepTelefonu.trim(),
      ikametIzinDurumu: izinTipi,
      kapakMektubu: kapakMetni.trim() || undefined,
      cvDosyaYolu: "",
      gizlilikIzni: gizlilikOnayi,
    });

    if (!veri.success) {
      const gosterilecekAlanlar = [
        "adSoyad",
        "email",
        "cepTelefonu",
        "gizlilikIzni",
      ] as const;
      const hatalar: typeof alanHatalari = {};
      for (const [alan, hata] of Object.entries(
        veri.error.flatten().fieldErrors
      )) {
        const ilk = hata?.[0];
        if (!ilk) continue;
        if ((gosterilecekAlanlar as readonly string[]).includes(alan)) {
          hatalar[alan as keyof typeof hatalar] = ilk;
        }
      }
      setAlanHatalari(hatalar);
      return;
    }

    setAlanHatalari({});
    setYukleniyor(true);
    setKanalHatasi(null);
    try {
      const cvYolu = cvDosya
        ? await cvDosyayiYukle(cvDosya, t("basvuruCvYukleHatasi"))
        : "";
      const cevap = await fetch("/api/basvurular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...veri.data,
          cvDosyaYolu: cvYolu,
          turnstileToken,
        }),
      });
      if (!cevap.ok) {
        const govde = (await cevap.json().catch(() => null)) as {
          hata?: string;
        } | null;
        if (cevap.status === 401 || cevap.status === 403) {
          setKanalHatasi(t("basvuruGirisGerekli"));
          return;
        }
        setKanalHatasi(govde?.hata ?? t("basvuruKanalHatasi"));
        return;
      }
      setGonderildi(true);
    } catch (hata) {
      setKanalHatasi(
        hata instanceof Error ? hata.message : t("basvuruKanalHatasi")
      );
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <aside className="lg:sticky lg:top-28 lg:self-start space-y-4">
      <form
        onSubmit={gonder}
        className="mineral-kart rounded-[22px] p-6 space-y-5 shadow-mineral-yukseltilmis"
      >
        <h3 className="font-haber font-black text-xl text-ikincil leading-tight">
          {g("hemenBasvur")}
        </h3>

        <div>
          <div className="girdiEtiket">{t("basvuruAdSoyad")} *</div>
          <input
            name="adSoyad"
            className="girdi w-full"
            placeholder={t("basvuruAdSoyadYerTutucu")}
            value={adSoyad}
            onChange={(e) => setAdSoyad(e.target.value)}
            maxLength={80}
            required
            aria-invalid={Boolean(alanHatalari.adSoyad)}
          />
          {alanHatalari.adSoyad && (
            <p className="alanHatasi">{alanHatalari.adSoyad}</p>
          )}
        </div>

        <div>
          <div className="girdiEtiket">{t("basvuruEmail")} *</div>
          <input
            name="email"
            type="email"
            className="girdi w-full"
            placeholder="ahmet@email.ku"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            required
            aria-invalid={Boolean(alanHatalari.email)}
          />
          {alanHatalari.email && (
            <p className="alanHatasi">{alanHatalari.email}</p>
          )}
        </div>

        <div>
          <div className="girdiEtiket">{t("basvuruTelefon")} *</div>
          <input
            name="cepTelefonu"
            type="tel"
            inputMode="tel"
            className="girdi w-full"
            placeholder="+90 548 123 4567"
            value={cepTelefonu}
            onChange={(e) => setCepTelefonu(e.target.value)}
            maxLength={24}
            required
            aria-invalid={Boolean(alanHatalari.cepTelefonu)}
          />
          {alanHatalari.cepTelefonu && (
            <p className="alanHatasi">{alanHatalari.cepTelefonu}</p>
          )}
        </div>

        <div>
          <div className="girdiEtiket">{t("basvuruIzinDurumu")} *</div>
          <select
            name="ikametIzinDurumu"
            className="girdi w-full"
            value={izinTipi}
            onChange={(e) => setIzinTipi(e.target.value)}
            required
          >
            {IZIN_TIPLERI.map((iz) => (
              <option key={iz.deger} value={iz.deger}>
                {iz.etiket}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="girdiEtiket">{t("basvuruKapakMektubu")}</div>
          <textarea
            name="kapakMektubu"
            className="girdi w-full resize-none"
            rows={4}
            value={kapakMetni}
            onChange={(e) => setKapakMetni(e.target.value)}
            maxLength={2000}
            placeholder={t("basvuruKapakMektubuYerTutucu")}
          />
        </div>

        <div>
          <div className="girdiEtiket">{t("basvuruCvYukle")}</div>
          <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-dashed border-ana-outline/50 bg-ana-kapsayici/30 cursor-pointer hover:bg-ana-kapsayici/60 transition-colors">
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="msimge text-ana" aria-hidden="true">
                upload_file
              </span>
              <span className="text-sm text-ikincil truncate">
                {cvDosya?.name ?? t("basvuruCvSecilmedi")}
              </span>
            </span>
            <span className="text-[11px] font-bold text-ana shrink-0">
              {cvDosya ? t("basvuruCvDegistir") : t("basvuruCvSec")}
            </span>
            <input
              name="cv"
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => {
                const secilen = e.target.files?.[0];
                e.target.value = "";
                if (!secilen) {
                  setCvDosya(undefined);
                  return;
                }
                if (
                  !CV_IZINLI_TIPLER.includes(secilen.type) ||
                  secilen.size === 0 ||
                  secilen.size > CV_EN_FAZLA_BOYUT
                ) {
                  setCvDosya(undefined);
                  setKanalHatasi(t("basvuruCvYukleHatasi"));
                  return;
                }
                setKanalHatasi(null);
                setCvDosya(secilen);
              }}
            />
          </label>
        </div>

        <div>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              name="gizlilikIzni"
              type="checkbox"
              className="mt-0.5 w-4 h-4 accent-ana shrink-0"
              checked={gizlilikOnayi}
              onChange={(e) => setGizlilikOnayi(e.target.checked)}
              aria-invalid={Boolean(alanHatalari.gizlilikIzni)}
            />
            <span className="text-[11px] text-ikincil/75 leading-snug">
              {t("basvuruGizlilikOnayi")}
            </span>
          </label>
          {alanHatalari.gizlilikIzni && (
            <p className="alanHatasi">{alanHatalari.gizlilikIzni}</p>
          )}
        </div>

        <TurnstileBileseni onDogrulama={setTurnstileToken} />

        <Buton
          tur="buton"
          varyant="ana"
          boyut="blok"
          ikon={yukleniyor ? "progress_activity" : "send"}
          ikonSonunda
          yukleniyor={yukleniyor}
          disabled={!turnstileToken || gonderildi}
        >
          {gonderildi
            ? t("basvuruAlindi")
            : yukleniyor
              ? t("basvuruGonderiliyor")
              : g("hemenBasvur")}
        </Buton>

        {kanalHatasi && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-hata-kapsayici border border-hata/30 flex items-start gap-2"
          >
            <span className="msimge text-hata text-xl shrink-0 mt-0.5" aria-hidden="true">
              error
            </span>
            <div className="text-[12px] text-hata leading-snug font-semibold">
              {kanalHatasi}
            </div>
          </div>
        )}

        {gonderildi && (
          <div className="p-3 rounded-xl bg-basari-900/12 border border-basari-900/30 flex items-start gap-2">
            <span className="msimge text-basari-900 text-xl shrink-0 mt-0.5" aria-hidden="true">
              task_alt
            </span>
            <div className="text-[12px] text-basari-900 leading-snug font-semibold">
              {t("basvuruAlindiAciklama")}
            </div>
          </div>
        )}

        <p className="text-[11px] text-ikincil/60 leading-snug">
          <Link href="/giris" className="text-ana font-semibold hover:underline">
            {t("girisYap")}
          </Link>
        </p>
      </form>
    </aside>
  );
}
