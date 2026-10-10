import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_PATH = "/kalaja-cabb0da6";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Do not run logic between createServerClient and getUser — it refreshes
  // the session token and must run on every request that touches auth.
  let {
    data: { user },
  } = await supabase.auth.getUser();

  // Anyone can create a Supabase account, so a session only counts if the account is on the
  // admins list (see supabase/schema.sql). Any other session is ended here.
  if (user) {
    const { data: admin } = await supabase.rpc("is_admin");
    if (admin !== true) {
      await supabase.auth.signOut({ scope: "local" });
      user = null;
    }
  }

  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === `${ADMIN_PATH}/login`;

  // A redirect has to carry the refreshed (or cleared) session cookies too.
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const response = NextResponse.redirect(url);
    for (const cookie of supabaseResponse.cookies.getAll()) {
      response.cookies.set(cookie);
    }
    return response;
  };

  if (!isLoginRoute && !user) {
    return redirectTo(`${ADMIN_PATH}/login`);
  }

  if (isLoginRoute && user) {
    return redirectTo(ADMIN_PATH);
  }

  return supabaseResponse;
}
