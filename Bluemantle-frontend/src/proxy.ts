import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  { prefix: "/student", roles: ["student"] },
  { prefix: "/teacher/live", roles: ["teacher", "admin", "owner"] },
  { prefix: "/teacher", roles: ["teacher"] },
  { prefix: "/admin", roles: ["admin", "owner"] },
];

const dashboardPathByRole: Record<string, string> = {
  student: "/student",
  teacher: "/teacher",
  admin: "/admin",
  owner: "/admin",
};

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("user_role")?.value;
  const { pathname } = request.nextUrl;
  const isSwitchAccount = pathname === "/" && request.nextUrl.searchParams.get("switch") === "1";
  const matchedRoute = protectedRoutes.find((route) => pathname.startsWith(route.prefix));

  if (isSwitchAccount) {
    const response = NextResponse.next();
    response.cookies.delete("token");
    response.cookies.delete("user_role");
    response.cookies.delete("user_name");
    return response;
  }

  if (matchedRoute && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (pathname === "/" && token && role && dashboardPathByRole[role]) {
    const url = request.nextUrl.clone();
    url.pathname = dashboardPathByRole[role];
    return NextResponse.redirect(url);
  }

  if (matchedRoute && token && role && !matchedRoute.roles.includes(role)) {
    const url = request.nextUrl.clone();
    url.pathname = dashboardPathByRole[role] || "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*", "/admin/:path*", "/"],
};
