import { NextRequest } from "next/server";
import { apiHatasi, apiJson } from "@/lib/api/yanit";
import { cvYukle } from "@/lib/depolar/aday-deposu";
import { YetkiHatasi } from "@/lib/guvenlik/yetki";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const dosya = formData.get("file");
  if (!(dosya instanceof File)) {
    return apiHatasi("Bir CV dosyası seçin.", 400, "GECERSIZ_ISTEK");
  }

  try {
    return apiJson({ basarili: true, veri: await cvYukle(dosya) }, 201);
  } catch (error) {
    if (error instanceof YetkiHatasi) {
      return apiHatasi(error.message, error.durum, "GECERSIZ_ISTEK");
    }
    return apiHatasi(error instanceof Error ? error.message : "CV yüklenemedi.", 400);
  }
}
