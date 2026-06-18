import { NextResponse } from "next/server";

import { clearSub2APISession, readSub2APISession } from "@/lib/sub2api-server";

export async function GET() {
    const session = await readSub2APISession();
    const mainSiteURL = process.env.SUB2API_WEB_BASE_URL || process.env.SUB2API_PUBLIC_BASE_URL || "";
    return NextResponse.json({ authenticated: Boolean(session), user: session, main_site_url: mainSiteURL });
}

export async function DELETE() {
    await clearSub2APISession();
    return NextResponse.json({ ok: true });
}
