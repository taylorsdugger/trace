import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, AUTH_COOKIE } from "@/lib/auth";

const PUBLIC = new Set(["/login"]);

// Cedar rebrand: old → new path mapping. Each entry maps a legacy prefix
// to its new base; trailing segments and query string are preserved.
const RENAMES: Array<[RegExp, string]> = [
  [/^\/entries(\/.*)?$/, "/trail"],
  [/^\/themes(\/.*)?$/, "/rings/all"],
  [/^\/reflection(\/.*)?$/, "/rings"],
  [/^\/traps(\/.*)?$/, "/tangles"],
  [/^\/api\/entries(\/.*)?$/, "/api/traces"],
  [/^\/api\/ai\/themes(\/.*)?$/, "/api/ai/rings"],
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  for (const [pattern, base] of RENAMES) {
    const m = pathname.match(pattern);
    if (m) {
      const url = req.nextUrl.clone();
      url.pathname = base + (m[1] ?? "");
      return NextResponse.redirect(url, 308);
    }
  }

  if (pathname.startsWith("/api/auth")) return NextResponse.next();
  if (PUBLIC.has(pathname)) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const ok = await verifyToken(token);
  if (ok) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)"],
};
