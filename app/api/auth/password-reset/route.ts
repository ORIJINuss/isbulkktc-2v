import { NextRequest } from "next/server";
import { z } from "zod";
import { apiHatasi, apiJson } from "@/lib/api/yanit";
import { sunucuIcinSupabaseOlustur } from "@/lib/supabase/sunucu-istemci";

const istekSema = z.object({
  email: z.string().email(),
  yerel: z.enum(["tr", "en", "ru", "he"]).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = istekSema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiHatasi("Geçerli bir e-posta adresi girin.", 400, "GECERSIZ_ISTEK");
  }

  const yerel = parsed.data.yerel ?? "tr";
  const supabase = await sunucuIcinSupabaseOlustur();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${request.nextUrl.origin}/auth/callback?next=/${yerel}/giris`,
  });

  if (error) return apiHatasi("Şifre sıfırlama e-postası gönderilemedi.", 400);
  return apiJson({ basarili: true });
}
