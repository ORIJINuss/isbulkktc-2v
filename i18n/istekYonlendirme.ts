import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { yonlendirme, Yerel } from "./yonlendirme";

export default getRequestConfig(async ({ requestLocale }) => {
  const hedef = (await requestLocale) ?? "tr";

  if (!yonlendirme.locales.includes(hedef as Yerel)) {
    notFound();
  }

  const mesajlar = (await import(`./mesajlar/${hedef}.json`)).default;

  return {
    locale: hedef as Yerel,
    messages: mesajlar,
    defaultTranslationValues: {
      brk: () => "<br/>",
      link: (chunks) =>
        `<span class="text-ana underline decoration-cizgi-degisken underline-offset-4 hover:text-ana-kapsayici">${chunks}</span>`
    }
  };
});
