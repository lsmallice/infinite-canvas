"use client";

import type { CSSProperties } from "react";
import { BookOpen, ExternalLink, Keyboard, LogOut, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { GitHubLink } from "@/components/layout/github-link";
import { VersionReleaseModal } from "@/components/layout/version-release-modal";
import { DOCS_URL } from "@/constant/env";
import { cn } from "@/lib/utils";
import { canvasThemes } from "@/lib/canvas-theme";
import { useConfigStore } from "@/stores/use-config-store";
import { useThemeStore } from "@/stores/use-theme-store";

type UserStatusActionsProps = {
    showConfig?: boolean;
    variant?: "default" | "canvas";
    onOpenShortcuts?: () => void;
};

export function UserStatusActions({ showConfig = true, variant = "default", onOpenShortcuts }: UserStatusActionsProps) {
    const theme = useThemeStore((state) => state.theme);
    const setTheme = useThemeStore((state) => state.setTheme);
    const openConfigDialog = useConfigStore((state) => state.openConfigDialog);
    const canvasTheme = canvasThemes[theme];
    const naturalIconClass = "inline-flex size-7 shrink-0 items-center justify-center text-stone-600 transition hover:text-stone-950 dark:text-stone-300 dark:hover:text-white [&_svg]:size-4";
    const iconStyle: CSSProperties | undefined = variant === "canvas" ? { color: canvasTheme.node.text } : undefined;
    const versionStyle = iconStyle;
    const gitHubClassName = "size-7 text-base";
    const gitHubStyle = iconStyle;
    const [runtimeMainSiteURL, setRuntimeMainSiteURL] = useState("");
    const mainSiteURL = runtimeMainSiteURL || process.env.NEXT_PUBLIC_SUB2API_WEB_BASE_URL || process.env.NEXT_PUBLIC_SUB2API_PUBLIC_BASE_URL || "";
    const logoutURL = mainSiteURL ? new URL("/canvas/logout", mainSiteURL).toString() : "/";

    useEffect(() => {
        fetch("/api/sub2api/session", { cache: "no-store" })
            .then((response) => (response.ok ? response.json() : null))
            .then((payload: { main_site_url?: string } | null) => setRuntimeMainSiteURL(payload?.main_site_url?.trim() || ""))
            .catch(() => setRuntimeMainSiteURL(""));
    }, []);

    const logout = async () => {
        await fetch("/api/sub2api/session", { method: "DELETE" }).catch(() => undefined);
        window.location.href = logoutURL;
    };

    return (
        <div className="inline-flex shrink-0 items-center gap-1">
            {mainSiteURL ? (
                <a href={mainSiteURL} className={naturalIconClass} style={iconStyle} aria-label="返回主站" title="返回主站">
                    <ExternalLink className="size-4" />
                </a>
            ) : null}
            <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" className={naturalIconClass} style={iconStyle} aria-label="文档" title="文档">
                <BookOpen className="size-4" />
            </a>
            {showConfig ? (
                <button type="button" className={naturalIconClass} style={iconStyle} onClick={() => openConfigDialog(false)} aria-label="配置" title="配置">
                    <Settings2 className="size-4" />
                </button>
            ) : null}
            <AnimatedThemeToggler theme={theme} onThemeChange={setTheme} className={naturalIconClass} style={iconStyle} aria-label={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"} title={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"} />
            <VersionReleaseModal style={versionStyle} />
            <GitHubLink className={cn("bg-transparent hover:bg-transparent dark:hover:bg-transparent", gitHubClassName)} style={gitHubStyle} />
            <button type="button" className={naturalIconClass} style={iconStyle} onClick={() => void logout()} aria-label="退出登录" title="退出登录">
                <LogOut className="size-4" />
            </button>
            {onOpenShortcuts ? (
                <button type="button" className={naturalIconClass} style={iconStyle} onClick={onOpenShortcuts} aria-label="快捷键" title="快捷键">
                    <Keyboard className="size-4" />
                </button>
            ) : null}
        </div>
    );
}
