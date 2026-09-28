import { NextRequest } from "next/server";
import { z } from "zod";
import { apiHatasi, apiJson } from "@/lib/api/yanit";
import { canliIlanGetir } from "@/lib/depolar/ilan-arama-deposu";
import { OrtamYapilandirmaHatasi } from "@/lib/ortam/ortam";
import { istekBaglamiOlustur, log } from "@/lib/sunucu/loglama";

export const dynamic = "force-dynamic";

const SlugSema = z
  .string()
  .trim()
  .min(2, "Ilan adresi gecersiz")
  .max(160, "Ilan adresi gecersiz")
  .regex(
    /^[\p{L}\p{N}\p{M}_.-]+$/u,
    "Ilan adresi gecersiz"
  );

type Props = {
  params: { slug: string };
};

export async function GET(request: NextRequest, { params }: Props) {
  const baglam = istekBaglamiOlustur(request);

  const slug = SlugSema.safeParse(params.slug);
  if (!slug.success) {
    return apiHatasi("Ilan adresi gecersiz.", 400, "GECERSIZ_ISTEK", baglam);
  }

  try {
    const ilan = await canliIlanGetir(slug.data);
    if (!ilan) {
      return apiHatasi(
        "Bu ilan yayinda degil veya basvuru suresi dolmus.",
        404,
        "GECERSIZ_ISTEK",
        baglam
      );
    }
    return apiJson({ basarili: true, ilan }, 200, baglam);
  } catch (hata) {
    if (hata instanceof OrtamYapilandirmaHatasi) {
      log.hata("ilanlar/[slug] GET: ortam yapilandirmasi eksik", hata, baglam);
      return apiHatasi(
        "Ilan servisi su anda yapilandirilmamis.",
        503,
        "YAPILANDIRMA_HATASI",
        baglam
      );
    }
    log.hata("ilanlar/[slug] GET: ilan alinamadi", hata, {
      ...baglam,
      slug: slug.data,
    });
    return apiHatasi(
      "Ilan bilgisi alinamadi.",
      500,
      "SUNUCU_HATASI",
      baglam
    );
  }
}
