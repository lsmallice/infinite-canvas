import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "canvas_sub2api_session";
const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type Sub2APISession = {
    userId: number;
    email?: string;
    username?: string;
    role?: string;
    issuedAt: number;
};

export type Sub2APIEnvelope<T> = {
    code?: number;
    message?: string;
    data?: T;
};

export function sub2apiInternalBaseURL() {
    return trimTrailingSlash(process.env.SUB2API_INTERNAL_BASE_URL || "http://sub2api-ca:8080");
}

export function sub2apiPublicBaseURL() {
    return trimTrailingSlash(process.env.SUB2API_PUBLIC_BASE_URL || "");
}

export function canvasPublicBaseURL() {
    return trimTrailingSlash(process.env.CANVAS_PUBLIC_BASE_URL || "");
}

export function canvasURL(path: string) {
    const baseURL = canvasPublicBaseURL();
    if (baseURL) return new URL(path, baseURL);
    return null;
}

export function sub2apiInternalToken() {
    return process.env.SUB2API_CANVAS_INTERNAL_TOKEN || process.env.CANVAS_INTERNAL_SERVICE_TOKEN || "";
}

export function sessionCookieName() {
    return SESSION_COOKIE;
}

export async function readSub2APISession() {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SESSION_COOKIE)?.value || "";
    return verifySession(raw);
}

export async function setSub2APISession(session: Sub2APISession) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, signSession(session), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: DEFAULT_SESSION_MAX_AGE_SECONDS,
    });
}

export async function clearSub2APISession() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
}

export async function fetchSub2API<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${sub2apiInternalBaseURL()}${path}`, {
        ...init,
        cache: "no-store",
        headers: {
            "X-Canvas-Internal-Token": sub2apiInternalToken(),
            ...(init?.headers || {}),
        },
    });
    const payload = (await response.json().catch(() => ({}))) as Sub2APIEnvelope<T>;
    if (!response.ok || payload.code) {
        throw new Error(payload.message || `Sub2API request failed: ${response.status}`);
    }
    return payload.data as T;
}

function signSession(session: Sub2APISession) {
    const payload = base64url(JSON.stringify(session));
    const nonce = randomBytes(8).toString("base64url");
    const signature = hmac(`${payload}.${nonce}`);
    return `${payload}.${nonce}.${signature}`;
}

function verifySession(raw: string): Sub2APISession | null {
    const parts = raw.split(".");
    if (parts.length !== 3) return null;
    const [payload, nonce, signature] = parts;
    if (!safeEqual(signature, hmac(`${payload}.${nonce}`))) return null;
    try {
        const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Sub2APISession;
        return typeof parsed.userId === "number" && parsed.userId > 0 ? parsed : null;
    } catch {
        return null;
    }
}

function hmac(value: string) {
    return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function sessionSecret() {
    return process.env.CANVAS_SESSION_SECRET || sub2apiInternalToken() || "infinite-canvas-dev-secret";
}

function safeEqual(a: string, b: string) {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
}

function base64url(value: string) {
    return Buffer.from(value, "utf8").toString("base64url");
}

function trimTrailingSlash(value: string) {
    return value.trim().replace(/\/+$/, "");
}
