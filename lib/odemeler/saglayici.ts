import Stripe from "stripe";

export type OdemeDurumu = "pending" | "succeeded" | "failed" | "refunded";

export type OdemeIntent = {
  orderId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
};

export type OdemeSaglayicisi = {
  checkoutOlustur(intent: OdemeIntent): Promise<{ checkoutUrl: string; providerReference: string }>;
  webhookDogrula(rawBody: string, signature: string): Promise<{
    providerEventId: string;
    orderId: string;
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
      if (!Number.isSafeInteger(Math.round(intent.amount * 100)) || intent.amount < 0) {
        throw new Error("Geçersiz ödeme tutarı.");
      }
      const stripe = stripeOlustur();
      const session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          line_items: [{
            price_data: {
              currency: intent.currency.toLowerCase(),
              product_data: { name: "İşBulKKTC işveren paketi" },
              unit_amount: Math.round(intent.amount * 100),
            },
            quantity: 1,
          }],
          metadata: { orderId: intent.orderId },
          success_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/tr/ilan-paketleri?odeme=basarili&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/tr/ilan-paketleri?odeme=iptal edildi`,
        },
        { idempotencyKey: intent.idempotencyKey },
      );
      if (!session.url) throw new Error("Stripe checkout URL oluşturamadı.");
      return { checkoutUrl: session.url, providerReference: session.id };
    },
    async webhookDogrula(rawBody, signature) {
      const event = stripeOlustur().webhooks.constructEvent(rawBody, signature, webhookGizli());
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (!orderId) throw new Error("Stripe webhook orderId içermiyor.");
      const status: OdemeDurumu =
        event.type === "checkout.session.completed" && session.payment_status === "paid"
          ? "succeeded"
          : event.type === "checkout.session.async_payment_succeeded"
            ? "succeeded"
            : event.type === "checkout.session.expired"
              ? "failed"
              : "pending";
      return { providerEventId: event.id, orderId, status, provider: "stripe", type: event.type };
    },
  };
}

export function odemeSaglayicisiGerekli(): never {
  throw new Error("Ödeme sağlayıcısı yapılandırılmamış.");
}

export { webhookGizli };
