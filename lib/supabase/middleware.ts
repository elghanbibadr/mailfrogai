import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() validates the token with Supabase; never trust getSession() on the server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const redirect = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  const protectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");
  if (!user && protectedRoute) return redirect("/login");
  if (user && (pathname === "/login" || pathname === "/signup")) return redirect("/dashboard");

  // Route signed-in users into onboarding until they've completed it, and away
  // from it once they have — one extra query, only on the routes that need it.
  if (user && protectedRoute) {
    const { data: profile } = await supabase.from("profiles").select("onboarded").eq("id", user.id).maybeSingle();
    const onboarded = profile?.onboarded ?? true; // fail open: don't lock a user out over a transient read error

    if (!onboarded && pathname.startsWith("/dashboard")) return redirect("/onboarding");
    if (onboarded && pathname.startsWith("/onboarding")) return redirect("/dashboard");
  }

  return response;
}