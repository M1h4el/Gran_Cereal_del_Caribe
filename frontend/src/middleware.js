import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Si está logueado y trata de acceder a "/"
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Si no está logueado y trata de acceder a una ruta protegida
  if (!token && pathname !== "/") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// Aplicar middleware solo a ciertas rutas
export const config = {
  matcher: ["/", "/dashboard/:path*", "/admin/:path*", "/perfil"],
};