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
  }>;
};

export function odemeSaglayicisi(): OdemeSaglayicisi {
  throw new Error(
    "Ödeme sağlayıcısı yapılandırılmamış. Checkout başlatılmadan önce güvenilir bir provider adapter’ı yapılandırılmalıdır.",
  );
}

export function odemeSaglayicisiGerekli(): never {
  throw new Error(
    "Ödeme sağlayıcısı yapılandırılmamış. Webhook imza doğrulaması olmadan ödeme başarılı kabul edilemez.",
  );
}
