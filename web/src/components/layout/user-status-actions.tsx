"use client";

import type { CSSProperties } from "react";
import { BookOpen, ChevronDown, ExternalLink, Keyboard, LogOut, Settings2, UserRound } from "lucide-react";
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

type Sub2APISessionUser = {
    email?: string;
    username?: string;
    avatarUrl?: string;
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
    const [authenticated, setAuthenticated] = useState(false);
    const [user, setUser] = useState<Sub2APISessionUser | null>(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const mainSiteURL = runtimeMainSiteURL || process.env.NEXT_PUBLIC_SUB2API_WEB_BASE_URL || process.env.NEXT_PUBLIC_SUB2API_PUBLIC_BASE_URL || "";
    const logoutURL = mainSiteURL ? new URL("/canvas/logout", mainSiteURL).toString() : "/";

    useEffect(() => {
        fetch("/api/sub2api/session", { cache: "no-store" })
            .then((response) => (response.ok ? response.json() : null))
            .then((payload: { authenticated?: boolean; user?: Sub2APISessionUser | null; main_site_url?: string } | null) => {
                setAuthenticated(Boolean(payload?.authenticated));
                setUser(payload?.authenticated ? payload.user || null : null);
                setRuntimeMainSiteURL(payload?.main_site_url?.trim() || "");
            })
            .catch(() => {
                setAuthenticated(false);
                setUser(null);
                setRuntimeMainSiteURL("");
            });
    }, []);

    const logout = async () => {
        await fetch("/api/sub2api/session", { method: "DELETE" }).catch(() => undefined);
        setAuthenticated(false);
        setUser(null);
        setUserMenuOpen(false);
        window.location.href = logoutURL;
    };

    return (
        <div className="inline-flex shrink-0 items-center gap-1">
            {mainSiteURL && !authenticated ? (
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
            {authenticated ? (
                <UserAccountMenu
                    user={user}
                    open={userMenuOpen}
                    mainSiteURL={mainSiteURL}
                    iconStyle={iconStyle}
                    onOpenChange={setUserMenuOpen}
                    onLogout={() => void logout()}
                />
            ) : null}
            {onOpenShortcuts ? (
                <button type="button" className={naturalIconClass} style={iconStyle} onClick={onOpenShortcuts} aria-label="快捷键" title="快捷键">
                    <Keyboard className="size-4" />
                </button>
            ) : null}
        </div>
    );
}

function UserAccountMenu({
    user,
    open,
    mainSiteURL,
    iconStyle,
    onOpenChange,
    onLogout,
}: {
    user: Sub2APISessionUser | null;
    open: boolean;
    mainSiteURL: string;
    iconStyle?: CSSProperties;
    onOpenChange: (open: boolean) => void;
    onLogout: () => void;
}) {
    const displayName = userDisplayName(user);

    return (
        <div className="relative">
            <button
                type="button"
                className="inline-flex h-7 max-w-40 shrink-0 items-center gap-1.5 rounded-full border border-stone-200 bg-white/70 py-0.5 pl-0.5 pr-2 text-xs font-medium text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-white dark:border-stone-700 dark:bg-stone-950/60 dark:text-stone-200 dark:hover:border-stone-600"
                style={iconStyle}
                onClick={() => onOpenChange(!open)}
                aria-label={`当前账号：${displayName}`}
                title={displayName}
            >
                <AccountAvatar user={user} />
                <span className="hidden min-w-0 truncate sm:inline">{displayName}</span>
                <ChevronDown className={cn("size-3.5 shrink-0 transition", open ? "rotate-180" : "")} />
            </button>
            {open ? (
                <div className="absolute right-0 top-9 z-50 w-52 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 text-sm text-stone-700 shadow-lg dark:border-stone-800 dark:bg-stone-950 dark:text-stone-200">
                    <div className="border-b border-stone-100 px-3 py-2 dark:border-stone-800">
                        <div className="truncate font-medium">{displayName}</div>
                        {user?.email ? <div className="mt-0.5 truncate text-xs text-stone-500">{user.email}</div> : null}
                    </div>
                    {mainSiteURL ? (
                        <a href={mainSiteURL} className="flex items-center gap-2 px-3 py-2 transition hover:bg-stone-100 dark:hover:bg-stone-900">
                            <ExternalLink className="size-4" />
                            <span>返回主站</span>
                        </a>
                    ) : null}
                    <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-stone-100 dark:hover:bg-stone-900" onClick={onLogout}>
                        <LogOut className="size-4" />
                        <span>退出登录</span>
                    </button>
                </div>
            ) : null}
        </div>
    );
}

function userDisplayName(user: Sub2APISessionUser | null) {
    return user?.username?.trim() || user?.email?.trim() || "当前账号";
}

function AccountAvatar({ user }: { user: Sub2APISessionUser | null }) {
    const avatarUrl = user?.avatarUrl?.trim();
    if (avatarUrl) {
        return <img src={avatarUrl} alt="" className="size-6 shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" />;
    }
    return (
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-[11px] font-semibold text-white shadow-sm dark:bg-white dark:text-stone-950">
            {user ? userDisplayName(user).slice(0, 1).toUpperCase() : <UserRound className="size-3.5" />}
        </span>
    );
}
