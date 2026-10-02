"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sb } from "@/lib/yardimcilar/sinif-yardimcisi";
import Buton from "@/bilesenler/genel/Buton";
import TurnstileBileseni from "@/bilesenler/genel/TurnstileBileseni";
import { tarayiciIcinSupabaseOlustur } from "@/lib/supabase/tarayici-istemci";
import { useRouter } from "@/i18n/yonlendirme";
import { ADAY_KAYIT_SEMA, AdayKayitTipi } from "@/lib/veri/aday-kayit-sema";
import {
  ISVEREN_KAYIT_SEMA,
  IsverenKayitTipi,
} from "@/lib/veri/isveren-kayit-sema";

const ADAY_IKAMET_SECENEKLERI: Array<{
  deger: AdayKayitTipi["ikametDurumu"];
  etiket: string;
}> = [
  { deger: "KKTC_VATANDAS", etiket: "KKTC Vatandaşı" },
  { deger: "TC_VATANDAS", etiket: "Türkiye (TC) Vatandaşı" },
  { deger: "UCUNCU_ULKE", etiket: "Üçüncü Ülke Vatandaşı (Çalışma İzni ile)" },
  { deger: "OGRENCI", etiket: "Öğrenci (KKTC Üniversitesi)" },
];

type KullaniciTuru = "aday" | "isveren";
type ModTuru = "giris" | "kayit";

const EPOSTA_DESENI = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type AuthHata = { status?: number; message?: string };

