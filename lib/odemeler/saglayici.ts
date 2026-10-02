import Stripe from "stripe";
import { zorunluOrtamDegeri } from "@/lib/ortam/ortam";

export type OdemeDurumu = "pending" | "succeeded" | "failed" | "refunded";

export type OdemeIntent = {
  orderId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  locale?: "tr" | "en" | "ru" | "he";
};

export type OdemeSaglayicisi = {
  checkoutOlustur(intent: OdemeIntent): Promise<{ checkoutUrl: string; providerReference: string }>;
  webhookDogrula(rawBody: string, signature: string): Promise<{
    providerEventId: string;
    orderId: string;
    providerReference: string;
    amountTotal: number | null;
    currency: string | null;
    status: OdemeDurumu;
    provider: string;
    type: string;
  }>;
};

function stripeOlustur(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) throw new Error("Stripe ödeme sağlayıcısı yapılandırılmamış.");
  return new Stripe(secretKey);
}

function webhookGizli(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error("Stripe webhook yapılandırılmamış.");
  return secret;
}

export function odemeSaglayicisi(): OdemeSaglayicisi {
  return {
    async checkoutOlustur(intent) {
      const amountInMinorUnits = Math.round(intent.amount * 100);
      if (!Number.isSafeInteger(amountInMinorUnits) || amountInMinorUnits <= 0) {
        throw new Error("Geçersiz ödeme tutarı.");
      }
      if (!/^[A-Z]{3}$/i.test(intent.currency)) {
        throw new Error("Geçersiz para birimi.");
      }
      const stripe = stripeOlustur();
      const siteUrl = zorunluOrtamDegeri(
        "NEXT_PUBLIC_SITE_URL",
        "NEXT_PUBLIC_SITE_URL",
        "http://localhost:3000",
      ).replace(/\/+$/, "");
      const locale = intent.locale ?? "tr";
      const session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          line_items: [{
            price_data: {
              currency: intent.currency.toLowerCase(),
              product_data: { name: "İşBulKKTC işveren paketi" },
              unit_amount: amountInMinorUnits,
            },
            quantity: 1,
          }],
          metadata: { orderId: intent.orderId },
          success_url: `${siteUrl}/${locale}/ilan-paketleri?odeme=basarili&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${siteUrl}/${locale}/ilan-paketleri?odeme=iptal`,
        },
        { idempotencyKey: intent.idempotencyKey },
      );
      if (!session.url) throw new Error("Stripe checkout URL oluşturamadı.");
      return { checkoutUrl: session.url, providerReference: session.id };
    },
    async webhookDogrula(rawBody, signature) {
      const event = stripeOlustur().webhooks.constructEvent(rawBody, signature, webhookGizli());
      const supportedEvents = new Set([
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.async_payment_failed",
        "checkout.session.expired",
      ]);
      if (!supportedEvents.has(event.type)) {
        throw new Error("Desteklenmeyen Stripe webhook olayı.");
      }
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (!orderId) throw new Error("Stripe webhook orderId içermiyor.");
      const succeeded =
        event.type === "checkout.session.completed" && session.payment_status === "paid"
          || (event.type === "checkout.session.async_payment_succeeded" && session.payment_status === "paid");
      if (succeeded && (!Number.isSafeInteger(session.amount_total) || !session.currency)) {
        throw new Error("Stripe ödeme tutarı veya para birimi eksik.");
      }
      const status: OdemeDurumu = succeeded
        ? "succeeded"
        : event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired"
          ? "failed"
          : "pending";
      return {
        providerEventId: event.id,
        orderId,
        providerReference: session.id,
        amountTotal: session.amount_total,
        currency: session.currency?.toUpperCase() ?? null,
        status,
        provider: "stripe",
        type: event.type,
      };
    },
  };
}

export function odemeSaglayicisiGerekli(): never {
  throw new Error("Ödeme sağlayıcısı yapılandırılmamış.");
}

export { webhookGizli };
