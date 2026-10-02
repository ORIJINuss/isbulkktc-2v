import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/yonlendirme";
import { kamuyaAcikSirketleriGetir } from "@/lib/depolar/isveren-deposu";
import { OrtamYapilandirmaHatasi } from "@/lib/ortam/ortam";
import { log } from "@/lib/sunucu/loglama";

export const dynamic = "force-dynamic";

export default async function SirketlerSayfasi({ params }: { params: { yerel: string } }) {
  const t = await getTranslations({ locale: params.yerel, namespace: "workspace" });
  const arama = await getTranslations({ locale: params.yerel, namespace: "ilanAra" });
  const g = await getTranslations({ locale: params.yerel, namespace: "genel" });
  let sirketler: Awaited<ReturnType<typeof kamuyaAcikSirketleriGetir>> = [];
  let yuklemeHatasi = false;
  let yapilandirmaEksik = false;

  try {
    sirketler = await kamuyaAcikSirketleriGetir();
  } catch (error) {
    sirketler = [];
    yuklemeHatasi = true;
    yapilandirmaEksik = error instanceof OrtamYapilandirmaHatasi;
    log.hata("Şirket dizini yüklenemedi.", error, { yerel: params.yerel });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <header className="max-w-3xl space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-ana-outline/40 bg-ana-kapsayici/70 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ana">
          <span className="msimge" aria-hidden="true">verified</span>
          {t("verifiedCompany")}
        </span>
        <h1 className="font-haber text-3xl font-black tracking-tight text-ikincil sm:text-4xl">{t("companyDirectory")}</h1>
        <p className="leading-relaxed text-ikincil/75">{t("companyDirectoryDescription")}</p>
        <p className="text-sm leading-relaxed text-ikincil/65">{t("verifiedCompanyDescription")}</p>
      </header>
      {yuklemeHatasi ? (
        <section
          role="alert"
          className="mineral-kart flex flex-col items-center gap-4 rounded-3xl border border-hata/25 bg-hata-kapsayici/30 px-6 py-10 text-center sm:px-10"
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-hata-kapsayici text-hata-900" aria-hidden="true">
            <span className="msimge text-2xl">cloud_off</span>
          </span>
          <div className="max-w-xl space-y-2">
            <h2 className="text-xl font-bold text-ikincil">{t("companyDirectory")}</h2>
            <p className="text-sm leading-relaxed text-ikincil/75">
              {yapilandirmaEksik
                ? arama("servisYapilandirilmamis")
                : arama("sonucHatasiAciklama")}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/ilan-ara" className="buton-ana">
              <span className="msimge" aria-hidden="true">search</span>
              {g("tumunuGetir")}
            </Link>
            <Link href="/sirketler" className="buton-ikincil">
              <span className="msimge" aria-hidden="true">refresh</span>
              {arama("yenidenDene")}
            </Link>
          </div>
        </section>
      ) : sirketler.length === 0 ? (
        <section
          aria-label={t("companyDirectory")}
          className="mineral-kart flex flex-col items-center gap-5 rounded-3xl border border-dashed border-ana-outline/50 bg-yüzey-kapsayici-alt/40 px-6 py-10 text-center sm:px-10 sm:py-12"
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ana-kapsayici/15 text-ana" aria-hidden="true">
            <span className="msimge text-2xl">apartment</span>
          </span>
          <p className="max-w-xl text-sm leading-relaxed text-ikincil/75">
            {t("noVerifiedCompanies")}
          </p>
          <Link href="/isveren/sirket-kaydi" className="buton-ana">
            <span className="msimge" aria-hidden="true">business_center</span>
            {t("companyRegistration")}
          </Link>
        </section>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sirketler.map((sirket) => (
            <li key={sirket.id}>
              <Link href={{ pathname: "/sirket/[slug]", params: { slug: sirket.slug } }} className="mineral-kart flex h-full items-center gap-4 rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-ana/40">
                {sirket.logo_url ? (
                  <Image src={sirket.logo_url} alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-xl border border-cizgi-degisken bg-yüzey object-contain p-2" />
                ) : (
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-ana-kapsayici font-haber text-xl font-black text-ana">
                    {sirket.company_name.slice(0, 1)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-haber text-lg font-bold text-ikincil">{sirket.company_name}</span>
                  <span className="mt-1 block truncate text-sm text-ikincil/65">{sirket.location || t("locationMissing")}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ana">
                    <span className="msimge text-sm" aria-hidden="true">verified</span>
                    {t("verifiedCompany")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