export default function GirisKayitSekmeleri({
  sinif,
  initialUserType = "aday",
  initialMode = "giris",
  kilitliKullaniciTuru = false,
}: {
  sinif?: string;
  initialUserType?: KullaniciTuru;
  initialMode?: ModTuru;
  kilitliKullaniciTuru?: boolean;
}) {
  const t = useTranslations("giris");
  const g = useTranslations("genel");
  const [kullaniciTuru, setKullaniciTuru] = useState<KullaniciTuru>(initialUserType);
  const [mod, setMod] = useState<ModTuru>(initialMode);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [sifreGoster, setSifreGoster] = useState(false);
  const [sunucuHatasi, setSunucuHatasi] = useState<string | null>(null);
  const [bilgiMesaji, setBilgiMesaji] = useState<string | null>(null);
  const [sifreSifirlamaMesaji, setSifreSifirlamaMesaji] = useState<string | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [sifreSifirlamaBekliyor, setSifreSifirlamaBekliyor] = useState(false);
  const gonderiliyorRef = useRef(false);
  const sifreSifirlamaRef = useRef(false);
  const router = useRouter();

  const adayForm = useForm<AdayKayitTipi>({
    resolver: zodResolver(ADAY_KAYIT_SEMA),
    defaultValues: {
      adSoyad: "",
      cepTelefonu: "",
      email: "",
      sifre: "",
      sifreTekrar: "",
      ikametDurumu: "OGRENCI",
      kvkAydinlatmaOnay: false as unknown as true,
      acikRizaOnay: false as unknown as true,
      yasSiniriOnay: false as unknown as true,
    },
    mode: "onTouched",
  });

  const isverenForm = useForm<IsverenKayitTipi>({
    resolver: zodResolver(ISVEREN_KAYIT_SEMA),
    defaultValues: {
      sirketAdi: "",
      vergiKimlikNo: "",
      yetkiliEposta: "",
      sifre: "",
      kvkOnay: false as unknown as true,
    },
    mode: "onTouched",
  });

  const authDurumunuTemizle = () => {
    setSunucuHatasi(null);
    setBilgiMesaji(null);
    setSifreSifirlamaMesaji(null);
    adayForm.clearErrors();
    isverenForm.clearErrors();
  };

  const epostaDegeriniAl = (alanlar: Record<string, unknown>): string =>
    String((kullaniciTuru === "aday" ? alanlar.email : alanlar.yetkiliEposta) ?? "").trim();

  const epostaDogrulamaHatasi = (eposta: string): string | null => {
    if (!eposta) return t("hataEpostaZorunlu");
    if (!EPOSTA_DESENI.test(eposta)) return t("hataEpostaGecersiz");
    return null;
  };

  const authHataMesaji = (hata: AuthHata): string => {
    const durum = typeof hata.status === "number" ? hata.status : 0;
    const mesaj = (hata.message ?? "").toLowerCase();
    if (durum === 429) return t("hataCokFazlaDeneme");
    if (durum === 0) return t("hataBaglantiKurulamadi");
    if (mod === "giris") {
      if (mesaj.includes("email not confirmed")) return t("hataEpostaDogrulanmadi");
      return durum < 500 ? t("hataGirisBilgileriHatali") : t("hataIslemTamamlanamadi");
    }
    if (durum === 422) return t("hataKayitZatenVar");
    return t("hataIslemTamamlanamadi");
  };

  const gonder = async (veri: unknown): Promise<void> => {
    if (gonderiliyorRef.current) return;
    gonderiliyorRef.current = true;
    setGonderiliyor(true);
    setSunucuHatasi(null);
    setBilgiMesaji(null);
    setSifreSifirlamaMesaji(null);

    const alanlar = veri as Record<string, unknown>;
    const email = epostaDegeriniAl(alanlar);
    const sifre = String(alanlar.sifre ?? "");

    try {
      if (mod === "giris") {
        const epostaHatasi = epostaDogrulamaHatasi(email);
        if (epostaHatasi || !sifre) {
          setSunucuHatasi(
            [epostaHatasi, sifre ? null : t("hataSifreZorunlu")]
              .filter((mesaj): mesaj is string => Boolean(mesaj))
              .join(" ")
          );
          return;
        }
      }

      const supabase = tarayiciIcinSupabaseOlustur();

      if (mod === "giris") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: sifre });
        if (error) {
          setSunucuHatasi(authHataMesaji(error));
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: sifre,
          options: {
            captchaToken: turnstileToken,
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
              kullaniciTuru === "aday" ? "/aday-profilim" : "/isveren/yeni-ilan"
            )}`,
            data: {
              role: kullaniciTuru === "aday" ? "candidate" : "employer",
              full_name:
                kullaniciTuru === "aday"
                  ? String(alanlar.adSoyad ?? "")
                  : String(alanlar.sirketAdi ?? ""),
              company_name:
                kullaniciTuru === "isveren" ? String(alanlar.sirketAdi ?? "") : undefined,
              company_tax_identifier:
                kullaniciTuru === "isveren" ? String(alanlar.vergiKimlikNo ?? "") : undefined,
              company_email: kullaniciTuru === "isveren" ? email : undefined,
            },
          },
        });
        if (error) {
          setSunucuHatasi(authHataMesaji(error));
          return;
        }
        if (!data.session) {
          setBilgiMesaji(t("kayitDogrulamaMesaji"));
          return;
        }
      }

      router.push(kullaniciTuru === "aday" ? "/aday-profilim" : "/isveren/yeni-ilan");
    } catch (hata) {
      const yapilandirmaHatasi =
        hata instanceof Error && hata.name === "OrtamYapilandirmaHatasi";
      setSunucuHatasi(
        yapilandirmaHatasi ? t("hataHizmetYapilandirilmamis") : t("hataBaglantiKurulamadi")
      );
    } finally {
      gonderiliyorRef.current = false;
      setGonderiliyor(false);
    }
  };

  const aktifForm = kullaniciTuru === "aday" ? adayForm : isverenForm;

  const sifreSifirlamaIstegi = async () => {
    if (sifreSifirlamaRef.current) return;
    sifreSifirlamaRef.current = true;
    setSifreSifirlamaBekliyor(true);
    setSunucuHatasi(null);
    setBilgiMesaji(null);
    setSifreSifirlamaMesaji(null);

    try {
      const formVerisi = aktifForm.getValues() as Record<string, unknown>;
      const email = epostaDegeriniAl(formVerisi);
      const dogrulamaHatasi = epostaDogrulamaHatasi(email);
      if (dogrulamaHatasi) {
        setSunucuHatasi(dogrulamaHatasi);
        return;
      }

      const yanit = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, yerel: document.documentElement.lang || "tr" }),
      });
      const govde = (await yanit.json().catch(() => null)) as { basarili?: boolean } | null;
      if (!yanit.ok || !govde?.basarili) {
        setSunucuHatasi(t("sifreSifirlamaBasarisiz"));
        return;
      }
      setSifreSifirlamaMesaji(t("sifreSifirlamaGonderildi"));
    } catch {
      setSunucuHatasi(t("hataBaglantiKurulamadi"));
    } finally {
      sifreSifirlamaRef.current = false;
      setSifreSifirlamaBekliyor(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = aktifForm as unknown as ReturnType<typeof useForm>;

  const isGonderiliyor = isSubmitting || gonderiliyor;

  return (
    <div className={sb("auth-panel mineral-kart relative overflow-hidden p-6 sm:p-8 shadow-editoriyel-kart", sinif)}>
      <div className="auth-panel__glow" aria-hidden="true" />
      <div className="relative z-10">
      {!kilitliKullaniciTuru && (
      <div className="inline-flex p-1 bg-ikincil-kapsayici rounded-2xl mb-6 w-full">
        <button
          type="button"
          onClick={() => {
            setKullaniciTuru("aday");
            authDurumunuTemizle();
          }}
          className={sb(
            "flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all",
            kullaniciTuru === "aday"
              ? "bg-ana text-beyaz shadow-mineral-dosye"
              : "text-ikincil hover:text-ana"
          )}
        >
          <span className="msimge inline-block ms-0 me-2 text-base vertical-align-sub">
            person
          </span>
          {t("sekmeAday")}
        </button>
        <button
          type="button"
          onClick={() => {
            setKullaniciTuru("isveren");
            authDurumunuTemizle();
          }}
          className={sb(
            "flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all",
            kullaniciTuru === "isveren"
              ? "bg-ana text-beyaz shadow-mineral-dosye"
              : "text-ikincil hover:text-ana"
          )}
        >
          <span className="msimge inline-block ms-0 me-2 text-base vertical-align-sub">
            apartment
          </span>
          {t("sekmeIsveren")}
        </button>
      </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {(["giris", "kayit"] as ModTuru[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMod(m);
                authDurumunuTemizle();
              }}
              className={sb(
                "text-sm font-semibold pb-1 border-b-2 transition-colors",
                mod === m
                  ? "border-ana text-ana"
                  : "border-transparent text-ikincil/60 hover:text-ikincil"
              )}
            >
              {m === "giris" ? t("girisMod") : t("kayitMod")}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={
          mod === "giris"
            ? (event) => {
                event.preventDefault();
                void gonder(aktifForm.getValues());
              }
            : handleSubmit(gonder)
        }
        noValidate
        className="space-y-4"
      >
        {sunucuHatasi && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-xl border border-hata-900/30 bg-hata-900/10 p-3 text-sm font-medium text-hata-900"
          >
            {sunucuHatasi}
          </div>
        )}
        {bilgiMesaji && (
          <p
            role="status"
            aria-live="polite"
            className="rounded-xl border border-basari-900/30 bg-basari-900/10 p-3 text-sm font-medium text-basari-900"
          >
            {bilgiMesaji}
          </p>
        )}
        {mod === "kayit" && kullaniciTuru === "aday" && (
          <div>
            <label className="block text-xs font-semibold text-ana mb-1.5 ms-0.5">
              {t("adSoyad")}
            </label>
            <input
              {...register("adSoyad")}
              className="girdi w-full"
              placeholder="Ahmet Yılmaz"
            />
            {errors.adSoyad && (
              <p className="text-xs text-hata-900 mt-1 ps-1">
                {(errors.adSoyad?.message as string) ?? ""}
              </p>
            )}
          </div>
        )}

        {mod === "kayit" && kullaniciTuru === "aday" && (
          <div>
            <label className="block text-xs font-semibold text-ana mb-1.5 ms-0.5">
              {t("cepTelefonu")}
            </label>
            <input
              {...register("cepTelefonu")}
              className="girdi w-full"
              placeholder="+90 (533) 123 45 67"
            />
            {errors.cepTelefonu && (
              <p className="text-xs text-hata-900 mt-1 ps-1">
                {(errors.cepTelefonu?.message as string) ?? ""}
              </p>
            )}
          </div>
        )}

        {mod === "kayit" && kullaniciTuru === "aday" && (
          <div>
            <label className="block text-xs font-semibold text-ana mb-1.5 ms-0.5">
              {t("ikametDurumu")}
            </label>
            <select {...register("ikametDurumu")} className="girdi w-full">
              {ADAY_IKAMET_SECENEKLERI.map((i) => (
                <option key={i.deger} value={i.deger}>
                  {i.etiket}
                </option>
              ))}
            </select>
            {errors.ikametDurumu && (
              <p className="text-xs text-hata-900 mt-1 ps-1">
                {(errors.ikametDurumu?.message as string) ?? ""}
              </p>
            )}
          </div>
        )}

        {kullaniciTuru === "isveren" && (
          <>
            {mod === "kayit" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-ana mb-1.5 ms-0.5">
                    {t("sirketAdi")}
                  </label>
                  <input
                    {...register("sirketAdi")}
                    className="girdi w-full"
                  />
                  {errors.sirketAdi && (
                    <p className="text-xs text-hata-900 mt-1 ps-1">
                      {(errors.sirketAdi?.message as string) ?? ""}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ana mb-1.5 ms-0.5">
                    {t("vergiKimlikNo")}
                  </label>
                  <input
                    {...register("vergiKimlikNo")}
                    className="girdi w-full"
                  />
                  {errors.vergiKimlikNo && (
                    <p className="text-xs text-hata-900 mt-1 ps-1">
                      {(errors.vergiKimlikNo?.message as string) ?? ""}
                    </p>
                  )}
                </div>
              </>
            )}
            {mod === "kayit" && (
              <div>
                <label
                  htmlFor="kayit-isveren-eposta"
                  className="block text-xs font-semibold text-ana mb-1.5 ms-0.5"
                >
                  {t("kurumsalEposta")}
                </label>
                <input
                  id="kayit-isveren-eposta"
                  type="email"
                  autoComplete="email"
                  {...register("yetkiliEposta")}
                  className="girdi w-full"
                  placeholder="ornek@example.com"
                />
                {errors.yetkiliEposta && (
                  <p className="text-xs text-hata-900 mt-1 ps-1">
                    {(errors.yetkiliEposta?.message as string) ?? ""}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {kullaniciTuru === "aday" && (
          <div>
            <label
              htmlFor="giris-eposta"
              className="block text-xs font-semibold text-ana mb-1.5 ms-0.5"
            >
              {t("email")}
            </label>
            <input
              id="giris-eposta"
              type="email"
              autoComplete="email"
              {...register("email")}
              className="girdi w-full"
              placeholder="ahmet.yilmaz@email.ku"
            />
            {errors.email && (
              <p className="text-xs text-hata-900 mt-1 ps-1">
                {(errors.email?.message as string) ?? ""}
              </p>
            )}
          </div>
        )}

        {kullaniciTuru === "isveren" && mod === "giris" && (
          <div>
            <label
              htmlFor="giris-isveren-eposta"
              className="block text-xs font-semibold text-ana mb-1.5 ms-0.5"
            >
              {t("kurumsalEposta")}
            </label>
            <input
              id="giris-isveren-eposta"
              type="email"
              autoComplete="email"
              {...register("yetkiliEposta")}
              className="girdi w-full"
              placeholder="ornek@example.com"
            />
            {errors.yetkiliEposta && (
              <p className="text-xs text-hata-900 mt-1 ps-1">
                {(errors.yetkiliEposta?.message as string) ?? ""}
              </p>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="giris-sifre"
            className="block text-xs font-semibold text-ana mb-1.5 ms-0.5"
          >
            {t("sifre")}
          </label>
          <div className="relative">
            <input
              id="giris-sifre"
              type={sifreGoster ? "text" : "password"}
              autoComplete={mod === "giris" ? "current-password" : "new-password"}
              {...register("sifre")}
              className="girdi w-full pe-11"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setSifreGoster(!sifreGoster)}
              className="absolute inset-y-0 end-2.5 flex items-center text-ikincil/60 hover:text-ana transition-colors"
              aria-label={sifreGoster ? t("sifreGizle") : t("sifreGoster")}
              aria-pressed={sifreGoster}
            >
              <span className="msimge text-xl" aria-hidden="true">
                {sifreGoster ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
          {errors.sifre && (
            <p className="text-xs text-hata-900 mt-1 ps-1">
              {(errors.sifre?.message as string) ?? ""}
            </p>
          )}
          {mod === "giris" && (
            <button
              type="button"
              onClick={() => void sifreSifirlamaIstegi()}
              disabled={sifreSifirlamaBekliyor}
              aria-busy={sifreSifirlamaBekliyor || undefined}
              className="mt-2 text-xs font-semibold text-ana hover:underline disabled:opacity-60 disabled:no-underline"
            >
              {sifreSifirlamaBekliyor ? t("sifreSifirlamaGonderiliyor") : t("sifremiUnuttum")}
            </button>
          )}
        </div>
        {sifreSifirlamaMesaji && (
          <p
            role="status"
            aria-live="polite"
            className="rounded-xl bg-basari-900/10 p-3 text-xs font-medium text-basari-900"
          >
            {sifreSifirlamaMesaji}
          </p>
        )}

        {mod === "kayit" && kullaniciTuru === "aday" && (
          <div>
            <label
              htmlFor="giris-sifre-tekrar"
              className="block text-xs font-semibold text-ana mb-1.5 ms-0.5"
            >
              {t("sifreTekrar")}
            </label>
            <input
              id="giris-sifre-tekrar"
              type={sifreGoster ? "text" : "password"}
              autoComplete="new-password"
              {...register("sifreTekrar")}
              className="girdi w-full"
              placeholder="••••••••"
            />
            {errors.sifreTekrar && (
              <p className="text-xs text-hata-900 mt-1 ps-1">
                {(errors.sifreTekrar?.message as string) ?? ""}
              </p>
            )}
          </div>
        )}

        {mod === "kayit" && kullaniciTuru === "aday" && (
          <div className="space-y-2.5 pt-2">
            {([
              { anahtar: "kvkAydinlatmaOnay", baslik: t("kvk1Baslik"), aciklama: t("kvk1Aciklama"), ikon: "description" },
              { anahtar: "acikRizaOnay", baslik: t("kvk2Baslik"), aciklama: t("kvk2Aciklama"), ikon: "check_circle" },
              { anahtar: "yasSiniriOnay", baslik: t("kvk3Baslik"), aciklama: t("kvk3Aciklama"), ikon: "verified_user" },
            ] satisfies Array<{ anahtar: keyof AdayKayitTipi; baslik: string; aciklama: string; ikon: string }>).map((onay) => (
              <label
                key={onay.anahtar}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-ikincil-kapsayici/60 hover:bg-ikincil-kapsayici cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  {...register(onay.anahtar)}
                  className="mt-0.5 w-4 h-4 shrink-0 rounded border-cizgi text-ana accent-[#1A3A34] focus-visible:ring-2 focus-visible:ring-ana"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="msimge text-ana text-sm" aria-hidden="true">{onay.ikon}</span>
                    <span className="text-sm font-medium text-ana">{onay.baslik}</span>
                  </div>
                  <p className="text-[11px] text-ikincil/75 leading-snug mt-0.5">{onay.aciklama}</p>
                </div>
              </label>
            ))}
            {(errors.kvkAydinlatmaOnay || errors.acikRizaOnay || errors.yasSiniriOnay) && (
              <p role="alert" className="text-xs text-hata-900 ps-1">
                {t("onayZorunluAday")}
              </p>
            )}
          </div>
        )}

        {mod === "kayit" && kullaniciTuru === "isveren" && (
          <div className="space-y-2.5 pt-2">
            {([
              {
                anahtar: "kvkOnay",
                baslik: t("isverenKvkBaslik"),
                ikon: "verified_user",
                aciklama: t("isverenKvkAciklama"),
              },
            ] satisfies Array<{ anahtar: keyof IsverenKayitTipi; baslik: string; ikon: string; aciklama: string }>).map((onay) => (
              <label
                key={onay.anahtar}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-ikincil-kapsayici/60 hover:bg-ikincil-kapsayici cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  {...register(onay.anahtar)}
                  className="mt-0.5 w-4 h-4 shrink-0 rounded border-cizgi text-ana accent-[#1A3A34] focus-visible:ring-2 focus-visible:ring-ana"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="msimge text-ana text-sm" aria-hidden="true">{onay.ikon}</span>
                    <span className="text-sm font-medium text-ana">
                      {onay.baslik}
                    </span>
                  </div>
                  <p className="text-[11px] text-ikincil/70 leading-snug mt-0.5">
                    {onay.aciklama}
                  </p>
                </div>
              </label>
            ))}
            {errors.kvkOnay && (
              <p role="alert" className="text-xs text-hata-900 ps-1">
                {t("onayZorunluIsveren")}
              </p>
            )}
          </div>
        )}

        {mod === "kayit" && (
          <TurnstileBileseni
            onDogrulama={setTurnstileToken}
            sinif="pt-1"
          />
        )}

        {mod === "giris" && kullaniciTuru === "aday" && (
            <p id="giris-alternatif-notu" className="text-[11px] text-ikincil/70 leading-snug">
              {t("alternatifGirisNotu")}
            </p>
        )}

        <Buton
          tur="buton"
          type="submit"
          varyant="ana"
          boyut="blok"
          ikon={mod === "giris" ? "login" : "person_add"}
          yukleniyor={isGonderiliyor}
          disabled={isGonderiliyor || (mod === "kayit" && !turnstileToken)}
          aria-describedby={mod === "kayit" && !turnstileToken ? "turnstile-bekleniyor" : undefined}
          sinif="mt-2"
        >
          {isGonderiliyor
            ? t("islemYapiliyor")
            : mod === "giris"
            ? t("girisYap")
            : t("hesapOlustur")}
        </Buton>
        {mod === "kayit" && !turnstileToken && (
          <p id="turnstile-bekleniyor" className="text-[11px] text-ikincil/70 leading-snug -mt-2">
            {t("guvenlikDogrulamasiBekleniyor")}
          </p>
        )}

      </form>
      </div>
    </div>
  );
}
