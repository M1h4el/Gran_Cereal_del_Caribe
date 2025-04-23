import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Ignorar rutas estáticas y API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Redirigir al dashboard si ya está logueado y va a la raíz
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Si no hay token y va a rutas protegidas
  const protectedPaths = ["/dashboard", "/admin", "/perfil"];
  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (!token && isProtected) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/admin/:path*", "/perfil"],
};