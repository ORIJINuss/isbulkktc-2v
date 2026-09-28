import createMiddleware from "next-intl/middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { yonlendirme } from "./i18n/yonlendirme";

const intlMiddleware = createMiddleware(yonlendirme);

export default async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  const protectedRoute = /\/(aday-profilim|aday\/masam|isveren\/(yeni-ilan|panel|sirketim))(?:\/|$)/.test(
    request.nextUrl.pathname,
  );
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (!protectedRoute) return response;
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${request.nextUrl.pathname.split("/")[1]}/giris`;
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  if (protectedRoute && !data.user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${request.nextUrl.pathname.split("/")[1]}/giris`;
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (data.user) {
    const { data: profil } = await supabase
      .from("profiles")
      .select("account_status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profil?.account_status === "suspended" || profil?.account_status === "deleted") {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${request.nextUrl.pathname.split("/")[1]}/giris`;
      loginUrl.searchParams.set("auth_error", "account_disabled");
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/(tr|en|ru|he)/:path*"
  ]
};
