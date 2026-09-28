import { NextResponse, type NextRequest } from "next/server";
import { sunucuIcinSupabaseOlustur } from "@/lib/supabase/sunucu-istemci";

function guvenliSonrakiYol(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/tr";
  return next;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = guvenliSonrakiYol(request.nextUrl.searchParams.get("next"));
  const hedef = new URL(next, request.url);

  if (!code) {
    hedef.searchParams.set("auth_error", "callback_code_missing");
    return NextResponse.redirect(hedef);
  }

  const supabase = await sunucuIcinSupabaseOlustur();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    hedef.searchParams.set("auth_error", "callback_failed");
  }

  return NextResponse.redirect(hedef);
}
