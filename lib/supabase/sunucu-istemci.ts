"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  supabaseHizmetRoluOrtamYapilandir,
  supabaseOrtamYapilandir,
} from "@/lib/ortam/ortam";
import { log } from "@/lib/sunucu/loglama";

type SupabaseCookie = { name: string; value: string; options?: CookieOptions };

export async function sunucuIcinSupabaseOlustur() {
  const cookieSakla = await cookies();
  const { url, anonAnahtar } = supabaseOrtamYapilandir();

  return createServerClient(url, anonAnahtar, {
    cookies: {
      getAll: () => cookieSakla.getAll(),
      setAll(cookiesToSet: SupabaseCookie[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieSakla.set(name, value, options));
        } catch (hata) {
          log.uyari("Supabase oturum çerezleri yazılamadı.", { hata: String(hata) });
        }
      },
    },
  });
}

export async function hizmetRoluIcinSupabaseOlustur() {
  const { url, servisAnahtari } = supabaseHizmetRoluOrtamYapilandir();

  return createServerClient(url, servisAnahtari, {
    cookies: {
      getAll: () => [],
      setAll: () => undefined,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
