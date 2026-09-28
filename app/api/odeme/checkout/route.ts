import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiHatasi, apiJson } from "@/lib/api/yanit";
import { sirketUyeliginiDogrula } from "@/lib/guvenlik/yetki";
import { odemeSaglayicisi } from "@/lib/odemeler/saglayici";

const istekSema = z.object({
  companyId: z.string().uuid(),
  packageId: z.string().uuid(),
  idempotencyKey: z.string().min(16).max(128).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = istekSema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiHatasi("Geçerli checkout bilgileri gerekli.", 400, "GECERSIZ_ISTEK");

  try {
    const { supabase } = await sirketUyeliginiDogrula(parsed.data.companyId, ["owner"]);
    const { data: paket, error: paketHatasi } = await supabase
      .from("packages")
      .select("id, price, currency, is_active")
      .eq("id", parsed.data.packageId)
      .eq("is_active", true)
      .single();
    if (paketHatasi || !paket) return apiHatasi("Paket bulunamadı veya satışa kapalı.", 404, "GECERSIZ_ISTEK");

    const idempotencyKey = parsed.data.idempotencyKey ?? randomUUID();
    const { data: siparis, error: siparisHatasi } = await supabase
      .from("orders")
      .upsert(
        {
          company_id: parsed.data.companyId,
          package_id: paket.id,
          amount: paket.price,
          currency: paket.currency,
          idempotency_key: idempotencyKey,
          status: "pending",
        },
        { onConflict: "idempotency_key" },
      )
      .select("id, amount, currency, status, idempotency_key")
      .single();
    if (siparisHatasi || !siparis) return apiHatasi("Sipariş oluşturulamadı.", 500);
    if (siparis.status !== "pending") {
      return apiHatasi("Bu sipariş yeniden checkout için uygun değil.", 409, "GECERSIZ_ISTEK");
    }

    try {
      const checkout = await odemeSaglayicisi().checkoutOlustur({
        orderId: siparis.id,
        amount: Number(siparis.amount),
        currency: siparis.currency,
        idempotencyKey: siparis.idempotency_key,
      });
      return apiJson({ basarili: true, siparis, checkout }, 201);
    } catch (error) {
      return apiHatasi(
        error instanceof Error ? error.message : "Ödeme sağlayıcısı kullanılamıyor.",
        503,
      );
    }
  } catch (error) {
    return apiHatasi(error instanceof Error ? error.message : "Checkout başlatılamadı.", 403);
  }
}
