import { NextResponse } from "next/server";

import { fetchSub2API, readSub2APISession } from "@/lib/sub2api-server";

type ImageKeysResponse = {
    items: Array<{
        id: number;
        name: string;
        masked_key: string;
        group_name?: string;
        expires_at?: string;
        quota: number;
        quota_used: number;
        image_eligible: boolean;
    }>;
};

export async function GET() {
    const session = await readSub2APISession();
    if (!session) {
        return NextResponse.json({ message: "未登录 Sub2API" }, { status: 401 });
    }
    try {
        const data = await fetchSub2API<ImageKeysResponse>(`/api/v1/internal/canvas/users/${session.userId}/image-keys`);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ message: error instanceof Error ? error.message : "读取 API Key 失败" }, { status: 502 });
    }
}
