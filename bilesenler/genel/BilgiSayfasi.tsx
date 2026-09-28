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
    <section className="py-10 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6">
      <div className="mineral-kart p-6 sm:p-10 space-y-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-ana-kapsayici grid place-items-center">
            <span className="msimge text-ana text-3xl">{ikon}</span>
          </div>
          <div>
            <h1 className="font-haber font-black text-3xl sm:text-5xl text-ikincil tracking-tight">
              {baslik}
            </h1>
            <p className="mt-3 text-ikincil/75 leading-relaxed">{aciklama}</p>
          </div>
        </div>
        <div className="grid gap-3">
          {maddeler.map((madde) => (
            <div
              key={madde}
              className="flex items-start gap-3 rounded-2xl bg-ikincil-kapsayici/50 p-4"
            >
              <span className="msimge text-ana mt-0.5">check_circle</span>
              <p className="text-sm text-ikincil leading-relaxed">{madde}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/ilan-ara"
            className="buton-ana text-etiket-md px-4 py-2.5 rounded-xl"
          >
            İlanları keşfet
          </Link>
          <Link
            href="/iletisim"
            className="buton-ikincil text-etiket-md px-4 py-2.5 rounded-xl"
          >
            Bize ulaşın
          </Link>
        </div>
      </div>
    </section>
  );
}
