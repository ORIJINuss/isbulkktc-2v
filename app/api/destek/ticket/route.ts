import { NextRequest } from "next/server";
import { z } from "zod";
import { apiHatasi, apiJson } from "@/lib/api/yanit";
import { kimlikliKullaniciGetir, YetkiHatasi } from "@/lib/guvenlik/yetki";

const ticketSema = z.object({
  konu: z.string().trim().min(3).max(160),
  aciklama: z.string().trim().min(10).max(5000),
  oncelik: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

export async function POST(request: NextRequest) {
  try {
    const { supabase, kullanici } = await kimlikliKullaniciGetir();
    const veri = ticketSema.safeParse(await request.json());
    if (!veri.success) return apiHatasi("Destek talebi geçersiz.", 400, "GECERSIZ_ISTEK");

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        requester_id: kullanici.id,
        subject: veri.data.konu,
        description: veri.data.aciklama,
        priority: veri.data.oncelik,
      })
      .select("id, status, created_at")
      .single();
    if (error) return apiHatasi("Destek talebi oluşturulamadı.", 500);
    return apiJson({ basarili: true, talep: data }, 201);
  } catch (error) {
    if (error instanceof YetkiHatasi) return apiHatasi(error.message, error.durum, "GECERSIZ_ISTEK");
    return apiHatasi("Destek talebi oluşturulamadı.", 500);
  }
}
