import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "canvas_sub2api_session";
const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function proxy(request: NextRequest) {
    if (!isProtectedPagePath(request.nextUrl.pathname)) return NextResponse.next();

    const publicBaseURL = process.env.SUB2API_WEB_BASE_URL || process.env.SUB2API_PUBLIC_BASE_URL || "";
    const rawSession = request.cookies.get(SESSION_COOKIE)?.value || "";
    if (await verifySession(rawSession)) return NextResponse.next();

    const response = publicBaseURL.trim()
        ? NextResponse.redirect(loginURL(publicBaseURL))
        : NextResponse.redirect(new URL("/?auth_error=login_required", request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
}

function isProtectedPagePath(pathname: string) {
    return pathname === "/canvas" || pathname.startsWith("/canvas/") || pathname === "/assets" || pathname.startsWith("/assets/");
}

function loginURL(publicBaseURL: string) {
    const redirectURL = new URL(publicBaseURL);
    redirectURL.pathname = "/login";
    redirectURL.searchParams.set("redirect", "/canvas/launch");
    return redirectURL;
}

async function verifySession(raw: string) {
    const parts = raw.split(".");
    if (parts.length !== 3) return false;
    const [payload, nonce, signature] = parts;
    if (!payload || !nonce || !signature) return false;
    const expected = await hmac(`${payload}.${nonce}`);
    if (signature !== expected) return false;
    try {
        const parsed = JSON.parse(base64urlDecode(payload)) as { userId?: number; issuedAt?: number };
        if (typeof parsed.userId !== "number" || parsed.userId <= 0) return false;
        if (typeof parsed.issuedAt !== "number" || parsed.issuedAt <= 0) return false;
        return Date.now() - parsed.issuedAt <= DEFAULT_SESSION_MAX_AGE_SECONDS * 1000;
    } catch {
        return false;
    }
}

async function hmac(value: string) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(sessionSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
    return base64urlEncode(signature);
}

function sessionSecret() {
    return process.env.CANVAS_SESSION_SECRET || process.env.SUB2API_CANVAS_INTERNAL_TOKEN || process.env.CANVAS_INTERNAL_SERVICE_TOKEN || "infinite-canvas-dev-secret";
}

function base64urlEncode(value: ArrayBuffer) {
    const bytes = new Uint8Array(value);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(value: string) {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    return decodeURIComponent(
        Array.from(atob(base64), (char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join("")
    );
}

export const config = {
    matcher: ["/((?!api|auth|_next|favicon.ico).*)"],
};
