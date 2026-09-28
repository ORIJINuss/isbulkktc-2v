import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { hizmetRoluIcinSupabaseOlustur } from "@/lib/supabase/sunucu-istemci";

type WebhookOlayi = {
  id?: string;
  provider?: string;
  type?: string;
  orderId?: string;
  status?: "succeeded" | "failed" | "refunded";
};

function imzaGecerliMi(govde: string, imza: string, gizli: string) {
  const beklenen = createHmac("sha256", gizli).update(govde).digest("hex");
  const gelen = imza.trim().replace(/^sha256=/, "");
  if (!/^[a-f0-9]{64}$/i.test(gelen)) return false;
  return timingSafeEqual(Buffer.from(beklenen, "hex"), Buffer.from(gelen, "hex"));
}

export async function POST(istek: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();
  const signature = istek.headers.get("x-payment-signature");
  if (!secret || !signature) {
    return NextResponse.json({ basarili: false, hata: "Webhook yapılandırılmamış." }, { status: 503 });
  }

  const rawBody = await istek.text();
  if (!imzaGecerliMi(rawBody, signature, secret)) {
    return NextResponse.json({ basarili: false, hata: "Geçersiz webhook imzası." }, { status: 401 });
  }

  let olay: WebhookOlayi;
  try {
    olay = JSON.parse(rawBody) as WebhookOlayi;
  } catch {
    return NextResponse.json({ basarili: false, hata: "Geçersiz webhook gövdesi." }, { status: 400 });
  }

  if (!olay.id || !olay.provider || !olay.orderId || !olay.status) {
    return NextResponse.json({ basarili: false, hata: "Webhook alanları eksik." }, { status: 400 });
  }

  const supabase = await hizmetRoluIcinSupabaseOlustur();
  const { error: eventError } = await supabase.from("payment_events").insert({
    order_id: olay.orderId,
    provider: olay.provider,
    provider_event_id: olay.id,
    event_type: olay.type ?? `payment.${olay.status}`,
    payload: olay,
  });

  if (eventError?.code === "23505") {
    return NextResponse.json({ basarili: true, yinelenen: true });
  }
  if (eventError) {
    return NextResponse.json({ basarili: false, hata: "Webhook kaydedilemedi." }, { status: 500 });
  }

  const orderStatus = olay.status === "succeeded" ? "paid" : olay.status === "refunded" ? "refunded" : "failed";
  const { error: orderError } = await supabase
    .from("orders")
    .update({ status: orderStatus, provider: olay.provider, provider_reference: olay.id })
    .eq("id", olay.orderId)
    .in("status", olay.status === "refunded" ? ["paid"] : ["pending"]);

  if (orderError) {
    await supabase
      .from("payment_events")
      .delete()
      .eq("provider", olay.provider)
      .eq("provider_event_id", olay.id);
    return NextResponse.json({ basarili: false, hata: "Sipariş durumu güncellenemedi." }, { status: 500 });
  }

  if (orderStatus === "paid") {
    const { data: order } = await supabase
      .from("orders")
      .select("id, company_id, package_id, amount, currency")
      .eq("id", olay.orderId)
      .maybeSingle();

    if (order?.package_id) {
      const invoiceNumber = `INV-${new Date().getUTCFullYear()}-${order.id.slice(0, 8).toUpperCase()}`;
      const { error: invoiceError } = await supabase.from("invoices").upsert(
        {
          order_id: order.id,
          invoice_number: invoiceNumber,
          amount: order.amount,
          currency: order.currency,
          metadata: { provider: olay.provider, provider_event_id: olay.id },
        },
        { onConflict: "order_id" },
      );
      if (invoiceError) {
        return NextResponse.json({ basarili: false, hata: "Fatura oluşturulamadı." }, { status: 500 });
      }

      const { data: paket } = await supabase
        .from("packages")
        .select("duration_days")
        .eq("id", order.package_id)
        .maybeSingle();
      if (paket) {
        const startsAt = new Date().toISOString();
        const endsAt = new Date(Date.now() + paket.duration_days * 86400000).toISOString();
        const { error: subscriptionError } = await supabase.from("subscriptions").insert({
          company_id: order.company_id,
          package_id: order.package_id,
          status: "active",
          starts_at: startsAt,
          ends_at: endsAt,
          provider_reference: olay.id,
        });
        if (subscriptionError && subscriptionError.code !== "23505") {
          return NextResponse.json({ basarili: false, hata: "Abonelik etkinleştirilemedi." }, { status: 500 });
        }
      }
    }
  } else if (orderStatus === "refunded") {
    const { error: cancellationError } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("provider_reference", olay.id)
      .in("status", ["trialing", "active", "past_due"]);
    if (cancellationError) {
      return NextResponse.json({ basarili: false, hata: "İade sonrası abonelik kapatılamadı." }, { status: 500 });
    }
  }

  return NextResponse.json({ basarili: true });
}
