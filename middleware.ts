import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";
const SESSION_VERSION = "v1";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const encoder = new TextEncoder();

function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 ? "=".repeat(4 - (base64.length % 4)) : "";
  const binary = atob(base64 + pad);

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Force a concrete ArrayBuffer (avoids TS complaining about ArrayBufferLike/SharedArrayBuffer)
function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const out = new Uint8Array(u8.byteLength);
  out.set(u8);
  return out.buffer;
}

async function verifyHmac(
  secret: string,
  data: string,
  sigB64Url: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const sigBytes = base64UrlToUint8Array(sigB64Url);

  return crypto.subtle.verify(
    "HMAC",
    key,
    toArrayBuffer(sigBytes),
    toArrayBuffer(encoder.encode(data)),
  );
}

async function isValidAdminSession(cookieValue?: string): Promise<boolean> {
  if (!cookieValue) return false;

  const [ver, tsStr, sig] = cookieValue.split(".");
  if (ver !== SESSION_VERSION || !tsStr || !sig) return false;

  const ts = Number(tsStr);
  if (!Number.isFinite(ts)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (now - ts > SESSION_TTL_SECONDS) return false;

  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;

  const payload = `${SESSION_VERSION}:${ts}`;
  return verifyHmac(secret, payload, sig);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    // allow the login page without a session
    if (pathname === "/admin/login") return NextResponse.next();

    const cookie = request.cookies.get(COOKIE_NAME)?.value;
    const ok = await isValidAdminSession(cookie);

    if (!ok) {
      const res = NextResponse.redirect(new URL("/admin/login", request.url));
      res.cookies.delete(COOKIE_NAME);
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
