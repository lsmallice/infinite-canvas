"use client";

import type { MouseEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { App } from "antd";

type Sub2APISessionUser = {
    email?: string;
    username?: string;
    avatarUrl?: string;
};

type Sub2APISessionPayload = {
    authenticated?: boolean;
    user?: Sub2APISessionUser | null;
    main_site_url?: string;
};

const protectedPathPrefixes = ["/canvas", "/assets"];
const fallbackMainSiteURL = "https://smallice.xyz";

export function isSub2APIProtectedPath(path: string) {
    return protectedPathPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function buildSub2APILoginURL(mainSiteURL: string) {
    const url = new URL("/login", mainSiteURL);
    url.searchParams.set("redirect", "/canvas/launch");
    return url.toString();
}

export function useSub2APIAuthGuard() {
    const { modal } = App.useApp();
    const [session, setSession] = useState<Sub2APISessionPayload | null>(null);

    const loadSession = useCallback(async () => {
        const response = await fetch("/api/sub2api/session", { cache: "no-store" });
        const payload = response.ok ? ((await response.json()) as Sub2APISessionPayload) : {};
        setSession(payload);
        return payload;
    }, []);

    useEffect(() => {
        void loadSession().catch(() => setSession({ authenticated: false }));
    }, [loadSession]);

    const showLoginRequired = useCallback(
        (featureName = "该功能", mainSiteURL = session?.main_site_url?.trim() || "") => {
            const loginBaseURL = mainSiteURL || fallbackMainSiteURL;
            modal.confirm({
                title: "需要先登录",
                content: `${featureName}需要登录 Smallice-AI 后才能使用。`,
                okText: "去登录",
                cancelText: "留在当前页",
                onOk: () => {
                    window.location.href = buildSub2APILoginURL(loginBaseURL);
                },
            });
        },
        [modal, session?.main_site_url],
    );

    const goToLogin = useCallback((mainSiteURL = session?.main_site_url?.trim() || "") => {
        window.location.href = buildSub2APILoginURL(mainSiteURL || fallbackMainSiteURL);
    }, [session?.main_site_url]);

    const guardProtectedNavigation = useCallback(
        (event: MouseEvent<HTMLElement>, path: string, featureName?: string) => {
            if (!isSub2APIProtectedPath(path) || session?.authenticated) return;
            event.preventDefault();
            void loadSession()
                .then((payload) => {
                    if (payload.authenticated) {
                        window.location.href = path;
                        return;
                    }
                    showLoginRequired(featureName, payload.main_site_url?.trim() || "");
                })
                .catch(() => showLoginRequired(featureName));
        },
        [loadSession, session?.authenticated, showLoginRequired],
    );

    return {
        authenticated: Boolean(session?.authenticated),
        mainSiteURL: session?.main_site_url?.trim() || "",
        goToLogin,
        showLoginRequired,
        guardProtectedNavigation,
    };
}
