"use client";

import { useEffect } from "react";

import { useThemeStore, type ThemeName } from "@/stores/use-theme-store";

export function Sub2APIThemeHandoff({ theme }: { theme?: string | null }) {
    const setTheme = useThemeStore((state) => state.setTheme);

    useEffect(() => {
        const nextTheme = normalizeTheme(theme || new URLSearchParams(window.location.search).get("theme"));
        if (nextTheme) setTheme(nextTheme);
    }, [setTheme, theme]);

    return null;
}

function normalizeTheme(value?: string | null): ThemeName | null {
    return value === "light" || value === "dark" ? value : null;
}
