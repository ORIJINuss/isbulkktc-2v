import createMiddleware from "next-intl/middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPathname, yonlendirme, type Yerel } from "./i18n/yonlendirme";

const intlMiddleware = createMiddleware(yonlendirme);
const korumaliYollar = [
  "/aday-profilim",
  "/aday/masam",
  "/isveren/yeni-ilan",
  "/isveren/panel",
  "/isveren/sirketim",
] as const;
const yerelKorumaliYollar = yonlendirme.locales.flatMap((yerel) =>
  korumaliYollar.map((yol) => getPathname({ locale: yerel, href: yol })),
);

function korumaliRotaMi(pathname: string): boolean {
  return yerelKorumaliYollar.some(
    (yerelYol) => pathname === yerelYol || pathname.startsWith(`${yerelYol}/`),
  );
}

function yereliBul(request: NextRequest): Yerel {
  const ilkParca = request.nextUrl.pathname.split("/")[1];
  const yolYereli = yonlendirme.locales.find((yerel) => yerel === ilkParca);
  if (yolYereli) return yolYereli;

  const cerezYereli = request.cookies.get("NEXT_LOCALE")?.value;
  return (
    yonlendirme.locales.find((yerel) => yerel === cerezYereli) ??
    yonlendirme.defaultLocale
  );
}

function girisYolunuBul(request: NextRequest, yerel: Yerel) {
  const girisUrl = request.nextUrl.clone();
  girisUrl.pathname = getPathname({ locale: yerel, href: "/giris" });
  girisUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return girisUrl;
}

export default async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  const protectedRoute = korumaliRotaMi(request.nextUrl.pathname);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    if (!protectedRoute) return response;
    if (!protectedRoute) return response;
    return NextResponse.redirect(
      girisYolunuBul(request, yereliBul(request)),
    );
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
    return NextResponse.redirect(
      girisYolunuBul(request, yereliBul(request)),
    );
  }

  if (data.user) {
    const { data: profil } = await supabase
      .from("profiles")
      .select("account_status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profil?.account_status === "suspended" || profil?.account_status === "deleted") {
      const loginUrl = girisYolunuBul(request, yereliBul(request));
      loginUrl.searchParams.set("auth_error", "account_disabled");
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|auth/callback|_next|_vercel|.*\\..*).*)",
    "/(tr|en|ru|he)/:path*"
  ]
};
