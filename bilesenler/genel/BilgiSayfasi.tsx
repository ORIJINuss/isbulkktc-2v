import { Link } from "@/i18n/yonlendirme";

type BilgiSayfasiProps = {
  baslik: string;
  aciklama: string;
  ikon: string;
  maddeler: string[];
};

export default function BilgiSayfasi({
  baslik,
  aciklama,
  ikon,
  maddeler,
}: BilgiSayfasiProps) {
  return (
    <section
      aria-labelledby="bilgi-sayfasi-baslik"
      className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16"
    >
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)] lg:gap-7">
        <header className="mineral-kart relative isolate overflow-hidden rounded-[1.75rem] p-6 sm:rounded-[2rem] sm:p-10 lg:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -end-20 -top-24 -z-10 h-64 w-64 rounded-full bg-ana-kapsayici/70 blur-3xl"
          />
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-ana-outline/30 bg-ana-kapsayici shadow-mineral-dosye sm:h-16 sm:w-16">
            <span className="msimge text-ana text-3xl sm:text-4xl" aria-hidden="true">
              {ikon}
            </span>
          </div>
          <h1
            id="bilgi-sayfasi-baslik"
            className="mt-7 max-w-2xl font-haber text-3xl font-black tracking-tight text-ikincil sm:text-5xl sm:leading-[1.08]"
          >
            {baslik}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ikincil/75 sm:text-lg">
            {aciklama}
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5 sm:mt-10">
            <Link
              href="/ilan-ara"
              className="buton-ana inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-etiket-md"
            >
              İlanları keşfet
              <span className="msimge text-base rtl:-scale-x-100" aria-hidden="true">arrow_forward</span>
            </Link>
            <Link
              href="/iletisim"
              className="buton-ikincil inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-etiket-md"
            >
              Bize ulaşın
              <span className="msimge text-base" aria-hidden="true">support_agent</span>
            </Link>
          </div>
        </header>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:gap-4">
          {maddeler.map((madde, index) => (
            <li
              key={madde}
              className="group flex min-h-24 items-start gap-3.5 rounded-2xl border border-cizgi-degisken/70 bg-yüzey/80 p-4 shadow-mineral-dosye transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-ana-outline/50 hover:shadow-mineral-yukseltilmis sm:p-5"
            >
              <span
                aria-hidden="true"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ana-kapsayici font-mono text-xs font-bold tabular-nums text-ana"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="pt-1 text-sm leading-relaxed text-ikincil sm:text-base">
                {madde}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
