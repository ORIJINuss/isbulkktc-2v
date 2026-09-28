"use client";

import { createBrowserClient } from "@supabase/ssr";
import { tarayiciSupabaseOrtamYapilandir } from "@/lib/ortam/ortam";

export function tarayiciIcinSupabaseOlustur() {
  const { url, anonAnahtar } = tarayiciSupabaseOrtamYapilandir();

  return createBrowserClient(url, anonAnahtar);
}
