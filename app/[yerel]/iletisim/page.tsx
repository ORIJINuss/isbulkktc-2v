import { getTranslations } from "next-intl/server";
import BilgiSayfasi from "@/bilesenler/genel/BilgiSayfasi";

const WHATSAPP_NUMARA = "905391316421";

export default async function IletisimSayfasi({ params }: { params: { yerel: string } }) {
  const t = await getTranslations({ locale: params.yerel, namespace: "iletisim" });
  const a = await getTranslations({ locale: params.yerel, namespace: "altbilgi" });
  const whatsappBaglanti = `https://wa.me/${WHATSAPP_NUMARA}?text=${encodeURIComponent(a("whatsappMesaj"))}`;

  return (
    <div>
      <BilgiSayfasi
        baslik={t("baslik")}
        ikon="support_agent"
        aciklama={t("aciklama")}
        maddeler={[t("madde")]}
      />
      <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 sm:pb-16">
        <a
          href={whatsappBaglanti}
          target="_blank"
          rel="noreferrer noopener"
          className="buton-ana inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-etiket-md"
        >
          <span className="msimge text-base" aria-hidden="true">
            chat
          </span>
          {t("whatsappEylem")}
        </a>
      </div>
    </div>
  );
}
