import { NextRequest } from "next/server";
import { apiJson } from "@/lib/api/yanit";
import { sunucuIcinSupabaseOlustur } from "@/lib/supabase/sunucu-istemci";

export async function POST(_request: NextRequest) {
  const supabase = await sunucuIcinSupabaseOlustur();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return apiJson({ basarili: false, hata: "Oturum kapatılamadı." }, 500);
  }

  return apiJson({ basarili: true });
}
