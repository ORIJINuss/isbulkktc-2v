import { Link, redirect } from "@/i18n/yonlendirme";
import { adayBasvurulariniGetir, adayCvBelgeleriniGetir, adayProfiliniGetir, kayitliIlanlariGetir } from "@/lib/depolar/aday-deposu";
import { YetkiHatasi, rolKontrolluKullaniciGetir } from "@/lib/guvenlik/yetki";
import { getTranslations } from "next-intl/server";

type Props = { params: { yerel: string } };

function sirketAdiAl(relation: unknown): string {
  const sirket = Array.isArray(relation) ? relation[0] : relation;
  if (
    typeof sirket === "object" &&
    sirket !== null &&
    "company_name" in sirket &&
    typeof sirket.company_name === "string"
  ) {
    return sirket.company_name;
  }
  return "";
}

async function adayYetkisiniDogrula(locale: string) {
  try {
    await rolKontrolluKullaniciGetir(["candidate"]);
  } catch (error) {
    if (error instanceof YetkiHatasi) {
      redirect({ href: error.durum === 401 ? "/giris" : "/", locale });
    }
    throw error;
  }
}

export default async function AdayCalismaMasasi({ params }: Props) {
  await adayYetkisiniDogrula(params.yerel);
  const [profil, basvurular, kayitliIlanlar, cvBelgeleri] = await Promise.all([
    adayProfiliniGetir(),
    adayBasvurulariniGetir(),
    kayitliIlanlariGetir(),
    adayCvBelgeleriniGetir(),
  ]);
  const t = await getTranslations({ locale: params.yerel, namespace: "workspace" });

  const mulakatSayisi = basvurular.filter((basvuru) => basvuru.status === "interview").length;
  const kartlar = [
    { etiket: t("applications"), deger: basvurular.length, ikon: "send" },
    { etiket: t("interviews"), deger: mulakatSayisi, ikon: "groups" },
    { etiket: t("savedJobs"), deger: kayitliIlanlar.length, ikon: "bookmark" },
    { etiket: t("documents"), deger: cvBelgeleri.length, ikon: "description" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-ana-outline/40 bg-ana-kapsayici/70 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ana">
            <span className="msimge" aria-hidden="true">person</span>
            {t("candidateWorkspace")}
          </span>
          <h1 className="font-haber text-3xl font-black tracking-tight text-ikincil sm:text-4xl">
            {t("candidateWelcome")}
          </h1>
          <p className="max-w-2xl leading-relaxed text-ikincil/75">
            {profil?.headline || t("profileSetupPrompt")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/ilan-ara" className="buton-ana">
            <span className="msimge me-1" aria-hidden="true">search</span>
            {t("findJobs")}
          </Link>
          <Link href="/aday-profilim" className="buton-ikincil">
            {t("manageProfile")}
          </Link>
        </div>
      </header>

      <section aria-label={t("candidateWorkspace")} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kartlar.map((kart) => (
          <article key={kart.etiket} className="mineral-kart rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-ikincil/70">
              <span className="msimge text-ana" aria-hidden="true">{kart.ikon}</span>
              {kart.etiket}
            </div>
            <p className="mt-3 font-haber text-3xl font-black tabular-nums text-ana">{kart.deger}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="mineral-kart rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-haber text-xl font-bold text-ikincil">{t("recentApplications")}</h2>
            <Link href="/aday-profilim" className="text-sm font-semibold text-ana hover:underline">
              {t("manageProfile")}
            </Link>
          </div>
          {basvurular.length === 0 ? (
            <div className="rounded-xl border border-dashed border-cizgi-degisken bg-yüzey-kapsayici-alt p-6 text-center">
              <span className="msimge text-3xl text-ana" aria-hidden="true">work_outline</span>
              <p className="mt-2 font-semibold text-ikincil">{t("noApplications")}</p>
              <Link href="/ilan-ara" className="buton-ana mt-4">
                {t("findJobs")}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-cizgi-degisken/70">
              {basvurular.slice(0, 6).map((basvuru) => {
                const ilan = Array.isArray(basvuru.job_posts)
                  ? basvuru.job_posts[0]
                  : basvuru.job_posts;
                return (
                  <li key={basvuru.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ikincil">
                        {ilan?.title ?? t("jobUnavailable")}
                      </p>
                      <p className="mt-1 text-sm text-ikincil/65">
                        {sirketAdiAl(ilan?.companies)}
                        {basvuru.created_at
                          ? ` · ${new Intl.DateTimeFormat(params.yerel).format(new Date(basvuru.created_at))}`
                          : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-ana-kapsayici px-3 py-1 text-xs font-semibold text-ana">
                      {t(`applicationStatus.${basvuru.status}`)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <section className="mineral-kart rounded-2xl p-5 sm:p-6">
            <h2 className="font-haber text-xl font-bold text-ikincil">{t("profile")}</h2>
            {profil ? (
              <div className="mt-4 space-y-3 text-sm">
                <p className="font-semibold text-ikincil">{profil.headline || t("profileHeadlineMissing")}</p>
                <p className="text-ikincil/70">{[profil.city, profil.country].filter(Boolean).join(", ") || t("locationMissing")}</p>
                <p className="line-clamp-4 leading-relaxed text-ikincil/70">{profil.summary || t("profileSummaryMissing")}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-ikincil/70">{t("profileSetupPrompt")}</p>
            )}
            <Link href="/aday-profilim" className="buton-ikincil mt-5 w-full">
              {t("manageProfile")}
            </Link>
          </section>

          <section className="mineral-kart rounded-2xl p-5 sm:p-6">
            <h2 className="font-haber text-xl font-bold text-ikincil">{t("savedJobs")}</h2>
            {kayitliIlanlar.length === 0 ? (
              <p className="mt-3 text-sm leading-relaxed text-ikincil/70">{t("noSavedJobs")}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {kayitliIlanlar.slice(0, 4).map((kayit) => {
                  const ilan = Array.isArray(kayit.job_posts)
                    ? kayit.job_posts[0]
                    : kayit.job_posts;
                  return (
                    <li key={kayit.id}>
                      <Link
                        href={ilan?.slug ? { pathname: "/ilan/[slug]", params: { slug: ilan.slug } } : "/ilan-ara"}
                        className="block rounded-xl border border-cizgi-degisken/70 p-3 text-sm font-semibold text-ikincil hover:border-ana/40 hover:text-ana"
                      >
                        {ilan?.title ?? t("jobUnavailable")}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
