import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "canvas_sub2api_session";

export function proxy(request: NextRequest) {
    const publicBaseURL = process.env.SUB2API_PUBLIC_BASE_URL || "";
    if (!publicBaseURL.trim()) return NextResponse.next();
    if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
    const redirectURL = new URL(publicBaseURL);
    redirectURL.pathname = "/dashboard";
    redirectURL.searchParams.set("from", "canvas");
    return NextResponse.redirect(redirectURL);
}

export const config = {
    matcher: ["/((?!api|auth|_next|favicon.ico).*)"],
};
