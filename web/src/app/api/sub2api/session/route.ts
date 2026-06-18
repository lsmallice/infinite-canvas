import { NextResponse } from "next/server";

import { clearSub2APISession, readSub2APISession } from "@/lib/sub2api-server";

export async function GET() {
    const session = await readSub2APISession();
    return NextResponse.json({ authenticated: Boolean(session), user: session, site_name: process.env.CANVAS_SITE_NAME || "小冰站" });
}

export async function DELETE() {
    await clearSub2APISession();
    return NextResponse.json({ ok: true });
}
