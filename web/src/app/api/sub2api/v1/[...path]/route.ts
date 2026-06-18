import { NextResponse, type NextRequest } from "next/server";

import { fetchSub2API, readSub2APISession, sub2apiInternalBaseURL } from "@/lib/sub2api-server";

const ALLOWED_PATHS = new Set(["models", "responses", "images/generations", "images/edits"]);

type ResolveKeyResponse = {
    id: number;
    name: string;
    api_key: string;
};

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return proxySub2API(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return proxySub2API(request, context);
}

async function proxySub2API(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const session = await readSub2APISession();
    if (!session) {
        return NextResponse.json({ error: { message: "未登录 Sub2API" } }, { status: 401 });
    }
    const params = await context.params;
    const path = (params.path || []).join("/");
    if (!ALLOWED_PATHS.has(path)) {
        return NextResponse.json({ error: { message: "该接口暂不支持 Canvas 代理" } }, { status: 404 });
    }
    const keyId = Number(request.headers.get("x-canvas-api-key-id") || "");
    if (!Number.isFinite(keyId) || keyId <= 0) {
        return NextResponse.json({ error: { message: "请先选择可用于生图的 API Key" } }, { status: 400 });
    }
    try {
        const resolved = await fetchSub2API<ResolveKeyResponse>("/api/v1/internal/canvas/api-key/resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: session.userId, api_key_id: keyId }),
        });
        const upstreamURL = new URL(`/v1/${path}${request.nextUrl.search}`, sub2apiInternalBaseURL());
        const headers = new Headers(request.headers);
        headers.set("Authorization", `Bearer ${resolved.api_key}`);
        headers.delete("host");
        headers.delete("cookie");
        headers.delete("x-canvas-api-key-id");
        headers.delete("content-length");
        const init: RequestInit = {
            method: request.method,
            headers,
            body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
            cache: "no-store",
        };
        const upstream = await fetch(upstreamURL, init);
        return new NextResponse(upstream.body, {
            status: upstream.status,
            statusText: upstream.statusText,
            headers: filterResponseHeaders(upstream.headers),
        });
    } catch (error) {
        return NextResponse.json({ error: { message: error instanceof Error ? error.message : "Canvas 代理请求失败" } }, { status: 502 });
    }
}

function filterResponseHeaders(headers: Headers) {
    const next = new Headers(headers);
    next.delete("content-encoding");
    next.delete("content-length");
    next.delete("transfer-encoding");
    return next;
}
