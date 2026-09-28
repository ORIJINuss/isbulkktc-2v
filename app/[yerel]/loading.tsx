import { getTranslations } from "next-intl/server";

export default async function YerelYukleniyor() {
  const t = await getTranslations("genel");

  return (
    <div
      className="mx-auto flex min-h-[50vh] w-full max-w-7xl items-center justify-center px-6 py-16"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="w-full max-w-3xl space-y-4" role="status">
        <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-yüzey-kapsayici" />
        <div className="h-5 w-full max-w-xl animate-pulse rounded-xl bg-yüzey-kapsayici" />
        <div className="grid gap-4 pt-6 sm:grid-cols-3">
          {[1, 2, 3].map((kart) => (
            <div
              key={kart}
              className="h-32 animate-pulse rounded-2xl bg-yüzey-kapsayici"
            />
          ))}
        </div>
        <span className="sr-only">{t("sayfaYukleniyor")}</span>
      </div>
    </div>
  );
}
