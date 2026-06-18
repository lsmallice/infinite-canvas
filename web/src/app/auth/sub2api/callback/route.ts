import { NextResponse, type NextRequest } from "next/server";

import { canvasURL, fetchSub2API, setSub2APISession, type Sub2APISession } from "@/lib/sub2api-server";

type ExchangeResponse = {
    user: {
        id: number;
        email?: string;
        username?: string;
        role?: string;
    };
};

export async function GET(request: NextRequest) {
    const ticket = request.nextUrl.searchParams.get("ticket") || "";
    if (!ticket.trim()) {
        return NextResponse.redirect(redirectURL("/?auth_error=missing_ticket", request));
    }
    try {
        const data = await fetchSub2API<ExchangeResponse>("/api/v1/internal/canvas/sso/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticket }),
        });
        const session: Sub2APISession = {
            userId: data.user.id,
            email: data.user.email,
            username: data.user.username,
            role: data.user.role,
            issuedAt: Date.now(),
        };
        await setSub2APISession(session);
        return NextResponse.redirect(redirectURL("/", request));
    } catch (error) {
        const url = redirectURL("/", request);
        url.searchParams.set("auth_error", error instanceof Error ? error.message : "sso_failed");
        return NextResponse.redirect(url);
    }
}

function redirectURL(path: string, request: NextRequest) {
    return canvasURL(path) || new URL(path, request.url);
}
