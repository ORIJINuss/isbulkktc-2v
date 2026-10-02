import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { apiHatasi, apiJson } from "@/lib/api/yanit";
import {
  rolKontrolluKullaniciGetir,
  sirketUyeliginiDogrula,
  YetkiHatasi,
} from "@/lib/guvenlik/yetki";
import { odemeSaglayicisi } from "@/lib/odemeler/saglayici";

const ortakIstekSema = z.object({
  companyId: z.string().uuid(),
  idempotencyKey: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/).optional(),
  locale: z.enum(["tr", "en", "ru", "he"]).default("tr"),
});
const istekSema = z.union([
  ortakIstekSema.extend({ packageId: z.string().uuid() }),
  ortakIstekSema.extend({ packageCode: z.string().min(1).max(64) }),
]);

export async function GET() {
  try {
    const { supabase, kullanici } = await rolKontrolluKullaniciGetir(["employer"]);
    const { data, error } = await supabase
      .from("company_members")
      .select("company_id, companies!inner(company_name)")
      .eq("user_id", kullanici.id)
      .eq("member_role", "owner");

    if (error) return apiHatasi("Şirketleriniz alınamadı.", 500);

    const sirketler = (data ?? []).flatMap((uyelik) => {
      const iliski = uyelik.companies;
      const sirket = Array.isArray(iliski) ? iliski[0] : iliski;
      return sirket
        ? [{ id: uyelik.company_id, ad: sirket.company_name }]
        : [];
    });

    return apiJson({ sirketler });
  } catch (error) {
    if (error instanceof YetkiHatasi) {
      return apiHatasi(error.message, error.durum);
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const parsed = istekSema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiHatasi("Geçerli checkout bilgileri gerekli.", 400, "GECERSIZ_ISTEK");

  try {
    const { supabase } = await sirketUyeliginiDogrula(parsed.data.companyId, ["owner"]);
    let paketSorgusu = supabase
      .from("packages")
      .select("id, price, currency, is_active")
      .eq("is_active", true);
    paketSorgusu = "packageId" in parsed.data
      ? paketSorgusu.eq("id", parsed.data.packageId)
      : paketSorgusu.eq("code", parsed.data.packageCode);
    const { data: paket, error: paketHatasi } = await paketSorgusu.single();
    if (paketHatasi || !paket) return apiHatasi("Paket bulunamadı veya satışa kapalı.", 404, "GECERSIZ_ISTEK");

    const idempotencyKey = parsed.data.idempotencyKey ?? randomUUID();
    const { data: siparis, error: siparisHatasi } = await supabase.rpc("create_pending_order", {
      p_company_id: parsed.data.companyId,
      p_package_id: paket.id,
      p_idempotency_key: idempotencyKey,
    });
    if (siparisHatasi?.message === "idempotency_key_conflict") {
      return apiHatasi("Idempotency anahtarı başka bir siparişe ait.", 409, "GECERSIZ_ISTEK");
    }
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
        locale: parsed.data.locale,
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
