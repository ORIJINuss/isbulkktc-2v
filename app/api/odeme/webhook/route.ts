import { NextResponse } from "next/server";
import { hizmetRoluIcinSupabaseOlustur } from "@/lib/supabase/sunucu-istemci";
import { odemeSaglayicisi } from "@/lib/odemeler/saglayici";

export async function POST(istek: Request) {
  const signature = istek.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ basarili: false, hata: "Webhook imzası eksik." }, { status: 400 });

  let olay: Awaited<ReturnType<ReturnType<typeof odemeSaglayicisi>["webhookDogrula"]>>;
  try {
    olay = await odemeSaglayicisi().webhookDogrula(await istek.text(), signature);
  } catch (error) {
    if (error instanceof Error && error.message === "Desteklenmeyen Stripe webhook olayı.") {
      return NextResponse.json({ basarili: true, atlandi: true });
    }
    return NextResponse.json({ basarili: false, hata: "Geçersiz webhook." }, { status: 401 });
  }

  const supabase = await hizmetRoluIcinSupabaseOlustur();
  if (olay.status === "succeeded") {
    const { error } = await supabase.rpc("apply_paid_order", {
      p_order_id: olay.orderId,
      p_provider: olay.provider,
      p_provider_reference: olay.providerReference,
      p_amount: (olay.amountTotal ?? 0) / 100,
      p_currency: olay.currency ?? "",
    });
    if (error) return NextResponse.json({ basarili: false, hata: "Ödeme siparişe uygulanamadı." }, { status: 500 });
  } else if (olay.status === "failed") {
    const { error } = await supabase.rpc("fail_pending_order", {
      p_order_id: olay.orderId,
      p_provider: olay.provider,
      p_provider_reference: olay.providerReference,
    });
    if (error) return NextResponse.json({ basarili: false, hata: "Sipariş durumu güncellenemedi." }, { status: 500 });
  }

  const { data: yeniOlay, error: olayHatasi } = await supabase.rpc("record_payment_event", {
    p_order_id: olay.orderId,
    p_provider: olay.provider,
    p_event_id: olay.providerEventId,
    p_event_type: olay.type,
    p_payload: {
      orderId: olay.orderId,
      status: olay.status,
      provider: olay.provider,
      providerReference: olay.providerReference,
      amountTotal: olay.amountTotal,
      currency: olay.currency,
      type: olay.type,
    },
  });
  if (olayHatasi) return NextResponse.json({ basarili: false, hata: "Webhook kaydedilemedi." }, { status: 500 });
  if (!yeniOlay) return NextResponse.json({ basarili: true, yinelenen: true });

  return NextResponse.json({ basarili: true });
}
