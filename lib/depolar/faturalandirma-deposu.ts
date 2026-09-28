import { rolKontrolluKullaniciGetir, sirketUyeliginiDogrula } from "@/lib/guvenlik/yetki";

export async function aktifPaketleriGetir() {
  const { supabase } = await rolKontrolluKullaniciGetir([
    "candidate",
    "employer",
    "admin",
    "super_admin",
  ]);
  const { data, error } = await supabase
    .from("packages")
    .select("id, code, name, description, price, currency, duration_days, package_entitlements(entitlement_code, quota)")
    .eq("is_active", true)
    .order("price", { ascending: true });

  if (error) throw new Error("Paketler alınamadı.");
  return data;
}

export async function sirketFaturalariGetir(sirketId: string) {
  const { supabase } = await sirketUyeliginiDogrula(sirketId, ["owner", "recruiter", "viewer"]);
  const { data, error } = await supabase
    .from("invoices")
    .select("id, order_id, invoice_number, amount, currency, issued_at, metadata, orders!inner(company_id, package_id, status)")
    .eq("orders.company_id", sirketId)
    .order("issued_at", { ascending: false });

  if (error) throw new Error("Faturalar alınamadı.");
  return data;
}

export async function sirketAbonelikleriniGetir(sirketId: string) {
  const { supabase } = await sirketUyeliginiDogrula(sirketId, ["owner", "recruiter", "viewer"]);
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, package_id, status, starts_at, ends_at, cancel_at_period_end, cancelled_at, packages(code, name, package_entitlements(entitlement_code, quota))")
    .eq("company_id", sirketId)
    .order("starts_at", { ascending: false });

  if (error) throw new Error("Abonelikler alınamadı.");
  return data;
}

export async function abonelikIptaliniPlanla(sirketId: string, abonelikId: string) {
  const { supabase } = await sirketUyeliginiDogrula(sirketId, ["owner"]);
  const { data, error } = await supabase
    .from("subscriptions")
    .update({ cancel_at_period_end: true })
    .eq("id", abonelikId)
    .eq("company_id", sirketId)
    .in("status", ["trialing", "active", "past_due"])
    .select("id, status, ends_at, cancel_at_period_end")
    .single();

  if (error) throw new Error("Abonelik iptali planlanamadı.");
  return data;
}

export async function sirketSiparisleriniGetir(sirketId: string) {
  const { supabase } = await sirketUyeliginiDogrula(sirketId, ["owner", "recruiter", "viewer"]);
  const { data, error } = await supabase
    .from("orders")
    .select("id, package_id, amount, currency, status, provider, provider_reference, created_at, updated_at")
    .eq("company_id", sirketId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Siparişler alınamadı.");
  return data;
}
