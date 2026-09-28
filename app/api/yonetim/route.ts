import { NextRequest } from "next/server";
import { apiHatasi, apiJson } from "@/lib/api/yanit";
import { YetkiHatasi } from "@/lib/guvenlik/yetki";
import { moderasyonDosyasiniGuncelle, yonetimOzetiniGetir } from "@/lib/depolar/yonetim-deposu";

export async function GET() {
  try {
    return apiJson({ basarili: true, ...(await yonetimOzetiniGetir()) });
  } catch (error) {
    if (error instanceof YetkiHatasi) return apiHatasi(error.message, error.durum, "GECERSIZ_ISTEK");
    return apiHatasi("Yönetim verileri alınamadı.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    if (
      typeof body?.dosyaId !== "string" ||
      !["reviewing", "resolved", "dismissed"].includes(body?.durum)
    ) {
      return apiHatasi("Moderasyon güncellemesi geçersiz.", 400, "GECERSIZ_ISTEK");
    }
    await moderasyonDosyasiniGuncelle(body.dosyaId, body.durum);
    return apiJson({ basarili: true });
  } catch (error) {
    if (error instanceof YetkiHatasi) return apiHatasi(error.message, error.durum, "GECERSIZ_ISTEK");
    return apiHatasi("Moderasyon dosyası güncellenemedi.", 500);
  }
}
